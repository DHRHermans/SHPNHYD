import assert from 'node:assert/strict';
import {AutoSave} from '../src/autosave.js';
import {Circuit,EXAMPLES} from '../src/circuit.js';
import {Simulation} from '../src/engine.js';
import {BY_ID} from '../src/catalog.js';
import {Grafcet} from '../src/grafcet.js';
import {componentExplanation,measure,freshEvidence,observeEvidence,lessonSteps,LESSONS,inspectConditions} from '../src/learning-core.js';
import {componentFlows,wireActivity} from '../src/flow-view.js';
const run=(sim,seconds,observe=()=>{})=>{for(let n=0;n<seconds*1000;n++){sim.step(.001);observe(sim);}};
export const tests=[
 {name:'Werkherstel: gewijzigde documenten, maximaal vier vorige versies en mislukte opslag',fn(){
  const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};let n=0,status='';const save=new AutoSave(storage,()=>({circuit:{instances:[n]},title:'Les '+n,route:'same'}),s=>status=s);
  assert.equal(save.read(),null);for(n=0;n<7;n++)assert(save.flush());const stored=save.read();assert.equal(stored.current.title,'Les 6');assert.equal(stored.backups.length,4);assert.equal(stored.backups[0].title,'Les 5');
  save.storage={getItem:storage.getItem,setItem:()=>{throw new Error('quota');}};assert.equal(save.flush(),false);assert.match(status,/mislukt/);assert.equal(save.read().current.title,'Les 6');
 }},
 {name:'Onderwijsmetadata: indeling, voortgang en verborgen storing overleven import en ID-remapping',fn(){
  const c=EXAMPLES.direct.build(),part=c.instances.find(i=>i.type==='cyl_single');part.presentation={order:3,scale:'large',group:'Klem <A>'};part.faults.seized=true;c.challenge={inst:part.id,fault:'seized',revealed:false,baseline:{}};c.learning={lesson:'air',completed:[0,1],notes:'Mijn uitleg',prediction:'Schuift uit',evidence:{end:true}};
  const copy=Circuit.fromJSON(c.toJSON()),p=copy.instances.find(i=>i.type==='cyl_single');assert.notEqual(p.id,part.id);assert.equal(copy.challenge.inst,p.id);assert.equal(copy.challenge.revealed,false);assert.deepEqual(p.presentation,part.presentation);assert.deepEqual(copy.learning.completed,[0,1]);assert.equal(copy.learning.evidence.end,true);
  const bad=c.toJSON();bad.instances[0].presentation={order:Infinity};assert.throws(()=>Circuit.fromJSON(bad),/simulatievolgorde/);
 }},
 {name:'Onderdeeluitleg: alle componenten hebben werking en poortbeschrijvingen',fn(){
  const c=new Circuit();for(const [id,d] of BY_ID){const original=c.add(id,0,0),info=componentExplanation(original,d);assert(info.operation.length>30);assert.equal(info.ports.length,d.ports.length);}
  const v=c.add('v32_button',0,0);assert.match(componentExplanation(v,c.defOf(v)).ports.find(p=>p.id==='3').meaning,/Ontluchting/);
 }},
 {name:'Meettafel: twee meetpennen geven verschilspanning, stroom is begrensd tot ondersteunde lasten',fn(){
  const c=new Circuit(),plus=c.add('rail_24v',0,0),zero=c.add('rail_0v',0,0),coil=c.add('relay_coil',0,0);c.connect({inst:plus.id,port:'a'},{inst:coil.id,port:'a'});c.connect({inst:coil.id,port:'b'},{inst:zero.id,port:'a'});const sim=new Simulation(c);run(sim,.01);
  const v=measure(c,sim,{mode:'voltage',a:plus.id,ap:'a',b:zero.id,bp:'a'});assert(Math.abs(v.value-24)<.01);assert(measure(c,sim,{mode:'current',a:coil.id}).value>0);coil.faults.coil_open=true;assert.equal(measure(c,sim,{mode:'current',a:coil.id}).value,0);assert.equal(measure(c,sim,{mode:'rpm',a:plus.id}).value,null);assert.equal(measure(c,sim,{mode:'voltage',a:plus.id,ap:'bad',b:zero.id,bp:'a'}).value,null);
 }},
 {name:'Begeleide opdracht: bewijs vereist echte bediening, eindstand en terugkeer',fn(){
  const c=EXAMPLES.direct.build(),sim=new Simulation(c),e=freshEvidence(),steps=lessonSteps(LESSONS[0]),button=c.instances.find(i=>i.type==='v32_button');assert.equal(steps[1].check(c,e),false);assert.equal(steps[2].check(c,e),false);
  button.sim.pressed=true;run(sim,2,s=>observeEvidence(e,s));assert(steps[1].check(c,e));assert(steps[2].check(c,e));assert.equal(steps[3].check(c,e),false);button.sim.pressed=false;run(sim,2,s=>observeEvidence(e,s));assert(steps[3].check(c,e));
 }},
 {name:'Energievisualisatie leest modelstromen zonder simulatie te wijzigen en tekent geen fictieve AC-stroom',fn(){
  const c=EXAMPLES.direct.build(),sim=new Simulation(c),button=c.instances.find(i=>i.type==='v32_button');button.sim.pressed=true;run(sim,.04);const before=JSON.stringify(c.instances.map(i=>i.sim)),time=sim.time,flows=componentFlows(sim);assert([...flows.values()].some(v=>Math.abs(v)>1e-7));assert.equal(JSON.stringify(c.instances.map(i=>i.sim)),before);assert.equal(sim.time,time);assert(c.wires.some(w=>wireActivity(w,flows)!==0));assert.equal(wireActivity({kind:'motor'},flows),0);
 }},
 {name:'Voorwaardeninspectie verandert geen GRAFCET-timers, flanken of actieve stappen',fn(){
  const c=EXAMPLES.grafcetPneumatic.build(),sim=new Simulation(c);run(sim,.01);const active=[...sim.chart.active],timers=[...sim.chart.stepTimers];for(let n=0;n<10;n++)assert(inspectConditions(sim).length>0);assert.deepEqual([...sim.chart.active],active);assert.deepEqual([...sim.chart.stepTimers],timers);
 }},
 {name:'Opdrachtbewijs koppelt terugkeer en stilstand aan dezelfde aandrijving',fn(){
  const c=new Circuit(),a=c.add('cyl_double',0,0),b=c.add('cyl_double',0,0),m=c.add('industrial_motor',0,0),n=c.add('industrial_dc_motor',0,0),sim=new Simulation(c),e=freshEvidence();a.params.tag.value='A1';b.params.tag.value='A2';m.params.tag.value='M1';n.params.tag.value='M2';
  a.sim.x=1;b.sim.x=0;m.sim.rpm=100;n.sim.rpm=0;observeEvidence(e,sim);assert(e.end&&e.motorRan);assert.equal(e.returned,false);assert.equal(e.motorStopped,false);a.sim.x=0;m.sim.rpm=0;observeEvidence(e,sim);assert(e.returned&&e.motorStopped);
 }},
 {name:'Flankinspectie consumeert een echte GRAFCET-startflank niet',fn(){
  const c=new Circuit(),button=c.add('btn_no',0,0);button.params.tag.value='S1';const g=new Grafcet(),a=g.addStep({name:'0',initial:true,x:0,y:0}),b=g.addStep({name:'1',x:0,y:150});g.addTransition({from:[a.id],to:[b.id],receptivity:'↑S1',x:0,y:80});g.reset();c.chart=g;c.controller='grafcet';const sim=new Simulation(c);sim.chart=g;sim.step(.001);button.sim.pressed=true;for(let n=0;n<10;n++)assert.equal(inspectConditions(sim)[0].value,null);sim.step(.001);assert(g.active.has(b.id));
 }},
];
