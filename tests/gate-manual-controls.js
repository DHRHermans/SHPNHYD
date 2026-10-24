import assert from 'node:assert/strict';
import { Circuit,EXAMPLES } from '../src/circuit.js';
import { Simulation } from '../src/engine.js';
import { pressManual,releaseManual } from '../src/manual-control.js';
import { processStatus } from '../src/process-controls.js';
const run=(sim,t)=>{for(let n=0;n<t*1000;n++)sim.step(.001);};
export const tests=[
 {name:'Procesbediening: momentane knop bedient echte pneumatische cilinder en keert terug',fn(){
   const c=EXAMPLES.direct.build(),sim=new Simulation(c),valve=c.instances.find(i=>i.type==='v32_button'),cyl=c.instances.find(i=>i.type==='cyl_single'),def=c.defOf(valve);
   pressManual(valve,def);run(sim,2);assert(cyl.sim.x>.95);assert.equal(valve.sim.state,1);
   releaseManual(valve,def);run(sim,2);assert(cyl.sim.x<.05);assert.equal(valve.sim.state,0);
 }},
 {name:'Procesbediening: vergrendeling blijft staan; tweede druk schakelt terug; NC en noodstop openen',fn(){
   const c=new Circuit(),v=c.add('v32_detent',0,0),no=c.add('btn_no',0,0),nc=c.add('btn_nc',0,0),stop=c.add('estop',0,0);
   for(const i of [v,stop]){const def=c.defOf(i);pressManual(i,def);releaseManual(i,def);assert.equal(i.sim.pressed,true);pressManual(i,def);releaseManual(i,def);assert.equal(i.sim.pressed,false);}
   for(const i of [no,nc]){pressManual(i,c.defOf(i));assert.equal(i.sim.pressed,true);releaseManual(i,c.defOf(i));assert.equal(i.sim.pressed,false);}
 }},
 {name:'Procesbediening: hydraulische hefboom keert naar midden; automatische ventielen zijn niet handbediend',fn(){
   const c=new Circuit(),v=c.add('h_v43_closed',0,0),auto=c.add('v52_sol_spring',0,0),sim=new Simulation(c);
   pressManual(v,c.defOf(v),-1);run(sim,.01);assert.equal(v.sim.state,0);assert.match(processStatus(v,c.defOf(v)),/links/);
   releaseManual(v,c.defOf(v));run(sim,.01);assert.equal(v.sim.state,1);
   pressManual(v,c.defOf(v),1);run(sim,.01);assert.equal(v.sim.state,2);releaseManual(v,c.defOf(v));run(sim,.01);assert.equal(v.sim.state,1);
   assert.equal(pressManual(auto,c.defOf(auto)),false);assert.equal(auto.sim.pressed,undefined);
 }},
];
