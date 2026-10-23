// Functional three-phase topology, separate from the numerical 24 V solver.
// No sinusoidal voltages, fault currents or induction-machine equivalent circuit.
import { line, rect, circle, text } from './symbols.js';

const tag = value => ({ label: 'Aanduiding', type: 'text', value });
const pin = (id, x, y, dir = 'down') => ({ id, x, y, dir, kind: 'motor' });
const phasePins = (names, y, dir) => names.map((id, n) => pin(id, 20 + 40 * n, y, dir));
const byTag = (c, value) => c.instances.find(i => i.params.tag?.value === value && i.type === 'industrial_motor');

export function contactorClosed(inst, sim) {
  if (inst.faults?.contact_welded) return true;
  return !!sim.energized.get(inst.params.tag.value)
    && !(inst.params.interlock.value && sim.energized.get(inst.params.interlock.value));
}

/** Resolve phase identities through the actual drawn wires and closed power poles. */
export function motorNetwork(circuit, sim) {
  const parent = new Map();
  const key = (i, p) => `${i}:${p}`;
  const root = k => {
    if (!parent.has(k)) parent.set(k, k);
    let r = k;
    while (parent.get(r) !== r) r = parent.get(r);
    while (parent.get(k) !== k) { const next = parent.get(k); parent.set(k, r); k = next; }
    return r;
  };
  const join = (a, b) => parent.set(root(a), root(b));
  for (const w of circuit.wires) if (w.kind === 'motor') join(key(w.from.inst, w.from.port), key(w.to.inst, w.to.port));
  for (const i of circuit.instances) if (i.type === 'industrial_contactor' && contactorClosed(i, sim)) {
    for (let p = 1; p <= 3; p++) join(key(i.id, `L${p}`), key(i.id, `T${p}`));
  }
  const phases = new Map();
  for (const i of circuit.instances) if (i.type === 'industrial_supply' && !i.faults?.off) {
    for (let p = 1; p <= 3; p++) {
      if (Number(i.params.missing.value) === p) continue;
      const r = root(key(i.id, `L${p}`));
      if (!phases.has(r)) phases.set(r, new Set());
      phases.get(r).add(`${i.id}/${p}`);
    }
  }
  return (id, port) => phases.get(root(key(id, port))) || new Set();
}

const supply = {
  id: 'industrial_supply', name: 'Driefasenvoeding (functioneel 400 V)', short: '3~ voeding', group: 'Motorschakelingen',
  size: { w: 120, h: 60 }, ports: phasePins(['L1', 'L2', 'L3'], 60, 'down'),
  params: { tag: tag('Q1'), missing: { label: 'Fase-uitval (0 = geen, 1–3 = L1–L3)', type: 'range', value: 0, min: 0, max: 3, step: 1 } },
  faultTypes: ['off'],
  render(i) {
    return rect(2, 0, 116, 38) + text(60, 15, `${i.params.tag.value} · 3~ 400 V`)
      + text(60, 30, 'Functioneel model', 'sym-tag')
      + ['L1', 'L2', 'L3'].map((p, n) => line(20 + n * 40, 38, 20 + n * 40, 60) + text(20 + n * 40, 49, p, 'sym-tag')).join('');
  },
};

const coil = {
  id: 'industrial_coil', name: 'Contactorspoel 24 V DC', short: 'Contactorspoel', group: 'Motorschakelingen',
  coilLike: true, resistance: 240,
  size: { w: 50, h: 60 },
  ports: [{ id: 'a', x: 25, y: 0, dir: 'up', kind: 'electric' }, { id: 'b', x: 25, y: 60, dir: 'down', kind: 'electric' }],
  params: { tag: tag('KM1') }, faultTypes: ['coil_open'],
  initSim(i) { i.sim.on = false; },
  stampElectric(i, st, ctx) {
    if (!ctx.fault(i, 'coil_open')) st.conduct(ctx.net(i, 'a'), ctx.net(i, 'b'), 1 / 240);
  },
  render(i) {
    return line(25, 0, 25, 18) + rect(7, 18, 36, 24, i.sim?.on ? 'sym live-fill' : 'sym')
      + line(25, 42, 25, 60) + text(25, 34, i.params.tag.value)
      + text(40, 10, 'A1', 'sym-tag') + text(40, 55, 'A2', 'sym-tag');
  },
};

const contactor = {
  id: 'industrial_contactor', name: 'Contactor: drie hoofdcontacten', short: 'Contactor 3-polig', group: 'Motorschakelingen',
  size: { w: 120, h: 100 },
  ports: [...phasePins(['L1', 'L2', 'L3'], 0, 'up'), ...phasePins(['T1', 'T2', 'T3'], 100, 'down')],
  params: { tag: { ...tag('KM1'), label: 'Bijbehorende contactorspoel' }, interlock: { label: 'Mechanisch vergrendeld met spoel', type: 'text', value: '' } },
  faultTypes: ['contact_welded'],
  initSim(i) { i.sim.closed = false; },
  updateState(i, ctx) { i.sim.closed = contactorClosed(i, ctx.sim); },
  render(i) {
    return text(60, -10, i.params.tag.value, 'sym-tag')
      + [20, 60, 100].map((x, n) => line(x, 0, x, 35) + line(x, 65, x, 100)
        + line(x, 35, i.sim?.closed ? x : x + 14, 65)
        + text(x + 10, 16, `L${n + 1}`, 'sym-tag') + text(x + 10, 91, `T${n + 1}`, 'sym-tag')).join('')
      + line(10, 50, 112, 50, 'sym thin');
  },
};

const motor = {
  id: 'industrial_motor', name: 'Driefasenmotor (functioneel besturingsmodel)', short: 'Driefasenmotor', group: 'Motorschakelingen',
  size: { w: 120, h: 140 }, ports: phasePins(['U', 'V', 'W'], 0, 'up'),
  params: {
    tag: tag('M1'), speed: { label: 'Nominaal toerental', type: 'range', value: 1450, min: 100, max: 6000, step: 50, unit: 'omw/min' },
    current: { label: 'Nominale stroom (model)', type: 'range', value: 4, min: 0.1, max: 100, step: 0.1, unit: 'A' },
    load: { label: 'Belasting / nominale stroom', type: 'range', value: 1, min: 0, max: 2, step: 0.1 },
  },
  initSim(i) { Object.assign(i.sim, { rpm: 0, current: 0, direction: 0, status: 'Stilstand' }); },
  integrate(i, ctx) {
    const net = motorNetwork(ctx.sim.circuit, ctx.sim);
    const phases = ['U', 'V', 'W'].map(p => [...net(i.id, p)]);
    let direction = 0;
    let status = 'Stilstand';
    if (phases.some(p => p.length > 1)) status = 'Faseconflict';
    else if (phases.every(p => p.length === 1)) {
      const entries = phases.map(p => p[0].split('/'));
      const source = new Set(entries.map(p => p[0]));
      const order = entries.map(p => Number(p[1]));
      if (source.size !== 1 || new Set(order).size !== 3) status = 'Ongeldige voeding';
      else {
        direction = ((order[1] - order[0] + 3) % 3 === 1) ? 1 : -1;
        status = direction > 0 ? 'Rechtsom' : 'Linksom';
      }
    } else if (phases.some(p => p.length)) status = 'Fase-uitval';
    i.sim.direction = direction;
    i.sim.status = status;
    const target = direction * i.params.speed.value;
    i.sim.rpm += (target - i.sim.rpm) * (1 - Math.exp(-ctx.dt / 0.3));
    if (Math.abs(i.sim.rpm) < 0.01) i.sim.rpm = 0;
    // Didactic current estimate, not a measured or solved AC current.
    i.sim.current = direction ? i.params.current.value * i.params.load.value : 0;
  },
  render(i) {
    return [20, 60, 100].map((x, n) => line(x, 0, x, 28) + text(x + 10, 12, ['U', 'V', 'W'][n], 'sym-tag')).join('')
      + circle(60, 53, 30, i.sim?.direction ? 'sym live-fill' : 'sym') + text(60, 51, 'M') + text(60, 69, '3~')
      + text(60, 99, `${i.params.tag.value} · ${i.sim?.status || 'Stilstand'}`, 'sym-tag')
      + text(60, 116, `${Math.round(i.sim?.rpm || 0)} omw/min`, 'sym-tag')
      + text(60, 133, 'Functioneel model', 'sym-tag');
  },
};

const overload = {
  id: 'industrial_overload', name: 'Thermisch motorrelais: NC 95–96 en reset', short: 'Thermisch relais', group: 'Motorschakelingen',
  size: { w: 100, h: 70 },
  ports: [{ id: 'a', x: 25, y: 0, dir: 'up', kind: 'electric' }, { id: 'b', x: 25, y: 70, dir: 'down', kind: 'electric' }],
  params: {
    tag: tag('F1'), motor: { label: 'Bewaakte motor (aanduiding)', type: 'text', value: 'M1' },
    rated: { label: 'Ingestelde nominale stroom', type: 'range', value: 4, min: 0.1, max: 100, step: 0.1, unit: 'A' },
    delay: { label: 'I²t-tijdbasis (onderwijsmodel)', type: 'range', value: 3, min: 0.1, max: 60, step: 0.1, unit: 's' },
  },
  interactive: true, toggle: true,
  initSim(i) { Object.assign(i.sim, { tripped: false, heat: 0, pressed: false }); },
  stampElectric(i, st, ctx) { st.conduct(ctx.net(i, 'a'), ctx.net(i, 'b'), i.sim.tripped ? 1e-12 : 1e3); },
  integrate(i, ctx) {
    const m = byTag(ctx.sim.circuit, i.params.motor.value);
    const ratio = (m?.sim.current || 0) / Math.max(0.1, i.params.rated.value);
    i.sim.heat = Math.max(0, Math.min(1, i.sim.heat + ctx.dt * (ratio > 1 ? (ratio * ratio - 1) / Math.max(0.1, i.params.delay.value) : -1 / 5)));
    if (i.sim.heat >= 1) i.sim.tripped = true;
    if (i.sim.pressed) {
      if (i.sim.heat < 0.2 && ratio <= 1) i.sim.tripped = false;
      i.sim.pressed = false;
    }
  },
  render(i) {
    return line(25, 0, 25, 20) + line(25, 48, 25, 70)
      + line(25, 20, i.sim?.tripped ? 40 : 25, 48) + line(18, 48, 32, 48)
      + text(62, 20, i.params.tag.value, 'sym-tag') + text(62, 37, i.sim?.tripped ? 'UIT' : '95–96', 'sym-tag')
      + text(62, 55, 'Reset', 'sym-tag');
  },
};

const dcMotor = {
  id: 'industrial_dc_motor', name: 'Gelijkstroommotor 24 V (transportbandmodel)', short: 'DC-motor 24 V', group: 'Motorschakelingen',
  size: { w: 100, h: 100 }, resistance: 24,
  ports: [{ id: 'a', x: 50, y: 0, dir: 'up', kind: 'electric' }, { id: 'b', x: 50, y: 100, dir: 'down', kind: 'electric' }],
  params: { tag: tag('M2'), speed: { label: 'Toerental bij 24 V (model)', type: 'range', value: 75, min: 25, max: 3000, step: 25, unit: 'omw/min' } },
  faultTypes: ['off'],
  initSim(i) { Object.assign(i.sim, { rpm: 0, on: false }); },
  stampElectric(i, st, ctx) {
    if (!ctx.fault(i, 'off')) st.conduct(ctx.net(i, 'a'), ctx.net(i, 'b'), 1 / 24);
  },
  integrate(i, ctx) {
    const v = ctx.fault(i, 'off') ? 0 : ctx.sim.volts(i.id, 'a') - ctx.sim.volts(i.id, 'b');
    i.sim.on = Math.abs(v) > 1;
    // Teaching approximation: resistive electrical load and first-order speed response.
    // No back EMF, torque balance, inductance or regenerative braking is modelled.
    const target = Math.max(-1, Math.min(1, v / 24)) * i.params.speed.value;
    i.sim.rpm += (target - i.sim.rpm) * (1 - Math.exp(-ctx.dt / 0.25));
    if (Math.abs(i.sim.rpm) < 0.01) i.sim.rpm = 0;
  },
  render(i) {
    return line(50, 0, 50, 18) + circle(50, 40, 22, i.sim?.on ? 'sym live-fill' : 'sym')
      + text(50, 45, 'M ⎓') + text(50, 76, `${i.params.tag.value} · ${Math.round(i.sim?.rpm || 0)} omw/min`, 'sym-tag')
      + line(50, 62, 50, 100);
  },
};

export const INDUSTRIAL_CATALOG = [supply, coil, contactor, motor, overload, dcMotor];
