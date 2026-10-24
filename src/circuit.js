// The document model: instances, wires, and everything that mutates them.
//
// The editor and the solver both read through this object. Any structural change bumps
// `revision`, which is the simulation's cue to rebuild its nets.

import { BY_ID } from './catalog.js';
import { GRID } from './symbols.js';
import { Grafcet } from './grafcet.js';
import { buildMotorExample } from './examples-industrial.js';
import { pneumaticPlant, cylinderController, motorController, wiredController } from './examples-controllers.js';
import { copyLadder } from './ladder.js';
import { drillingMachine } from './examples-machines.js';
import { newMachineScene, normalizeMachineScene } from './machine-scene.js';
import { validateValveLayout } from './valves.js';

let seq = 1;
const nextId = () => `i${seq++}`;

/** Deep-ish clone of a def's param block so instances never share value objects. */
function cloneParams(def) {
  const out = {};
  for (const [k, v] of Object.entries(def.params || {})) out[k] = { ...v };
  return out;
}

export class Circuit {
  constructor() {
    this.instances = [];
    this.wires = [];
    this.revision = 0;
    this._wireIndex = null;
    // Optional: a sheet without a chart behaves exactly as it always did.
    this.chart = null;
    this.controller = null;
    this.ladder = null;
    this.scene = null;
    this.learning = null;
    this.challenge = null;
  }

  defOf(inst) { return BY_ID.get(inst.type); }
  byId(id) { return this.instances.find((i) => i.id === id) || null; }

  /** Position sensors work with any actuator exposing a normalised stroke. */
  positionTargets() {
    return this.instances.filter((i) => typeof i.sim?.x === 'number');
  }

  touch() { this.revision++; this._wireIndex = null; }

  add(typeId, x, y) {
    const def = BY_ID.get(typeId);
    if (!def) throw new Error(`Onbekend componenttype: ${typeId}`);
    const inst = {
      id: nextId(),
      type: typeId,
      x: Math.round(x / GRID) * GRID,
      y: Math.round(y / GRID) * GRID,
      rot: 0,
      params: cloneParams(def),
      faults: {},
      sim: {},
    };
    // Auto-number tags so a fresh sheet does not end up with six components called 1V1.
    if (inst.params.tag) inst.params.tag.value = this.uniqueTag(inst.params.tag.value);
    if (def.initSim) def.initSim(inst);
    this.instances.push(inst);
    this.touch();
    return inst;
  }

  uniqueTag(base) {
    const taken = new Set(this.instances.map((i) => i.params?.tag?.value).filter(Boolean));
    if (!taken.has(base)) return base;
    const m = base.match(/^(.*?)(\d+)$/);
    const prefix = m ? m[1] : base;
    let n = m ? parseInt(m[2], 10) : 1;
    while (taken.has(`${prefix}${n}`)) n++;
    return `${prefix}${n}`;
  }

  remove(instId) {
    this.instances = this.instances.filter((i) => i.id !== instId);
    this.wires = this.wires.filter((w) => w.from.inst !== instId && w.to.inst !== instId);
    // A deleted cylinder must not leave limit switches pointing at a ghost.
    for (const inst of this.instances) {
      if (inst.params?.target?.value === instId) inst.params.target.value = null;
    }
    this.touch();
  }

  connect(from, to) {
    if (from.inst === to.inst && from.port === to.port) return null;
    const kindOf = (ref) => {
      const inst = this.byId(ref.inst);
      const port = this.defOf(inst).ports.find((p) => p.id === ref.port);
      return port?.kind || 'pneumatic';
    };
    // Air and 24V never share a net; silently refusing is friendlier than a modal.
    if (kindOf(from) !== kindOf(to)) return null;
    if (this.wireBetween(from, to)) return null;

    const wire = { id: `w${seq++}`, from, to, kind: kindOf(from) };
    this.wires.push(wire);
    this.touch();
    return wire;
  }

  wireBetween(a, b) {
    return this.wires.find((w) =>
      (w.from.inst === a.inst && w.from.port === a.port && w.to.inst === b.inst && w.to.port === b.port) ||
      (w.from.inst === b.inst && w.from.port === b.port && w.to.inst === a.inst && w.to.port === a.port));
  }

  removeWire(id) {
    this.wires = this.wires.filter((w) => w.id !== id);
    this.touch();
  }

  hasWire(instId, portId) {
    if (!this._wireIndex) {
      this._wireIndex = new Set();
      for (const w of this.wires) {
        this._wireIndex.add(`${w.from.inst}:${w.from.port}`);
        this._wireIndex.add(`${w.to.inst}:${w.to.port}`);
      }
    }
    return this._wireIndex.has(`${instId}:${portId}`);
  }

  /** World position of a port, accounting for the instance's rotation. */
  portPos(inst, port) {
    const def = this.defOf(inst);
    const { w, h } = def.size;
    const cx = w / 2, cy = h / 2;
    const a = (inst.rot * Math.PI) / 180;
    const dx = port.x - cx, dy = port.y - cy;
    return {
      x: inst.x + cx + dx * Math.cos(a) - dy * Math.sin(a),
      y: inst.y + cy + dx * Math.sin(a) + dy * Math.cos(a),
    };
  }

  portRef(ref) {
    const inst = this.byId(ref.inst);
    if (!inst) return null;
    const port = this.defOf(inst).ports.find((p) => p.id === ref.port);
    if (!port) return null;
    return this.portPos(inst, port);
  }

  /** Axis-aligned bounds of an instance after rotation. */
  bounds(inst) {
    const { w, h } = this.defOf(inst).size;
    const swap = inst.rot === 90 || inst.rot === 270;
    const bw = swap ? h : w, bh = swap ? w : h;
    return { x: inst.x + (w - bw) / 2, y: inst.y + (h - bh) / 2, w: bw, h: bh };
  }

  toJSON() {
    return {
      version: 1,
      instances: this.instances.map((i) => ({
        id: i.id, type: i.type, x: i.x, y: i.y, rot: i.rot,
        params: Object.fromEntries(Object.entries(i.params).map(([k, v]) => [k, v.value])),
        ...(i.presentation ? {presentation:structuredClone(i.presentation)} : {}),
        ...(i.valveLayout ? {valveLayout:structuredClone(i.valveLayout)} : {}),
        ...(Object.keys(i.faults || {}).length ? { faults: { ...i.faults } } : {}),
      })),
      wires: this.wires.map((w) => ({ from: w.from, to: w.to })),
      ...(this.chart ? { chart: this.chart.toJSON() } : {}),
      ...(this.challenge ? {challenge:structuredClone(this.challenge)} : {}),
      ...(this.learning ? {learning:structuredClone(this.learning)} : {}),
      ...(this.scene ? { scene: structuredClone(this.scene) } : {}),
      ...(this.controller ? { controller: this.controller } : {}),
      ...(this.ladder ? { ladder: structuredClone(this.ladder) } : {}),
    };
  }

  static fromJSON(data) {
    const c = new Circuit();
    const idMap = new Map();
    for (const raw of data.instances || []) {
      const def = BY_ID.get(raw.type);
      if (!def) continue;
      const inst = {
        id: nextId(), type: raw.type, x: Number(raw.x??0), y: Number(raw.y??0), rot: Number(raw.rot??0),
        params: cloneParams(def), faults: { ...(raw.faults || {}) }, sim: {},
      };
      if(![inst.x,inst.y,inst.rot].every(Number.isFinite))throw new Error('Ongeldige componentpositie.');
      for (const [k, v] of Object.entries(raw.params || {})) {
        const param=inst.params[k];if(!param)continue;
        if(param.type==='range'){const n=Number(v);if(!Number.isFinite(n))throw new Error('Ongeldige numerieke componentinstelling.');param.value=n;}
        else if(param.type==='text')param.value=String(v??'');
        else param.value=v;
      }
      if(raw.presentation){
        const p=raw.presentation,n=Number(p.order??0);
        if(!Number.isFinite(n)||n<0||n>10000)throw new Error('Ongeldige simulatievolgorde.');
        inst.presentation={order:Math.round(n),scale:['small','normal','large'].includes(p.scale)?p.scale:'normal',group:String(p.group??'').slice(0,60)};
      }
      if (raw.valveLayout) inst.valveLayout = validateValveLayout(def,raw.valveLayout);
      if (def.initSim) def.initSim(inst);
      idMap.set(raw.id, inst.id);
      c.instances.push(inst);
    }
    // Cylinder references are stored as old ids; remap them alongside the wires.
    for (const inst of c.instances) {
      if (inst.params?.target && idMap.has(inst.params.target.value)) {
        inst.params.target.value = idMap.get(inst.params.target.value);
      }
    }
    for (const raw of data.wires || []) {
      const from = { inst: idMap.get(raw.from.inst), port: raw.from.port };
      const to = { inst: idMap.get(raw.to.inst), port: raw.to.port };
      if (from.inst && to.inst) c.connect(from, to);
    }
    if (data.scene?.type === 'drill-press') c.scene = normalizeMachineScene(data.scene);
    if(data.challenge&&idMap.has(data.challenge.inst)){
      const inst=c.byId(idMap.get(data.challenge.inst)),allowed=BY_ID.get(inst.type).faultTypes||[];
      if(allowed.includes(data.challenge.fault))c.challenge={inst:inst.id,fault:data.challenge.fault,revealed:!!data.challenge.revealed,baseline:Object.fromEntries(Object.entries(data.challenge.baseline||{}).filter(([k])=>allowed.includes(k)).map(([k,v])=>[k,!!v]))};
    }
    if(data.learning&&typeof data.learning==='object'){const l=data.learning;c.learning={lesson:String(l.lesson??'').slice(0,40),completed:Array.isArray(l.completed)?l.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<20):[],notes:String(l.notes??'').slice(0,10000),prediction:String(l.prediction??'').slice(0,10000),measurements:Array.isArray(l.measurements)?l.measurements.filter(v=>typeof v==='string').slice(-100).map(v=>v.slice(0,2000)):[],traceLog:Array.isArray(l.traceLog)?l.traceLog.filter(v=>typeof v==='string').slice(-12).map(v=>v.slice(0,10000)):[],evidence:{...Object.fromEntries(Object.entries(l.evidence||{}).filter(([k,v])=>['input','moved','end','returned','motorRan','motorStopped','output','steps'].includes(k)).map(([k,v])=>[k,!!v])),...Object.fromEntries(['endTargets','runningTargets'].map(k=>[k,Array.isArray(l.evidence?.[k])?l.evidence[k].filter(v=>typeof v==='string').slice(0,128):[]]))}};}
    if (data.chart) c.chart = Grafcet.fromJSON(data.chart);
    if (["manual", "grafcet", "ladder"].includes(data.controller)) c.controller = data.controller;
    if (data.ladder) c.ladder = copyLadder(data.ladder);
    c.touch();
    return c;
  }
}

// ---------------------------------------------------------------------------
// Worked examples — the same circuits a Festo course walks through, so the app has
// something meaningful to show on first load.
// ---------------------------------------------------------------------------

export const EXAMPLES = {
  machineBuilder: {name:'Machinebeeld: zelf een opstelling bouwen',description:'Leeg schema, lege machineopstelling en geen vooraf ingevulde besturing. Plaats onderdelen en koppel je eigen cilinders, motor en signalen.',build:()=>{const c=new Circuit();c.scene=newMachineScene();c.controller='manual';return c;}},
  drillingMachine: {name:'Machinebeeld: bankschroef en kolomboormachine',description:'Oefen handmatig of start de automatische boorcyclus. Bekijk Machinebeeld; dezelfde cilinders, sensoren en motor staan in het schema.',build:()=>drillingMachine(Circuit)},
  motorConveyor: {
    name: 'Motor: 24 V-transportband met start/stop en zelfhouding',
    description: 'S1 start de transportbandmotor M2 via KM1. De zelfhouding houdt de band in beweging. S2 stopt en S0 is de noodstop. Het DC-motormodel is vereenvoudigd.',
    build() {
      const c = buildMotorExample(Circuit);
      for (const i of [...c.instances]) if (['industrial_supply', 'industrial_contactor', 'industrial_motor', 'industrial_overload'].includes(i.type)) c.remove(i.id);
      const stop = c.instances.find(i => i.type === 'btn_nc');
      for (const i of c.instances.filter(i => i.type === 'btn_no' || i.type === 'contact_no')) {
        c.connect({ inst: stop.id, port: 'b' }, { inst: i.id, port: 'a' });
      }
      const power = c.add('rail_24v', 150, 90);
      const contact = c.add('contact_no', 150, 210); contact.params.tag.value = 'KM1';
      const motor = c.add('industrial_dc_motor', 120, 340);
      const ground = c.add('rail_0v', 150, 510);
      const wire = (a, ap, b, bp) => c.connect({ inst: a.id, port: ap }, { inst: b.id, port: bp });
      wire(power, 'a', contact, 'a'); wire(contact, 'b', motor, 'a'); wire(motor, 'b', ground, 'a');
      return c;
    },
  },
  motorDirect: {
    name: 'Motor: direct starten met zelfhouding en thermische beveiliging',
    description: 'Druk S1 kort in: KM1 houdt zichzelf vast en M1 draait rechtsom. S2 stopt; S0 is de vergrendelende noodstop. F1 opent bij overbelasting. De hoofdkring is een functioneel driefasenmodel.',
    build() { return buildMotorExample(Circuit); },
  },
  motorReverse: {
    name: 'Motor: omkeersturing met elektrische en mechanische vergrendeling',
    description: 'S1 start rechtsom, S3 linksom. Stop eerst met S2 voor een richtingswissel. De NC-hulpcontacten en mechanische vergrendeling blokkeren gelijktijdig inschakelen. F1 bewaakt M1.',
    build() { return buildMotorExample(Circuit, true); },
  },
  electroHydraulic: {
    name: 'Elektrohydraulica: cilinder met eindschakelaars',
    description: 'Houd S1 ingedrukt om uit te schuiven (Y1), S2 om in te schuiven (Y2). B0 en B1 bewaken de hydraulische cilinder en schakelen de lampen H0 en H1. Bij loslaten centreert het 4/3-ventiel.',
    build() {
      const c = new Circuit();
      const cyl = c.add('h_cyl', 170, 70);
      const valve = c.add('h_v43_closed_sol', 170, 260);
      const pump = c.add('h_pump', 40, 440);
      const relief = c.add('h_relief', 180, 440);
      const tank = c.add('h_tank', 40, 580);
      const gauge = c.add('h_gauge', 350, 370);
      pump.params.flow.value = 6;
      relief.params.setpoint.value = 80;
      valve.params.solA.value = 'Y1';
      valve.params.solB.value = 'Y2';
      const wire = (a, ap, b, bp) => c.connect({ inst: a.id, port: ap }, { inst: b.id, port: bp });
      wire(pump, 'P', valve, 'P');
      wire(pump, 'P', relief, 'P');
      wire(pump, 'P', gauge, 'P');
      wire(pump, 'T', tank, 'T');
      wire(relief, 'T', tank, 'T');
      wire(valve, 'T', tank, 'T');
      wire(valve, 'A', cyl, 'A');
      wire(valve, 'B', cyl, 'B');

      for (let n = 0; n < 4; n++) {
        const x = 500 + n * 150;
        const power = c.add('rail_24v', x, 100);
        const ground = c.add('rail_0v', x, 410);
        const input = c.add(n < 2 ? 'btn_no' : 'limit_switch', x, 180);
        const output = c.add(n < 2 ? 'sol_coil' : 'lamp', x, 320);
        input.params.tag.value = n < 2 ? `S${n + 1}` : `B${n - 2}`;
        output.params.tag.value = n < 2 ? `Y${n + 1}` : `H${n - 2}`;
        if (n >= 2) {
          input.params.target.value = cyl.id;
          input.params.at.value = n - 2;
        }
        wire(power, 'a', input, 'a');
        wire(input, 'b', output, 'a');
        wire(output, 'b', ground, 'a');
      }
      return c;
    },
  },
  mixedInterlock: {
    name: 'Gemengd: pneumatische vrijgave voor elektrohydraulica',
    description: 'Schakel de pneumatische handhefboom P-S1 in tot P1 uitgeschoven is. Sensor B2 geeft dan S1/Y1 vrij voor de hydraulische cilinder. S2/Y2 blijft beschikbaar om hydraulisch in te schuiven.',
    build() {
      const c = EXAMPLES.electroHydraulic.build();
      const cyl = c.add('cyl_single', 1140, 90);
      cyl.params.tag.value = 'P1';
      const button = c.add('v32_detent', 1160, 290);
      button.params.tag.value = 'P-S1';
      const supply = c.add('supply', 1170, 440);
      const sensor = c.add('limit_switch', 500, 250);
      sensor.params.tag.value = 'B2';
      sensor.params.target.value = cyl.id;
      sensor.params.at.value = 1;
      const wire = (a, ap, b, bp) => c.connect({ inst: a.id, port: ap }, { inst: b.id, port: bp });
      wire(supply, '1', button, '1');
      wire(button, '2', cyl, '1');
      const start = c.instances.find(i => i.params.tag?.value === 'S1');
      const coil = c.instances.find(i => i.params.tag?.value === 'Y1');
      c.removeWire(c.wireBetween({ inst: start.id, port: 'b' }, { inst: coil.id, port: 'a' }).id);
      wire(start, 'b', sensor, 'a');
      wire(sensor, 'b', coil, 'a');
      return c;
    },
  },
  direct: {
    name: 'Rechtstreekse sturing (Enkelwerkende cilinder)',
    description: 'Drukknop 1S1 stuurt de enkelwerkende cilinder rechtstreeks aan.',
    build() {
      const c = new Circuit();
      const cyl = c.add('cyl_single', 360, 90);
      const valve = c.add('v32_button', 380, 240);
      const src = c.add('supply', 386, 360);
      c.connect({ inst: valve.id, port: '2' }, { inst: cyl.id, port: '1' });
      c.connect({ inst: src.id, port: '1' }, { inst: valve.id, port: '1' });
      return c;
    },
  },

  indirect: {
    name: 'Indirecte sturing met bistabiel ventiel',
    description: 'Twee drukknoppen schakelen een bistabiel 5/2-ventiel dat zijn stand behoudt.',
    build() {
      const c = new Circuit();
      const cyl = c.add('cyl_double', 340, 80);
      const main = c.add('v52_pilot', 350, 220);
      const s1 = c.add('v32_button', 200, 360);
      const s2 = c.add('v32_button', 500, 360);
      const src = c.add('supply', 350, 470);

      c.connect({ inst: main.id, port: '4' }, { inst: cyl.id, port: '1' });
      c.connect({ inst: main.id, port: '2' }, { inst: cyl.id, port: '2' });
      c.connect({ inst: s1.id, port: '2' }, { inst: main.id, port: '14' });
      c.connect({ inst: s2.id, port: '2' }, { inst: main.id, port: '12' });
      c.connect({ inst: src.id, port: '1' }, { inst: main.id, port: '1' });
      c.connect({ inst: src.id, port: '1' }, { inst: s1.id, port: '1' });
      c.connect({ inst: src.id, port: '1' }, { inst: s2.id, port: '1' });
      return c;
    },
  },

  speed: {
    name: 'Snelheidsregeling (afvoersmoring)',
    description: 'Twee smoor-terugslagventielen regelen de snelheid bij uit- en inschuiven afzonderlijk.',
    build() {
      const c = new Circuit();
      const cyl = c.add('cyl_double', 340, 60);
      const t1 = c.add('throttle_check', 330, 160);
      const t2 = c.add('throttle_check', 430, 160);
      const main = c.add('v52_pilot', 350, 280);
      const s1 = c.add('v32_button', 190, 410);
      const s2 = c.add('v32_button', 510, 410);
      const src = c.add('supply', 350, 520);
      const g = c.add('gauge', 250, 240);

      c.connect({ inst: t1.id, port: '2' }, { inst: cyl.id, port: '1' });
      c.connect({ inst: t2.id, port: '2' }, { inst: cyl.id, port: '2' });
      c.connect({ inst: main.id, port: '4' }, { inst: t1.id, port: '1' });
      c.connect({ inst: main.id, port: '2' }, { inst: t2.id, port: '1' });
      c.connect({ inst: s1.id, port: '2' }, { inst: main.id, port: '14' });
      c.connect({ inst: s2.id, port: '2' }, { inst: main.id, port: '12' });
      c.connect({ inst: src.id, port: '1' }, { inst: main.id, port: '1' });
      c.connect({ inst: src.id, port: '1' }, { inst: s1.id, port: '1' });
      c.connect({ inst: src.id, port: '1' }, { inst: s2.id, port: '1' });
      c.connect({ inst: g.id, port: '1' }, { inst: main.id, port: '1' });
      return c;
    },
  },

  reciprocating: {
    name: 'Automatische heen-en-weerbeweging',
    description: 'Twee rolhefboomventielen op de eindposities laten de cilinder heen en weer bewegen. Start met 1S3.',
    build() {
      const c = new Circuit();
      const cyl = c.add('cyl_double', 340, 70);
      const main = c.add('v52_pilot', 350, 230);
      const r0 = c.add('v32_roller', 190, 370);
      const r1 = c.add('v32_roller', 500, 370);
      const start = c.add('v32_detent', 340, 370);
      const src = c.add('supply', 350, 490);

      r0.params.target.value = cyl.id; r0.params.at.value = 0;
      r0.params.tag.value = '1S1';
      r1.params.target.value = cyl.id; r1.params.at.value = 1;
      r1.params.tag.value = '1S2';

      c.connect({ inst: main.id, port: '4' }, { inst: cyl.id, port: '1' });
      c.connect({ inst: main.id, port: '2' }, { inst: cyl.id, port: '2' });
      c.connect({ inst: r0.id, port: '2' }, { inst: main.id, port: '14' });
      c.connect({ inst: r1.id, port: '2' }, { inst: main.id, port: '12' });
      c.connect({ inst: src.id, port: '1' }, { inst: main.id, port: '1' });
      c.connect({ inst: src.id, port: '1' }, { inst: start.id, port: '1' });
      c.connect({ inst: start.id, port: '2' }, { inst: r0.id, port: '1' });
      c.connect({ inst: start.id, port: '2' }, { inst: r1.id, port: '1' });
      return c;
    },
  },

  sequence: {
    name: 'Volgorde A+ B+ A− B−',
    description: 'Klassieke volgorde met twee cilinders en vier eindstandventielen. Vergrendel 1S1 om te starten.',
    build() {
      const c = new Circuit();
      const A = c.add('cyl_double', 300, 60);
      const B = c.add('cyl_double', 300, 200);
      A.params.tag.value = '1A1';
      B.params.tag.value = '2A1';

      const V1 = c.add('v52_pilot', 220, 380);
      const V2 = c.add('v52_pilot', 620, 380);
      V1.params.tag.value = '1V1';
      V2.params.tag.value = '2V1';

      // Start · b0 gates A+, which is what keeps the cycle from self-triggering while B
      // is still out. Everything else is driven straight off one end-position roller.
      const start = c.add('v32_detent', 60, 540);
      const AND = c.add('two_pressure', 90, 450);
      start.params.tag.value = '1S1';
      AND.params.tag.value = '1V2';

      const a0 = c.add('v32_roller', 220, 540);
      const a1 = c.add('v32_roller', 380, 540);
      const b0 = c.add('v32_roller', 540, 540);
      const b1 = c.add('v32_roller', 700, 540);
      a0.params.tag.value = '1S2'; a0.params.target.value = A.id; a0.params.at.value = 0;
      a1.params.tag.value = '1S3'; a1.params.target.value = A.id; a1.params.at.value = 1;
      b0.params.tag.value = '2S1'; b0.params.target.value = B.id; b0.params.at.value = 0;
      b1.params.tag.value = '2S2'; b1.params.target.value = B.id; b1.params.at.value = 1;

      const src = c.add('supply', 400, 660);

      c.connect({ inst: V1.id, port: '4' }, { inst: A.id, port: '1' });
      c.connect({ inst: V1.id, port: '2' }, { inst: A.id, port: '2' });
      c.connect({ inst: V2.id, port: '4' }, { inst: B.id, port: '1' });
      c.connect({ inst: V2.id, port: '2' }, { inst: B.id, port: '2' });

      for (const v of [V1, V2, start, a0, a1, b0, b1]) {
        c.connect({ inst: src.id, port: '1' }, { inst: v.id, port: '1' });
      }

      c.connect({ inst: start.id, port: '2' }, { inst: AND.id, port: '1a' });
      c.connect({ inst: b0.id, port: '2' }, { inst: AND.id, port: '1b' });
      c.connect({ inst: AND.id, port: '2' }, { inst: V1.id, port: '14' }); // A+
      c.connect({ inst: a1.id, port: '2' }, { inst: V2.id, port: '14' });  // B+
      c.connect({ inst: b1.id, port: '2' }, { inst: V1.id, port: '12' });  // A−
      c.connect({ inst: a0.id, port: '2' }, { inst: V2.id, port: '12' });  // B−
      return c;
    },
  },

  timed: {
    name: 'Tijdvertraging',
    description: 'De cilinder schuift uit, wacht de ingestelde tijd en schuift automatisch in. Vergrendel 1S1.',
    build() {
      const c = new Circuit();
      const cyl = c.add('cyl_double', 320, 60);
      const main = c.add('v52_pilot', 330, 230);
      const timer = c.add('timer_nc', 620, 380);
      const start = c.add('v32_button', 140, 380);
      const a1 = c.add('v32_roller', 420, 380);
      const src = c.add('supply', 340, 520);
      timer.params.delay.value = 2;
      a1.params.tag.value = '1S2';
      a1.params.target.value = cyl.id;
      a1.params.at.value = 1;

      c.connect({ inst: main.id, port: '4' }, { inst: cyl.id, port: '1' });
      c.connect({ inst: main.id, port: '2' }, { inst: cyl.id, port: '2' });
      for (const v of [main, start, a1, timer]) {
        c.connect({ inst: src.id, port: '1' }, { inst: v.id, port: '1' });
      }
      c.connect({ inst: start.id, port: '2' }, { inst: main.id, port: '14' });
      // The end-position roller starts the timer; the timer commands the return.
      c.connect({ inst: a1.id, port: '2' }, { inst: timer.id, port: '12' });
      c.connect({ inst: timer.id, port: '2' }, { inst: main.id, port: '12' });
      return c;
    },
  },

  pressureSeq: {
    name: 'Drukafhankelijke volgordesturing',
    description: 'B schuift pas uit als A zijn perskracht heeft opgebouwd, via een drukvolgordeventiel.',
    build() {
      const c = new Circuit();
      const A = c.add('cyl_double', 300, 60);
      const B = c.add('cyl_double', 300, 200);
      A.params.tag.value = '1A1';
      B.params.tag.value = '2A1';
      A.params.load.value = 180; // press load: A has to build force before it seats

      const V1 = c.add('v52_pilot', 250, 380);
      const V2 = c.add('v52_pilot', 640, 380);
      V1.params.tag.value = '1V1';
      V2.params.tag.value = '2V1';
      const start = c.add('v32_button', 100, 540);
      const seq = c.add('sequence_valve', 420, 540);
      const back = c.add('v32_button', 780, 540);
      seq.params.tag.value = '1V3';
      seq.params.setpoint.value = 4.5;
      const src = c.add('supply', 420, 680);

      c.connect({ inst: V1.id, port: '4' }, { inst: A.id, port: '1' });
      c.connect({ inst: V1.id, port: '2' }, { inst: A.id, port: '2' });
      c.connect({ inst: V2.id, port: '4' }, { inst: B.id, port: '1' });
      c.connect({ inst: V2.id, port: '2' }, { inst: B.id, port: '2' });
      for (const v of [V1, V2, start, seq, back]) {
        c.connect({ inst: src.id, port: '1' }, { inst: v.id, port: '1' });
      }
      c.connect({ inst: start.id, port: '2' }, { inst: V1.id, port: '14' });
      // The sequence valve watches A's working pressure, not A's position.
      c.connect({ inst: A.id, port: '1' }, { inst: seq.id, port: '12' });
      c.connect({ inst: seq.id, port: '2' }, { inst: V2.id, port: '14' });
      c.connect({ inst: back.id, port: '2' }, { inst: V1.id, port: '12' });
      c.connect({ inst: back.id, port: '2' }, { inst: V2.id, port: '12' });
      return c;
    },
  },

  hydPress: {
    name: 'Hydraulica: Pers met drukbegrenzingsventiel',
    description: 'Pomp, drukbegrenzingsventiel en handbediend 4/3-ventiel. Houd de linker- of rechterzijde van de hefboom ingedrukt.',
    build() {
      const c = new Circuit();
      const cyl = c.add('h_cyl', 420, 60);
      const valve = c.add('h_v43_closed', 450, 260);
      const relief = c.add('h_relief', 260, 430);
      const pump = c.add('h_pump', 120, 430);
      const gauge = c.add('h_gauge', 360, 350);
      const tank = c.add('h_tank', 120, 590);
      const tank2 = c.add('h_tank', 260, 590);
      pump.params.flow.value = 10;
      relief.params.setpoint.value = 80;
      cyl.params.load.value = 6000; // press load opposing extension

      c.connect({ inst: pump.id, port: 'P' }, { inst: relief.id, port: 'P' });
      c.connect({ inst: pump.id, port: 'P' }, { inst: valve.id, port: 'P' });
      c.connect({ inst: pump.id, port: 'P' }, { inst: gauge.id, port: 'P' });
      c.connect({ inst: pump.id, port: 'T' }, { inst: tank.id, port: 'T' });
      c.connect({ inst: relief.id, port: 'T' }, { inst: tank2.id, port: 'T' });
      c.connect({ inst: valve.id, port: 'T' }, { inst: tank2.id, port: 'T' });
      c.connect({ inst: valve.id, port: 'A' }, { inst: cyl.id, port: 'A' });
      c.connect({ inst: valve.id, port: 'B' }, { inst: cyl.id, port: 'B' });
      return c;
    },
  },

  hydLoad: {
    name: 'Hydraulica: Last vasthouden met lasthoudventiel',
    description: 'Een trekkende last bij zweefstand wordt tegengehouden door het lasthoudventiel.',
    build() {
      const c = new Circuit();
      const cyl = c.add('h_cyl', 380, 60);
      const cb = c.add('h_counterbalance', 700, 210);
      const valve = c.add('h_v43_float', 420, 340);
      const relief = c.add('h_relief', 240, 500);
      const pump = c.add('h_pump', 100, 500);
      const tank = c.add('h_tank', 100, 650);
      const tank2 = c.add('h_tank', 240, 650);
      pump.params.flow.value = 10;
      relief.params.setpoint.value = 200;
      cyl.params.load.value = -12000; // overrunning: the load pulls the rod out
      cb.params.setpoint.value = 170;

      c.connect({ inst: pump.id, port: 'P' }, { inst: relief.id, port: 'P' });
      c.connect({ inst: pump.id, port: 'P' }, { inst: valve.id, port: 'P' });
      c.connect({ inst: pump.id, port: 'T' }, { inst: tank.id, port: 'T' });
      c.connect({ inst: relief.id, port: 'T' }, { inst: tank2.id, port: 'T' });
      c.connect({ inst: valve.id, port: 'T' }, { inst: tank2.id, port: 'T' });
      c.connect({ inst: valve.id, port: 'A' }, { inst: cyl.id, port: 'A' });
      c.connect({ inst: cyl.id, port: 'B' }, { inst: cb.id, port: '2' });
      c.connect({ inst: cb.id, port: '1' }, { inst: valve.id, port: 'B' });
      c.connect({ inst: cb.id, port: 'X' }, { inst: valve.id, port: 'A' });
      return c;
    },
  },

  grafcet: {
    name: 'GRAFCET: A+ B+ A− B−',
    description: 'Dezelfde pneumatische volgorde, bestuurd met een GRAFCET-schema. Start met S1.',
    build() {
      const c = new Circuit();
      const A = c.add('cyl_double', 320, 60);
      const B = c.add('cyl_double', 320, 190);
      A.params.tag.value = '1A1';
      B.params.tag.value = '2A1';

      const V1 = c.add('v52_sol_spring', 280, 350);
      const V2 = c.add('v52_sol_spring', 620, 350);
      V1.params.tag.value = '1V1'; V1.params.solA.value = 'A_PLUS';
      V2.params.tag.value = '2V1'; V2.params.solA.value = 'B_PLUS';
      const src = c.add('supply', 440, 500);

      c.connect({ inst: V1.id, port: '4' }, { inst: A.id, port: '1' });
      c.connect({ inst: V1.id, port: '2' }, { inst: A.id, port: '2' });
      c.connect({ inst: V2.id, port: '4' }, { inst: B.id, port: '1' });
      c.connect({ inst: V2.id, port: '2' }, { inst: B.id, port: '2' });
      c.connect({ inst: src.id, port: '1' }, { inst: V1.id, port: '1' });
      c.connect({ inst: src.id, port: '1' }, { inst: V2.id, port: '1' });

      const mk = (tag, target, at, x) => {
        const s = c.add('limit_switch', x, 620);
        s.params.tag.value = tag;
        s.params.target.value = target.id;
        s.params.at.value = at;
        return s;
      };
      mk('a0', A, 0, 220); mk('a1', A, 1, 300);
      mk('b0', B, 0, 380); mk('b1', B, 1, 460);
      const start = c.add('btn_no', 140, 620);
      start.params.tag.value = 'S1';

      const g = new Grafcet();
      const s0 = g.addStep({ name: '0', initial: true, x: 60, y: 40 });
      const s1 = g.addStep({ name: '1', x: 60, y: 130, actions: [{ kind: 'continuous', target: 'A_PLUS' }] });
      const s2 = g.addStep({ name: '2', x: 60, y: 220, actions: [
        { kind: 'continuous', target: 'A_PLUS' }, { kind: 'continuous', target: 'B_PLUS' }] });
      const s3 = g.addStep({ name: '3', x: 60, y: 310, actions: [{ kind: 'continuous', target: 'B_PLUS' }] });
      const s4 = g.addStep({ name: '4', x: 60, y: 400, actions: [] });
      g.addTransition({ from: [s0.id], to: [s1.id], receptivity: 'S1 * a0 * b0', y: 90 });
      g.addTransition({ from: [s1.id], to: [s2.id], receptivity: 'a1', y: 180 });
      g.addTransition({ from: [s2.id], to: [s3.id], receptivity: 'b1', y: 270 });
      g.addTransition({ from: [s3.id], to: [s4.id], receptivity: 'a0', y: 360 });
      g.addTransition({ from: [s4.id], to: [s0.id], receptivity: 'b0', y: 450 });
      g.reset();
      c.chart = g;
      return c;
    },
  },

  electro: {
    name: 'Elektropneumatica: zelfhoudschakeling',
    description: 'Een laddersturing met zelfhoudend relais K1 schakelt magneetventiel Y1.',
    build() {
      const c = new Circuit();
      const cyl = c.add('cyl_double', 330, 60);
      const main = c.add('v52_sol_spring', 350, 210);
      const src = c.add('supply', 356, 330);
      main.params.solA.value = 'Y1';

      c.connect({ inst: main.id, port: '4' }, { inst: cyl.id, port: '1' });
      c.connect({ inst: main.id, port: '2' }, { inst: cyl.id, port: '2' });
      c.connect({ inst: src.id, port: '1' }, { inst: main.id, port: '1' });

      // Ladder: rung 1 latches K1, rung 2 drives Y1.
      const p24a = c.add('rail_24v', 150, 420);
      const p0a = c.add('rail_0v', 150, 630);
      const s1 = c.add('btn_no', 156, 450);
      const k1c = c.add('contact_no', 246, 450);
      const stop = c.add('btn_nc', 156, 520);
      const coil = c.add('relay_coil', 153, 580);
      s1.params.tag.value = 'S1';
      stop.params.tag.value = 'S2';
      coil.params.tag.value = 'K1';
      k1c.params.tag.value = 'K1';

      c.connect({ inst: p24a.id, port: 'a' }, { inst: s1.id, port: 'a' });
      c.connect({ inst: p24a.id, port: 'a' }, { inst: k1c.id, port: 'a' });
      c.connect({ inst: s1.id, port: 'b' }, { inst: stop.id, port: 'a' });
      c.connect({ inst: k1c.id, port: 'b' }, { inst: stop.id, port: 'a' });
      c.connect({ inst: stop.id, port: 'b' }, { inst: coil.id, port: 'a' });
      c.connect({ inst: coil.id, port: 'b' }, { inst: p0a.id, port: 'a' });

      const p24b = c.add('rail_24v', 470, 420);
      const p0b = c.add('rail_0v', 470, 630);
      const k1c2 = c.add('contact_no', 476, 470);
      const y1 = c.add('sol_coil', 473, 560);
      const lampP = c.add('lamp', 593, 470);
      k1c2.params.tag.value = 'K1';
      y1.params.tag.value = 'Y1';
      lampP.params.tag.value = 'P1';

      c.connect({ inst: p24b.id, port: 'a' }, { inst: k1c2.id, port: 'a' });
      c.connect({ inst: k1c2.id, port: 'b' }, { inst: y1.id, port: 'a' });
      c.connect({ inst: y1.id, port: 'b' }, { inst: p0b.id, port: 'a' });
      // Lamp hangs off the same rung, so it reports Y1 rather than just mains power.
      c.connect({ inst: k1c2.id, port: 'b' }, { inst: lampP.id, port: 'a' });
      c.connect({ inst: lampP.id, port: 'b' }, { inst: p0b.id, port: 'a' });
      return c;
    },
  },
};

// The same controllers can operate pneumatic, hydraulic and electrical plants.
for (const mode of ['grafcet', 'ladder']) {
  const title = mode === 'grafcet' ? 'GRAFCET' : 'PLC Ladder';
  EXAMPLES[`${mode}Pneumatic`] = {
    name: `${title}: pneumatische cilinder automatisch uit/in`,
    description: 'Geef S1 een korte puls. B1 start de teruggaande beweging; B0 bewaakt de ruststand. De geselecteerde besturing bedient Y1.',
    build: () => cylinderController(pneumaticPlant(Circuit), false, mode),
  };
  EXAMPLES[`${mode}Hydraulic`] = {
    name: `${title}: hydraulische cilinder automatisch uit/in`,
    description: 'Geef S1 een korte puls: Y1 schuift uit, B1 schakelt om naar Y2, B0 beëindigt de cyclus. Bekijk het programma in het eigen besturingstabblad.',
    build: () => cylinderController(EXAMPLES.electroHydraulic.build(), true, mode),
  };
  EXAMPLES[`${mode}Motor`] = {
    name: `${title}: elektrische motor met start/stop`,
    description: 'S1 start motor M1 via KM1. S2, S0 of thermisch relais F1 schakelt de motor uit. S2/S0/F1 zijn als gesloten/gezond ingangssignaal beschikbaar.',
    build: () => motorController(EXAMPLES.motorDirect.build(), mode),
  };
}

for(const mode of ['grafcet','ladder'])EXAMPLES[`${mode}Wired`]={
  name:`${mode==='ladder'?'PLC':'GRAFCET'}: fysiek bedrade module met cilinder`,
  description:'I0 leest S1, I1/I2 lezen B0/B1. Q0 voedt ventielspoel Y1. De module heeft L+ en M nodig; een ontbrekende draad wordt niet virtueel overbrugd.',
  build:()=>wiredController(cylinderController(pneumaticPlant(Circuit),false,mode),mode),
};
