import assert from 'node:assert/strict';
import { Circuit, EXAMPLES } from '../src/circuit.js';
import { Simulation } from '../src/engine.js';
import { Grafcet } from '../src/grafcet.js';
import { History } from '../src/history.js';
import { LadderRuntime, controllerSignal, validateLadder } from '../src/ladder.js';
import { drawGrafcet } from '../src/grafcet-view.js';

const run = (sim, t) => { for (let n = 0; n < Math.round(t * 1000); n++) sim.step(.001); };
const find = (c, tag, type) => c.instances.find(i => i.params.tag?.value === tag && (!type || i.type === type));
export const tests = [];

for (const mode of ['grafcet', 'ladder']) for (const domain of ['Pneumatic', 'Hydraulic', 'Motor']) {
  tests.push({ name: `${mode}: ${domain} wordt vanuit hetzelfde document aangestuurd en heropend`, fn() {
    const c = Circuit.fromJSON(EXAMPLES[mode + domain].build().toJSON());
    const sim = new Simulation(c);
    assert.equal(c.controller, mode);
    run(sim, .1);
    find(c, 'S1', 'btn_no').sim.pressed = true; run(sim, .1); find(c, 'S1', 'btn_no').sim.pressed = false;
    if (domain === 'Motor') {
      run(sim, .8); const motor = find(c, 'M1', 'industrial_motor');
      assert.equal(motor.sim.direction, 1); assert(motor.sim.rpm > 1300);
      assert.equal(find(c, 'KM1', 'industrial_coil').sim.on, true);
      find(c, 'S2', 'btn_nc').sim.pressed = true; run(sim, .02);
      assert.equal(motor.sim.direction, 0);
      find(c, 'S2', 'btn_nc').sim.pressed = false; run(sim, .1);
      assert.equal(motor.sim.direction, 0, 'Loslaten van stop mag niet opnieuw starten');
    } else {
      const cyl = c.positionTargets()[0]; let max = cyl.sim.x;
      for (let n = 0; n < 10000; n++) { sim.step(.001); max = Math.max(max, cyl.sim.x); }
      assert(max > .95, `Cilinder moet de uit-eindstand bereiken: ${max}`);
      assert(cyl.sim.x < .05, `Cilinder moet terugkomen: ${cyl.sim.x}`);
      assert.equal(sim.energized.get('Y1'), false);
      if (domain === 'Hydraulic') assert.equal(sim.energized.get('Y2'), false);
    }
    assert.equal(sim.controllerError, null);
    assert.equal(sim.diagnostics.failures, 0);
  } });
}

tests.push({ name: 'Ladder: serie/parallel en NC-ingangen volgen contactniveau', fn() {
  const c = EXAMPLES.ladderMotor.build(); const sim = new Simulation(c);
  assert.equal(controllerSignal(sim, 'S2'), true); assert.equal(controllerSignal(sim, 'S0'), true);
  const r = new LadderRuntime(sim, { rungs: [{ coil: 'test', kind: 'coil', branches: [[{ tag: 'S1', nc: false }], [{ tag: 'S2', nc: true }]] }] });
  r.tick(.001); assert.equal(sim.energized.get('test'), false);
  find(c, 'S2', 'btn_nc').sim.pressed = true; r.tick(.001); assert.equal(sim.energized.get('test'), true);
} });

tests.push({ name: 'Ladder: TON en TOF schakelen met simulatietijd; reset wist timers', fn() {
  const c = EXAMPLES.ladderMotor.build();
  c.ladder = { rungs: ['ton','tof'].map(kind => ({ coil: kind, kind, delay: .1, branches: [[{ tag: 'S1', nc: false }]] })) };
  const sim = new Simulation(c); const start = find(c, 'S1', 'btn_no');
  start.sim.pressed = true; run(sim, .05);
  assert.equal(sim.energized.get('ton'), false); assert.equal(sim.energized.get('tof'), true);
  run(sim, .06); assert.equal(sim.energized.get('ton'), true);
  start.sim.pressed = false; run(sim, .05);
  assert.equal(sim.energized.get('ton'), false); assert.equal(sim.energized.get('tof'), true);
  run(sim, .06); assert.equal(sim.energized.get('tof'), false);
  sim.reset(); run(sim, .01); assert.equal(sim.energized.get('ton'), false); assert.equal(sim.energized.get('tof'), false);
} });

tests.push({ name: 'Besturingskeuze: GRAFCET en Ladder overschrijven elkaar niet', fn() {
  const c = EXAMPLES.ladderMotor.build();
  c.ladder = { rungs: [{ coil: 'KM1', kind: 'coil', branches: [[{ tag: 'S2', nc: false }]] }] };
  const g = new Grafcet();g.addStep({ name:'0', initial:true, actions:[{ kind:'continuous',target:'KM1' }] });g.reset();c.chart=g;
  c.controller='manual'; const sim=new Simulation(c);run(sim,.01); assert.equal(sim.energized.get('KM1'),false);
  c.controller='grafcet'; sim.reset();run(sim,.01); assert.equal(sim.energized.get('KM1'),true);
  c.ladder.rungs[0].branches[0][0].nc=true; c.controller='ladder';sim.reset();run(sim,.01);
  assert.equal(sim.energized.get('KM1'),false); assert.equal(find(c,'M1','industrial_motor').sim.direction,0);
} });

tests.push({ name: 'Virtuele besturing respecteert een onderbroken spoel', fn() {
  for (const mode of ['grafcet','ladder']) {
    const c=EXAMPLES[mode+'Motor'].build();const sim=new Simulation(c);
    find(c,'KM1','industrial_coil').faults.coil_open=true;
    find(c,'S1','btn_no').sim.pressed=true;run(sim,.1);
    assert.equal(sim.energized.get('KM1'),false);
    assert.equal(find(c,'M1','industrial_motor').sim.direction,0);
  }
} });

tests.push({ name: 'Ladder: ongeldige takken worden afgewezen en uitgangen vallen af', fn() {
  assert(validateLadder({rungs:[{coil:'Y1',kind:'coil',branches:[[]]}]}).length);
  assert(validateLadder({rungs:[{coil:'Y1',kind:'ton',delay:-1,branches:[[{tag:'S1',nc:false}]]}]}).length);
  const c=EXAMPLES.ladderMotor.build();c.ladder.rungs[0].branches=[[]];
  const sim=new Simulation(c);find(c,'S1','btn_no').sim.pressed=true;run(sim,.01);
  assert(sim.controllerError);assert.equal(sim.energized.get('KM1'),false);
} });

tests.push({ name: 'Ladder: programma, timers en besturingskeuze blijven bewaard bij undo/redo', fn() {
  const c=EXAMPLES.ladderMotor.build();const history=new History(c);
  c.ladder.rungs[0].kind='ton';c.ladder.rungs[0].delay=.4;history.push(c);
  assert.equal(history.undo().ladder.rungs[0].kind,'coil');
  const restored=history.redo();assert.equal(restored.ladder.rungs[0].delay,.4);assert.equal(restored.controller,'ladder');
} });

tests.push({ name: 'GRAFCET-tekenvlak houdt teruglus en overgang onder de laatste stap in beeld', fn() {
  const c = EXAMPLES.grafcetHydraulic.build();
  const attributes = {};
  const svg = { setAttribute: (k,v) => attributes[k] = v, innerHTML: '' };
  drawGrafcet(svg, c.chart, { width: 800, height: 700 });
  const [x,y,w,h] = attributes.viewBox.split(' ').map(Number);
  assert(y + h > 440, 'De teruggaande overgang op y=430 mag niet buiten beeld vallen');
  assert(x + w > 290, 'De teruglus moet naast de actiekaders passen');
  assert(svg.innerHTML.includes('L 291 430'), 'De teruglus loopt buiten de stappen om');
} });

tests.push({ name: 'Ladder-import bewaart lege bewerkbare contacten en weigert beschadigde structuren', fn() {
  const data = EXAMPLES.ladderMotor.build().toJSON();
  data.ladder.rungs[0].branches[0][0].tag = '';
  assert.equal(Circuit.fromJSON(data).ladder.rungs[0].branches[0][0].tag, '');
  data.ladder.rungs[0].branches = [null];
  assert.throws(() => Circuit.fromJSON(data), /laddercontacten/);
} });
