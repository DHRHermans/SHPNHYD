import { BY_ID } from './catalog.js';

const FAMILIES = [
  ['v32_button','v32_button_no','v32_detent','v32_roller','v32_sol'],
  ['v52_pilot','v52_sol','v52_sol_spring'],
  ['h_v43_closed','h_v43_float','h_v43_bypass','h_v43_closed_sol','h_v43_float_sol','h_v43_bypass_sol'],
];
export const valveVariants = type => (FAMILIES.find(f=>f.includes(type))||[]).map(id=>BY_ID.get(id)).filter(Boolean);

export function replaceValve(circuit,id,type) {
  const inst=circuit.byId(id),def=BY_ID.get(type);
  if(!inst||!def||!valveVariants(inst.type).some(d=>d.id===type))throw new Error('Deze ventielvariant past niet bij het bestaande ventiel.');
  const ports=new Set(def.ports.map(p=>p.id));
  const incompatible=circuit.wires.filter(w=>(w.from.inst===id&&!ports.has(w.from.port))||(w.to.inst===id&&!ports.has(w.to.port)));
  if(incompatible.length)throw new Error(`Koppel eerst ${incompatible.length} leiding(en) aan vervallende stuurpoorten los. De bestaande leidingen blijven behouden.`);
  const params=Object.fromEntries(Object.entries(def.params||{}).map(([key,p])=>[key,{...p,value:inst.params[key]?inst.params[key].value:p.value}]));
  inst.type=type;inst.params=params;delete inst.valveLayout;
  inst.faults=Object.fromEntries(Object.entries(inst.faults||{}).filter(([key])=>def.faultTypes?.includes(key)));
  inst.sim={};def.initSim?.(inst);circuit.touch();return inst;
}

export function validateValveLayout(def,layout) {
  if(!def.geom||!Array.isArray(layout?.boxes)||layout.boxes.length!==def.geom.boxes.length)throw new Error('De ventielstanden passen niet bij dit ventiel.');
  const ports=new Set(Object.keys(def.geom.slots));
  const result=structuredClone(layout);
  for(const box of result.boxes){
    if(!Array.isArray(box?.paths)||box.paths.length>15)throw new Error('Ongeldige ventielverbindingen.');
    const seen=new Set();
    for(const pair of box.paths){
      if(!Array.isArray(pair)||pair.length!==2||pair[0]===pair[1]||!pair.every(p=>ports.has(p)))throw new Error('Een interne verbinding moet twee verschillende bestaande ventielpoorten verbinden.');
      const key=[...pair].sort().join(':');if(seen.has(key))throw new Error('Dubbele ventielverbinding.');seen.add(key);
    }
    box.blocked=[...ports].filter(p=>!box.paths.some(pair=>pair.includes(p)));
  }
  return result;
}
