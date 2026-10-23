// Serializable graphical ladder networks over the existing soft-PLC runtime.
import { PLC, rung, setRung, resetRung, no, nc, and, or, TON, TOF } from './plc.js';

export const controllerMode = circuit => circuit.controller || (circuit.chart ? 'grafcet' : 'manual');

export function controllerSignal(sim, tag) {
  // Inputs represent closed/healthy contacts, not merely a button's pressed flag.
  const candidates = sim.circuit.instances.filter(i => i.params.tag?.value === tag);
  const input = candidates.find(i => ['btn_no', 'btn_nc', 'estop', 'industrial_overload'].includes(i.type) || i.params.target);
  if (input) {
    if (input.type === 'btn_nc' || input.type === 'estop') return !input.sim.pressed;
    if (input.type === 'industrial_overload') return !input.sim.tripped;
    if (input.sim.closed != null) return !!input.sim.closed;
    return !!input.sim.pressed;
  }
  return sim.energized.has(tag) ? !!sim.energized.get(tag) : sim.signal(tag);
}

export function applyControllerOutputs(sim, outputs) {
  for (const [tag, requested] of outputs) {
    const coils = sim.circuit.instances.filter(i => i.params.tag?.value === tag && sim.circuit.defOf(i)?.coilLike && i.type !== 'lamp');
    const on = !!requested && !coils.some(i => i.faults?.coil_open);
    sim.energized.set(tag, on);
    for (const i of coils) i.sim.on = on;
  }
}

export function validateLadder(program) {
  const errors = [];
  if (!program || !Array.isArray(program.rungs)) return ['Het ladderprogramma heeft geen geldige netwerklijst.'];
  if (!program.rungs.length) return ['Voeg minstens één laddernetwerk toe.'];
  if (program.rungs.length > 256) return ['Maximaal 256 laddernetwerken.'];
  const validTag = t => typeof t === 'string' && t.trim() === t && t.length > 0 && t.length <= 80 && !/[\s<>]/.test(t);
  for (const [n, row] of program.rungs.entries()) {
    const at = `Netwerk ${n + 1}`;
    if (!validTag(row?.coil)) errors.push(`${at}: geef de uitgang een aanduiding.`);
    if (!['coil', 'set', 'reset', 'ton', 'tof'].includes(row?.kind)) errors.push(`${at}: onbekend spoeltype.`);
    if (['ton', 'tof'].includes(row?.kind) && (!Number.isFinite(row.delay) || row.delay < 0 || row.delay > 3600)) errors.push(`${at}: kies een vertraging van 0 tot 3600 seconden.`);
    if (!Array.isArray(row?.branches) || !row.branches.length || row.branches.length > 32) { errors.push(`${at}: voeg een geldige contacttak toe.`); continue; }
    for (const branch of row.branches) {
      if (!Array.isArray(branch) || !branch.length || branch.length > 64) { errors.push(`${at}: elke tak moet 1 tot 64 contacten bevatten.`); continue; }
      for (const contact of branch) if (!validTag(contact?.tag) || typeof contact?.nc !== 'boolean') errors.push(`${at}: vul een geldige contactaanduiding in.`);
    }
  }
  return errors;
}

// Preserve editable drafts (including empty contacts), while rejecting malformed JSON shapes.
export function copyLadder(program) {
  const kinds = ['coil', 'set', 'reset', 'ton', 'tof'];
  if (!program || !Array.isArray(program.rungs) || program.rungs.length > 256) throw new Error('Ongeldig ladderprogramma.');
  for (const row of program.rungs) {
    if (!row || typeof row.coil !== 'string' || !kinds.includes(row.kind) || !Array.isArray(row.branches) || row.branches.length > 32) throw new Error('Ongeldig laddernetwerk.');
    for (const branch of row.branches) {
      if (!Array.isArray(branch) || branch.length > 64 || branch.some(c => !c || typeof c.tag !== 'string' || typeof c.nc !== 'boolean')) throw new Error('Ongeldige laddercontacten.');
    }
  }
  return structuredClone(program);
}

export class LadderRuntime {
  constructor(sim, program) {
    const errors = validateLadder(program);
    if (errors.length) throw new Error(errors.join(' '));
    this.sim = sim;
    this.program = structuredClone(program);
    this.outputs = new Map(program.rungs.map(r => [r.coil, false]));
    this.inputs = new Map();
    for (const row of program.rungs) for (const branch of row.branches) for (const c of branch) {
      if (!this.outputs.has(c.tag)) this.inputs.set(c.tag, false);
    }
    this.live = [];
    const io = {
      has: name => this.outputs.has(name) || this.inputs.has(name),
      get: name => this.outputs.has(name) ? this.outputs.get(name) : this.inputs.get(name),
      set: (name, value) => this.outputs.set(name, !!value),
      scan: () => { for (const tag of this.inputs.keys()) this.inputs.set(tag, controllerSignal(sim, tag)); this.live = []; },
      flush: () => applyControllerOutputs(sim, this.outputs),
    };
    this.plc = new PLC(io).loadLadder(program.rungs.map(row => {
      const timer = row.kind === 'ton' ? new TON() : row.kind === 'tof' ? new TOF() : null;
      const logic = or(...row.branches.map(branch => and(...branch.map(c => c.nc ? nc(c.tag) : no(c.tag)))));
      const observed = context => {
        const contacts = row.branches.map(branch => branch.map(c => c.nc ? !context.get(c.tag) : !!context.get(c.tag)));
        this.live.push({ contacts, branches: contacts.map(b => b.every(Boolean)), powered: !!logic(context) });
        const powered = logic(context);
        if (timer) { timer.call({ IN: powered, PT: row.delay }, context.dt); return timer.Q; }
        return powered;
      };
      return (row.kind === 'set' ? setRung : row.kind === 'reset' ? resetRung : rung)(row.coil, observed);
    }));
  }
  tick(dt) { this.plc.tick(dt); }
}
