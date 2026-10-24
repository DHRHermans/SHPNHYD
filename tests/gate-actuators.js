import assert from 'node:assert/strict';
import { Circuit } from '../src/circuit.js';
import { Simulation } from '../src/engine.js';
import { actuatorState,isVisualActuator } from '../src/actuator-view.js';
export const tests=[
 {name:'Procesbeeld herkent alle pneumatische/hydraulische cilinders en beide elektromotoren',fn(){
   const c=new Circuit();for(const type of ['cyl_double','cyl_single','cyl_through','h_cyl','industrial_motor','industrial_dc_motor'])assert(isVisualActuator(c.add(type,0,0)));
   assert.equal(isVisualActuator(c.add('supply',0,0)),false);
 }},
 {name:'Procesbeeld leest echte slag, druk en draairichting zonder de besturing te wijzigen',fn(){
   const c=new Circuit(),p=c.add('cyl_double',0,0),h=c.add('h_cyl',0,0),m=c.add('industrial_dc_motor',0,0),sim=new Simulation(c);
   p.sim.x=.75;h.sim.x=.25;m.sim.rpm=-120;
   const before=JSON.stringify(c.toJSON());const ps=actuatorState(p,sim),hs=actuatorState(h,sim),ms=actuatorState(m,sim);
   assert.equal(ps.stroke,.75*p.params.stroke.value);assert.equal(hs.stroke,.25*h.params.stroke.value);assert(hs.hydraulic);assert.equal(ms.rpm,-120);assert.equal(ps.pressures.length,2);assert.equal(hs.pressures[0].port,'A');assert.equal(JSON.stringify(c.toJSON()),before);
 }},
];
