import assert from 'node:assert/strict';
import { Circuit, EXAMPLES } from '../src/circuit.js';
import { Simulation } from '../src/engine.js';
import { drillState } from '../src/machine.js';
const run=(sim,t)=>{for(let n=0;n<Math.round(t*1000);n++)sim.step(.001);};
const part=(sim,tag)=>sim.circuit.instances.find(i=>i.params.tag?.value===tag);
const start=sim=>{part(sim,'S_START').sim.pressed=true;sim.machinePulseUntil=sim.time+.12;};
const setup=mode=>{const c=Circuit.fromJSON(EXAMPLES.drillingMachine.build().toJSON());c.controller=mode;const sim=new Simulation(c);run(sim,.1);return sim;};
export const tests=[
  {name:'Machine handmatig: klemmen, spindel, boorvoeding en vrijgave volgen echte feedback',fn(){
    const sim=setup('manual');sim.machineManual.spindle=true;sim.machineManual.feed=true;run(sim,1);
    assert.equal(drillState(sim).rpm,0);assert.equal(drillState(sim).feedX,0);
    sim.machineManual.feed=false;sim.machineManual.spindle=false;sim.machineManual.clamp=true;run(sim,3);assert(drillState(sim).clamped);
    sim.machineManual.spindle=true;run(sim,1);assert(drillState(sim).rpm>1300);
    sim.machineManual.feed=true;run(sim,6);assert(drillState(sim).bottom);assert.equal(drillState(sim).hole,1);
    sim.machineManual.clamp=false;run(sim,.05);assert(drillState(sim).clamped,'De klem mag niet openen onder de boor');
    sim.machineManual.feed=false;run(sim,5);assert(drillState(sim).top);assert(drillState(sim).clamped,'Draaiende spindel blokkeert vrijgave');
    sim.machineManual.spindle=false;run(sim,5);assert(drillState(sim).open);assert(drillState(sim).stopped);
  }},
  {name:'Machine: scène en programma’s worden samen opgeslagen; geen start zonder werkstuk',fn(){
    const sim=setup('grafcet');assert.equal(sim.circuit.scene.feed,'A_BOOR');assert(sim.circuit.ladder.rungs.length>20);assert(sim.circuit.chart.steps.size>5);
    sim.machineWorkpiece=false;start(sim);run(sim,4);const s=drillState(sim);assert(s.open&&s.top&&s.stopped);assert.equal(s.hole,0);
    sim.reset();assert.equal(drillState(sim).hole,0);assert.equal(sim.machineWorkpiece,true);
  }},
  {name:'Machine: vastgelopen klem verhindert spindel en neergaande boor',fn(){
    const sim=setup('grafcet');part(sim,'A_KLEM').faults.seized=true;start(sim);run(sim,8);
    assert.equal(drillState(sim).clampX,0);assert.equal(drillState(sim).rpm,0);assert.equal(drillState(sim).feedX,0);
  }},
];
for(const mode of ['grafcet','ladder']){
  tests.push({name:`Machine ${mode}: volledige boorcyclus met bewaakte volgorde`,fn(){
    const sim=setup(mode);start(sim);let max=0,last=drillState(sim);
    for(let n=0;n<16000;n++){
      sim.step(.001);const s=drillState(sim);max=Math.max(max,s.feedX);
      if(s.feedX>.03)assert(s.clamped,'Werkstuk moet geklemd blijven onder de boor');
      if(s.clampX<last.clampX-.00001)assert(s.top&&s.stopped,'Klem mag pas los na terugtrekken en stilstand');
      last=s;
    }
    assert(max>.985);assert.equal(last.hole,1);assert(last.open&&last.top&&last.stopped);assert.equal(sim.controllerError,null);assert.equal(sim.diagnostics.failures,0);
  }});
  tests.push({name:`Machine ${mode}: stop trekt eerst terug en voorkomt automatische herstart`,fn(){
    const sim=setup(mode);start(sim);while(drillState(sim).feedX<.3&&sim.time<8)sim.step(.001);assert(drillState(sim).feedX>=.3);
    part(sim,'S_STOP').sim.pressed=true;
    for(let n=0;n<12000;n++){sim.step(.001);const s=drillState(sim);if(!s.top)assert(s.clamped);}
    const s=drillState(sim);assert(s.top&&s.open&&s.stopped);assert(s.hole<1);
    part(sim,'S_STOP').sim.pressed=false;run(sim,2);assert(drillState(sim).open&&drillState(sim).stopped);
  }});
}

const {newMachineScene,normalizeMachineScene}=await import('../src/machine-scene.js');
tests.push(
  {name:'Zelfbouwmachine start leeg en bewaart onderdelen, eigen tags en positie zonder programma',fn(){
    const c=EXAMPLES.machineBuilder.build();assert.equal(c.instances.length,0);assert.equal(c.chart,null);assert.equal(c.ladder,null);assert.deepEqual(c.scene.parts,[]);assert.equal(c.scene.interlocks,false);
    c.scene.parts=[{type:'drill',x:-40,y:12},{type:'vise',x:70,y:0}];c.scene.clamp='MIJN_KLEM';c.scene.motorOutput='MIJN_CONTACTOR';c.scene.title='<Mijn machine>';
    const copy=Circuit.fromJSON(c.toJSON());assert.deepEqual(copy.scene,c.scene);assert.equal(copy.instances.length,0);assert.equal(copy.chart,null);assert.equal(copy.ladder,null);
    assert.throws(()=>normalizeMachineScene({...newMachineScene(),parts:[{type:'drill',x:Infinity,y:0}]}));
    assert.throws(()=>normalizeMachineScene({...newMachineScene(),parts:[{type:'vise'},{type:'vise'}]}));
  }},
  {name:'Zelfbouwmachine gebruikt eigen signaaltags en laat automatische besturing zelf vergrendelen',fn(){
    const c=EXAMPLES.drillingMachine.build();c.scene.interlocks=false;c.controller='ladder';c.ladder={rungs:[]};
    c.scene.motorOutput='K_EIGEN';c.instances.find(i=>i.type==='industrial_coil').params.tag.value='K_EIGEN';
    c.instances.find(i=>i.type==='industrial_contactor').params.tag.value='K_EIGEN';
    c.scene.workpieceInput='B_MATERIAAL';c.scene.stoppedInput='B_STIL';
    c.ladder.rungs=[{coil:'K_EIGEN',kind:'coil',branches:[[{tag:'B_MATERIAAL',nc:false}]]}];
    const sim=new Simulation(c);run(sim,1);
    assert(drillState(sim).open);assert(drillState(sim).rpm>500,'Eigen programma mag de motor bedienen zonder ingebouwde klemvolgorde');
    assert.equal(sim.energized.get('B_MATERIAAL'),true);assert.equal(sim.energized.get('B_WERKSTUK'),undefined);
    sim.machineWorkpiece=false;run(sim,1);assert(drillState(sim).stopped);
  }},
  {name:'Zelfbouwmachine zonder onderdelen grijpt niet in op het bestaande schema',fn(){
    const c=EXAMPLES.drillingMachine.build();c.scene.parts=[];const sim=new Simulation(c);run(sim,.1);assert.equal(drillState(sim).ready,false);
    c.scene.parts=['drill','vise','workpiece'].map(type=>({type,x:0,y:0}));assert.equal(drillState(sim).ready,true);
    c.scene.feed=c.scene.clamp;assert.equal(drillState(sim).ready,false);
  }},
);
