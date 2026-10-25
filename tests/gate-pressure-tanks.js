import assert from'node:assert/strict';
import{Circuit,EXAMPLES}from'../src/circuit.js';
import{Simulation}from'../src/engine.js';
const run=(s,t)=>{for(let n=0;n<Math.round(t*1000);n++)s.step(.001);};
const setup=()=>{const c=EXAMPLES.hydraulicAccumulator.build(),s=new Simulation(c);return{c,s,a:c.instances.find(i=>i.type==='h_accumulator'),v:c.instances.find(i=>i.type==='h_shutoff'),m:c.instances.find(i=>i.type==='h_motor')};};
export const tests=[
{name:'Hydraulische druktank slaat olie op en levert na afsluiten van de pomp motorvermogen',fn(){const r=setup();r.v.sim.pressed=true;run(r.s,5);assert(r.a.sim.oilLitres>.2);const before=r.a.sim.oilLitres;r.v.sim.pressed=false;run(r.s,.5);assert(r.a.sim.oilLitres<before);assert(r.a.sim.q<0);assert(r.m.sim.rpm>100);assert.equal(r.s.diagnostics.failures,0);}},
{name:'Lege accumulator injecteert geen gasvoordruk in de olieleiding en kan niet negatief vullen',fn(){const r=setup();run(r.s,.2);assert.equal(r.a.sim.oilVolume,0);assert(Math.abs(r.a.sim.pressure)<.1);assert.equal(r.a.sim.q,0);assert.equal(r.a.sim.gasPressure,30);}},
{name:'Accumulator volgt de gaswet en olievolumebalans bij ontladen',fn(){const r=setup();r.v.sim.pressed=true;run(r.s,3);const p0=1.01325+r.a.params.precharge.value,expected=p0*(1/(1-r.a.sim.fill))**r.a.params.exponent.value-1.01325;assert(Math.abs(r.a.sim.gasPressure-expected)<.02);r.v.sim.pressed=false;const before=r.a.sim.oilVolume;let discharged=0;for(let n=0;n<300;n++){r.s.step(.001);discharged+=r.a.sim.q/60000*.001;}assert(Math.abs(r.a.sim.oilVolume-before-discharged)<1e-10);}},
{name:'Accumulatorafsluiting behoudt inhoud, werkdrukbewaking waarschuwt en JSON behoudt instellingen',fn(){const r=setup();r.v.sim.pressed=true;r.a.params.rated.value=20;run(r.s,3);assert(r.a.sim.overpressure);r.a.faults.off=true;const volume=r.a.sim.oilVolume;run(r.s,.2);assert.equal(r.a.sim.oilVolume,volume);assert.equal(r.a.sim.q,0);const copy=Circuit.fromJSON(r.c.toJSON()),a=copy.instances.find(i=>i.type==='h_accumulator');assert.equal(a.params.rated.value,20);assert.equal(a.params.precharge.value,30);}},
];
