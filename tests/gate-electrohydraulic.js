import assert from 'node:assert/strict';
import { Circuit, EXAMPLES } from '../src/circuit.js';
import { Simulation } from '../src/engine.js';

const run = (sim, seconds) => { for (let n = 0; n < seconds * 1000; n++) sim.step(0.001); };
const byTag = (c, tag) => c.instances.find(i => i.params.tag?.value === tag);
export const tests = [
  { name: 'Gemengd werkvlak: pneumatische sensor vergrendelt hydraulisch uitschuiven', fn() {
    const c = Circuit.fromJSON(EXAMPLES.mixedInterlock.build().toJSON());
    const sim = new Simulation(c);
    const hydraulic = c.instances.find(i => i.type === 'h_cyl');
    const pneumatic = byTag(c, 'P1');
    assert.equal(byTag(c, 'B2').params.target.value, pneumatic.id);
    assert.deepEqual(new Set(c.wires.map(w => w.kind)), new Set(['hydraulic', 'electric', 'pneumatic']));
    byTag(c, 'S1').sim.pressed = true;
    run(sim, 1);
    assert(hydraulic.sim.x < 0.01, 'Zonder pneumatische vrijgave mag hydraulica niet uitschuiven');
    byTag(c, 'P-S1').sim.pressed = true;
    run(sim, 5);
    assert(pneumatic.sim.x > 0.99);
    assert.equal(byTag(c, 'B2').sim.closed, true);
    assert(hydraulic.sim.x > 0.99, 'Met vrijgave moet de hydraulische cilinder uitschuiven');
    byTag(c, 'P-S1').sim.pressed = false;
    run(sim, 1);
    assert(pneumatic.sim.x < 0.01);
    assert.equal(byTag(c, 'B2').sim.closed, false);
    assert.equal(c.instances.find(i => i.type === 'h_v43_closed_sol').sim.state, 1);
    byTag(c, 'S1').sim.pressed = false;
    byTag(c, 'S2').sim.pressed = true;
    run(sim, 4);
    assert(hydraulic.sim.x < 0.01, 'Inschuiven blijft beschikbaar zonder pneumatische vrijgave');
    assert.equal(sim.diagnostics.failures, 0);
  } },
  { name: 'Sensorselectie bevat pneumatische én hydraulische cilinders', fn() {
    const c = new Circuit();
    for (const type of ['cyl_single', 'cyl_double', 'cyl_through', 'h_cyl', 'h_pump', 'btn_no']) c.add(type, 0, 0);
    assert.deepEqual(c.positionTargets().map(i => i.type), ['cyl_single', 'cyl_double', 'cyl_through', 'h_cyl']);
  } },
  { name: 'Elektrische sensoren lezen hydraulische cilinderposities uit', fn() {
    const c = new Circuit();
    const cyl = c.add('h_cyl', 0, 0);
    const sensors = ['limit_switch', 'reed', 'prox_ind', 'prox_cap', 'prox_opt'].map(type => c.add(type, 0, 0));
    for (const sensor of sensors) sensor.params.target.value = cyl.id;
    const sim = new Simulation(c);
    for (const x of [0, 0.5, 1]) {
      cyl.sim.x = x;
      run(sim, 0.005);
      for (const sensor of sensors) assert.equal(sensor.sim.closed, x === 1, `${sensor.type}, positie ${x}`);
    }
  } },
  { name: 'S1/Y1 schuift hydraulisch uit; S2/Y2 in; B0/B1 schakelen lampen', fn() {
    const c = EXAMPLES.electroHydraulic.build();
    const sim = new Simulation(c);
    const cyl = c.instances.find(i => i.type === 'h_cyl');
    const valve = c.instances.find(i => i.type === 'h_v43_closed_sol');
    run(sim, 0.1);
    assert.equal(byTag(c, 'B0').sim.closed, true);
    assert.equal(byTag(c, 'H0').sim.on, true);
    byTag(c, 'S1').sim.pressed = true;
    run(sim, 4);
    assert.equal(valve.sim.state, 2);
    assert(cyl.sim.x > 0.99, `Uitschuiven: ${cyl.sim.x}`);
    assert.equal(byTag(c, 'B1').sim.closed, true);
    assert.equal(byTag(c, 'H1').sim.on, true);
    assert.equal(byTag(c, 'H0').sim.on, false);
    byTag(c, 'S1').sim.pressed = false;
    run(sim, 0.02);
    assert.equal(valve.sim.state, 1);
    byTag(c, 'S2').sim.pressed = true;
    run(sim, 4);
    assert.equal(valve.sim.state, 0);
    assert(cyl.sim.x < 0.01, `Inschuiven: ${cyl.sim.x}`);
    assert.equal(byTag(c, 'H0').sim.on, true);
    assert.equal(byTag(c, 'H1').sim.on, false);
    assert.equal(sim.diagnostics.failures, 0);
  } },
  { name: 'Opslaan/openen behoudt sensorkoppeling; verwijderen wist de koppeling', fn() {
    const c = Circuit.fromJSON(EXAMPLES.electroHydraulic.build().toJSON());
    const cyl = c.positionTargets()[0];
    assert(cyl);
    for (const tag of ['B0', 'B1']) assert.equal(byTag(c, tag).params.target.value, cyl.id);
    c.remove(cyl.id);
    for (const tag of ['B0', 'B1']) assert.equal(byTag(c, tag).params.target.value, null);
    assert.equal(c.positionTargets().length, 0);
  } },
];
