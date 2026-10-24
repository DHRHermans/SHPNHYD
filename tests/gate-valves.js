import assert from 'node:assert/strict';
import { Circuit, EXAMPLES } from '../src/circuit.js';
import { Simulation, barG } from '../src/engine.js';
import { replaceValve, validateValveLayout } from '../src/valves.js';
const run=(sim,t)=>{for(let n=0;n<t*1000;n++)sim.step(.001);};
export const tests=[
  {name:'Ventielvariant: aansluitingen, aanduidingen en spoelen blijven bewaard',fn(){
    const c=EXAMPLES.electroHydraulic.build(),v=c.instances.find(i=>i.type==='h_v43_closed_sol'),id=v.id;
    v.params.solA.value='Y_CUSTOM';const before=JSON.stringify(c.wires);replaceValve(c,id,'h_v43_float_sol');
    assert.equal(v.id,id);assert.equal(v.params.solA.value,'Y_CUSTOM');assert.equal(JSON.stringify(c.wires),before);
    assert.equal(Circuit.fromJSON(c.toJSON()).instances.find(i=>i.type==='h_v43_float_sol').params.solA.value,'Y_CUSTOM');
  }},
  {name:'Ventielvariant: verbonden pilotpoorten worden niet stilzwijgend verwijderd',fn(){
    const c=EXAMPLES.indirect.build(),v=c.instances.find(i=>i.type==='v52_pilot'),before=JSON.stringify(c.toJSON());
    assert.throws(()=>replaceValve(c,v.id,'v52_sol'),/Koppel eerst/);assert.equal(JSON.stringify(c.toJSON()),before);
  }},
  {name:'Getekende pneumatische verbindingen veranderen de rustwerking en blijven bij JSON behouden',fn(){
    const c=EXAMPLES.direct.build();let sim=new Simulation(c);run(sim,1);assert(c.positionTargets()[0].sim.x<.01);
    const valve=c.instances.find(i=>i.type==='v32_button');valve.valveLayout={boxes:[{paths:[['1','2']]},{paths:[['2','3']]}]};
    const restored=Circuit.fromJSON(c.toJSON());sim=new Simulation(restored);run(sim,1);assert(restored.positionTargets()[0].sim.x>.99);
    assert(restored.defOf(restored.instances.find(i=>i.type==='v32_button')).render(restored.instances.find(i=>i.type==='v32_button')).includes('spool'));
  }},
  {name:'Getekende hydraulische middenstand verandert gesloten druk naar pompdoorlaat',fn(){
    const measure=custom=>{const c=EXAMPLES.electroHydraulic.build(),v=c.instances.find(i=>i.type==='h_v43_closed_sol');
      if(custom){const def=c.defOf(v);v.valveLayout=validateValveLayout(def,{boxes:def.geom.boxes.map((b,n)=>({paths:n===1?[['P','T']]:structuredClone(b.paths||[])}))});}
      const sim=new Simulation(c);run(sim,.3);return barG(sim.hpressureAt(v.id,'P'));};
    assert(measure(false)>70);assert(measure(true)<5);
  }},
  {name:'Ventieltekening weigert onbekende poorten, dubbele paden en fout aantal standen',fn(){
    const c=EXAMPLES.direct.build(),v=c.instances.find(i=>i.type==='v32_button'),def=c.defOf(v);
    assert.throws(()=>validateValveLayout(def,{boxes:[{paths:[['1','x']]},{paths:[]}]}),/bestaande/);
    assert.throws(()=>validateValveLayout(def,{boxes:[{paths:[['1','2'],['2','1']]},{paths:[]}]}),/Dubbele/);
    assert.throws(()=>validateValveLayout(def,{boxes:[]}),/standen/);
  }},
];
