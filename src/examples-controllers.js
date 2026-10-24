import { Grafcet } from './grafcet.js';

const contact = (tag, nc = false) => ({ tag, nc });
const row = (coil, tags, kind = 'coil') => ({ coil, kind, branches: [tags.map(t => typeof t === 'string' ? contact(t) : t)] });

export function pneumaticPlant(Circuit) {
  const c = new Circuit();
  const cyl = c.add('cyl_double', 200, 80);
  const valve = c.add('v52_sol_spring', 220, 270);
  valve.params.solA.value = 'Y1';
  const supply = c.add('supply', 230, 440);
  const wire = (a, ap, b, bp) => c.connect({ inst: a.id, port: ap }, { inst: b.id, port: bp });
  wire(supply, '1', valve, '1'); wire(valve, '4', cyl, '1'); wire(valve, '2', cyl, '2');
  const start = c.add('btn_no', 500, 100); start.params.tag.value = 'S1';
  for (let n = 0; n < 2; n++) {
    const sensor = c.add('limit_switch', 500 + 140 * n, 260);
    sensor.params.tag.value = `B${n}`; sensor.params.target.value = cyl.id; sensor.params.at.value = n;
  }
  return c;
}

export function cylinderController(c, hydraulic, mode) {
  c.controller = mode;
  if (mode === 'ladder') {
    if (hydraulic) c.ladder = { rungs: [
      row('M_cycle', ['S1'], 'set'),
      row('Y1', ['M_cycle', contact('B1', true), contact('M_return', true)]),
      row('M_return', ['M_cycle', 'B1'], 'set'),
      row('Y2', ['M_return', contact('B0', true)]),
      row('M_cycle', ['M_return', 'B0'], 'reset'),
      row('M_return', ['M_return', 'B0'], 'reset'),
    ] };
    else c.ladder = { rungs: [row('M_cycle', ['S1'], 'set'), row('M_cycle', ['B1'], 'reset'), row('Y1', ['M_cycle'])] };
  } else {
    const g = new Grafcet();
    const idle = g.addStep({ name: '0', initial: true, x: 100, y: 50 });
    const out = g.addStep({ name: '1', x: 100, y: 190, actions: [{ kind: 'continuous', target: 'Y1' }] });
    const back = g.addStep({ name: '2', x: 100, y: 330, actions: hydraulic ? [{ kind: 'continuous', target: 'Y2' }] : [] });
    g.addTransition({ from: [idle.id], to: [out.id], receptivity: 'S1 * B0', x: 117, y: 140 });
    g.addTransition({ from: [out.id], to: [back.id], receptivity: 'B1', x: 117, y: 280 });
    g.addTransition({ from: [back.id], to: [idle.id], receptivity: 'B0', x: 117, y: 430 });
    g.reset(); c.chart = g;
  }
  return c;
}

export function motorController(c, mode) {
  c.controller = mode;
  if (mode === 'ladder') c.ladder = { rungs: [{ coil: 'KM1', kind: 'coil', branches: [
    ['S1', 'S2', 'S0', 'F1'].map(t => contact(t)),
    ['KM1', 'S2', 'S0', 'F1'].map(t => contact(t)),
  ] }] };
  else {
    const g = new Grafcet();
    const idle = g.addStep({ name: '0', initial: true, x: 100, y: 50 });
    const run = g.addStep({ name: '1', x: 100, y: 220, actions: [{ kind: 'continuous', target: 'KM1' }] });
    g.addTransition({ from: [idle.id], to: [run.id], receptivity: 'S1 * S2 * S0 * F1', x: 117, y: 160 });
    g.addTransition({ from: [run.id], to: [idle.id], receptivity: '/S2 + /S0 + /F1', x: 117, y: 330 });
    g.reset(); c.chart = g;
  }
  return c;
}

export function wiredController(c,mode) {
  const module=c.add(mode==='ladder'?'plc_io':'grafcet_io',900,100);
  const power=c.add('rail_24v',780,20),ground=c.add('rail_0v',780,560),coil=c.add('sol_coil',1160,250);
  coil.params.tag.value='Y1';module.params.output0.value='Y1';
  const wire=(a,ap,b,bp)=>c.connect({inst:a.id,port:ap},{inst:b.id,port:bp});
  wire(power,'a',module,'L+');wire(ground,'a',module,'M');wire(module,'Q0',coil,'a');wire(coil,'b',ground,'a');
  for(const [n,tag] of ['S1','B0','B1'].entries()){
    module.params[`input${n}`].value=tag;
    const sensor=c.instances.find(i=>i.params.tag?.value===tag);
    wire(power,'a',sensor,'a');wire(sensor,'b',module,`I${n}`);
  }
  return c;
}
