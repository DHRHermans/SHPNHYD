import assert from 'node:assert/strict';
import { Circuit, EXAMPLES } from '../src/circuit.js';
import { Simulation } from '../src/engine.js';
import { buildParts } from '../src/partslist.js';
import { quantitiesFor } from '../src/scope.js';

const run = (sim, seconds) => { for (let n = 0; n < Math.round(seconds * 1000); n++) sim.step(0.001); };
const setup = (reverse = false) => {
  const c = Circuit.fromJSON(EXAMPLES[reverse ? 'motorReverse' : 'motorDirect'].build().toJSON());
  const sim = new Simulation(c);
  const part = (tag, type) => c.instances.find(i => i.params.tag?.value === tag && (!type || i.type === type));
  const tap = tag => { const b = part(tag); b.sim.pressed = true; run(sim, 0.05); b.sim.pressed = false; run(sim, 0.02); };
  return { c, sim, part, tap, motor: part('M1') };
};

export const tests = [
  { name: 'Transportband: 24 V-motor start via zelfhouding en loopt uit na stop', fn() {
    const c = Circuit.fromJSON(EXAMPLES.motorConveyor.build().toJSON());
    const sim = new Simulation(c);
    const motor = c.instances.find(i => i.type === 'industrial_dc_motor');
    const start = c.instances.find(i => i.type === 'btn_no');
    const stop = c.instances.find(i => i.type === 'btn_nc');
    start.sim.pressed = true; run(sim, 0.05); start.sim.pressed = false;
    run(sim, 1); assert(motor.sim.rpm > 73); assert.equal(motor.sim.on, true);
    assert.deepEqual(quantitiesFor(c, motor.id, 'a'), ['voltage', 'current']);
    stop.sim.pressed = true; run(sim, 0.02); stop.sim.pressed = false;
    run(sim, 2); assert(Math.abs(motor.sim.rpm) < 0.1); assert.equal(motor.sim.on, false);
  } },
  { name: 'Gelijkstroommotor: ompolen keert draairichting om; storing onderbreekt aandrijving', fn() {
    const c = new Circuit();
    const power = c.add('rail_24v', 0, 0), ground = c.add('rail_0v', 0, 200);
    const motor = c.add('industrial_dc_motor', 0, 100);
    c.connect({ inst: power.id, port: 'a' }, { inst: motor.id, port: 'b' });
    c.connect({ inst: ground.id, port: 'a' }, { inst: motor.id, port: 'a' });
    const sim = new Simulation(c); run(sim, 1);
    assert(motor.sim.rpm < -73);
    motor.faults.off = true; run(sim, 2);
    assert(Math.abs(motor.sim.rpm) < 0.1); assert.equal(motor.sim.on, false);
  } },
  { name: 'Motor: korte startpuls geeft zelfhouding; stop onderbreekt en voorkomt herstart', fn() {
    const { sim, part, tap, motor } = setup();
    run(sim, 0.1); assert.equal(motor.sim.direction, 0);
    tap('S1'); run(sim, 1); assert.equal(motor.sim.direction, 1); assert(motor.sim.rpm > 1400);
    tap('S2'); run(sim, 3); assert.equal(motor.sim.direction, 0); assert(Math.abs(motor.sim.rpm) < 1);
    assert.equal(part('KM1', 'industrial_coil').sim.on, false);
    assert.equal(sim.diagnostics.failures, 0);
  } },
  { name: 'Motor: vergrendelde noodstop blijft uitschakelen tot reset en nieuwe start', fn() {
    const { sim, part, tap, motor } = setup();
    tap('S1'); part('S0').sim.pressed = true; run(sim, 0.02);
    tap('S1'); assert.equal(motor.sim.direction, 0);
    part('S0').sim.pressed = false; run(sim, 0.1); assert.equal(motor.sim.direction, 0);
    tap('S1'); assert.equal(motor.sim.direction, 1);
  } },
  { name: 'Motor: omkeersturing wisselt twee fasen; elektrisch vergrendeld tijdens bedrijf', fn() {
    const { sim, part, tap, motor } = setup(true);
    tap('S1'); tap('S3'); run(sim, 1);
    assert.equal(motor.sim.direction, 1); assert.equal(part('KM2', 'industrial_coil').sim.on, false);
    tap('S2'); tap('S3'); run(sim, 1);
    assert.equal(motor.sim.direction, -1); assert(motor.sim.rpm < -1300);
    tap('S1'); assert.equal(part('KM1', 'industrial_coil').sim.on, false);
  } },
  { name: 'Motor: gelijktijdige startknoppen sluiten geen tegengestelde hoofdcontacten', fn() {
    const { sim, part, motor } = setup(true);
    part('S1').sim.pressed = part('S3').sim.pressed = true;
    for (let n = 0; n < 300; n++) {
      sim.step(0.001);
      assert.equal(motor.sim.direction, 0);
      assert.notEqual(motor.sim.status, 'Faseconflict');
      assert(!(part('KM1', 'industrial_contactor').sim.closed && part('KM2', 'industrial_contactor').sim.closed));
    }
  } },
  { name: 'Motor: fase-uitval en verkeerd doorverbonden fasen worden herkend', fn() {
    const { c, sim, part, tap, motor } = setup();
    tap('S1'); part('Q1').params.missing.value = 2; run(sim, 0.01);
    assert.equal(motor.sim.status, 'Fase-uitval'); assert.equal(motor.sim.direction, 0);
    part('Q1').params.missing.value = 0;
    c.connect({ inst: part('Q1').id, port: 'L1' }, { inst: part('Q1').id, port: 'L2' });
    run(sim, 0.01); assert.equal(motor.sim.status, 'Faseconflict'); assert.equal(motor.sim.direction, 0);
  } },
  { name: 'Motor: defecte spoel start niet; vastgelaste hoofdcontacten houden de motor gevoed', fn() {
    const { sim, part, tap, motor } = setup();
    part('KM1', 'industrial_coil').faults.coil_open = true;
    tap('S1'); assert.equal(motor.sim.direction, 0);
    part('KM1', 'industrial_contactor').faults.contact_welded = true;
    run(sim, 0.01); assert.equal(motor.sim.direction, 1);
    part('Q1').faults.off = true; run(sim, 0.01); assert.equal(motor.sim.direction, 0);
  } },
  { name: 'Motor: thermisch relais schakelt uit, vergrendelt en reset pas na afkoeling', fn() {
    const { sim, part, tap, motor } = setup();
    const f = part('F1'); motor.params.load.value = 2;
    tap('S1'); run(sim, 1.2);
    assert.equal(f.sim.tripped, true); assert.equal(motor.sim.direction, 0);
    f.sim.pressed = true; run(sim, 0.001); assert.equal(f.sim.tripped, true);
    run(sim, 5); assert.equal(f.sim.tripped, true); // cooling alone must not reset
    motor.params.load.value = 1;
    f.sim.pressed = true; run(sim, 0.02); assert.equal(f.sim.tripped, false);
    assert.equal(motor.sim.direction, 0); // no automatic restart
    tap('S1'); run(sim, 4); assert.equal(f.sim.tripped, false); assert.equal(motor.sim.direction, 1);
  } },
  { name: 'Motor: langere I²t-tijdbasis vertraagt uitschakeling', fn() {
    const tripTimes = [1, 3].map(delay => {
      const { sim, part, tap, motor } = setup();
      motor.params.load.value = 2; part('F1').params.delay.value = delay; tap('S1');
      while (!part('F1').sim.tripped && sim.time < 4) sim.step(0.001);
      assert.equal(part('F1').sim.tripped, true);
      return sim.time;
    });
    assert(tripTimes[1] > tripTimes[0] * 2.5);
  } },
  { name: 'Motor: hoofdkring weigert lucht-, olie- en 24 V-draden; geen fictieve spanningmeetprobe', fn() {
    const { c, motor } = setup();
    for (const [type, port] of [['rail_24v', 'a'], ['supply', '1'], ['h_pump', 'P']]) {
      const i = c.add(type, 0, 0);
      assert.equal(c.connect({ inst: i.id, port }, { inst: motor.id, port: 'U' }), null);
    }
    assert.deepEqual(quantitiesFor(c, motor.id, 'U'), []);
  } },
  { name: 'Motor: JSON behoudt vergrendeling en thermische instellingen; onderdelenlijst is elektrisch', fn() {
    const { c, part } = setup(true);
    part('F1').params.rated.value = 6;
    const restored = Circuit.fromJSON(c.toJSON());
    assert.equal(restored.instances.find(i => i.type === 'industrial_overload').params.rated.value, 6);
    assert.equal(restored.instances.find(i => i.type === 'industrial_contactor').params.interlock.value, 'KM2');
    const rows = buildParts(restored).filter(r => r.def.group === 'Motorschakelingen');
    assert(rows.length >= 5); assert(rows.every(r => r.domain === 3));
    assert(rows.some(r => r.def.id === 'industrial_motor' && r.spec.includes('1450')));
  } },
];
