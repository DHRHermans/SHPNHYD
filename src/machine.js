import {isMotor} from './power-network.js';
import { sceneBinding, sceneParts } from './machine-scene.js';
import { applyControllerOutputs } from './ladder.js';

const byTag = (sim, tag) => sim.circuit.instances.find(i => tag && i.params.tag?.value === tag);
export function drillState(sim) {
  const scene=sim.circuit.scene;
  if (scene?.type!=='drill-press') return null;
  const clamp=byTag(sim,scene.clamp), feed=byTag(sim,scene.feed), motor=byTag(sim,scene.motor);
  const assembled=['drill','vise','workpiece'].every(type=>sceneParts(scene).some(p=>p.type===type));
  const clampX=clamp?.sim.x??0, feedX=feed?.sim.x??0, rpm=motor?.sim.rpm??0;
  return {clampX,feedX,rpm,clamped:clampX>=.985,open:clampX<=.015,top:feedX<=.015,bottom:feedX>=.985,stopped:Math.abs(rpm)<50,ready:assembled&&/^(cyl_|h_cyl)/.test(clamp?.type||'')&&/^(cyl_|h_cyl)/.test(feed?.type||'')&&clamp!==feed&&isMotor(motor),workpiece:sim.machineWorkpiece!==false,hole:sim.machineHole||0};
}

export function machineInputs(sim) {
  const state=drillState(sim);if(!state)return;
  if (sim.machinePulseUntil != null && sim.time >= sim.machinePulseUntil) { const start=byTag(sim,sceneBinding(sim.circuit.scene,'start')); if(start)start.sim.pressed=false;sim.machinePulseUntil=null; }
  const scene=sim.circuit.scene;
  if(sceneBinding(scene,'workpieceInput'))sim.energized.set(sceneBinding(scene,'workpieceInput'),state.workpiece&&sceneParts(scene).some(p=>p.type==='workpiece'));
  if(sceneBinding(scene,'stoppedInput'))sim.energized.set(sceneBinding(scene,'stoppedInput'),state.stopped);
}

/** Virtual manual control and explicit teaching interlocks, using actual plant feedback. */
export function machineCommands(sim, manual) {
  const state=drillState(sim);if(!state)return;
  const scene=sim.circuit.scene;
  if(!state.ready){sim.machineBlocked='Plaats de drie onderdelen en koppel twee cilinders en een motor.';return;}
  const command=sim.machineManual ||= {clamp:false,spindle:false,feed:false};
  const stopped=!!byTag(sim,sceneBinding(scene,'stop'))?.sim.pressed;
  const requested=tag=>sim.physicalOutputTags?.has(tag)?!!sim.controllerOutputs?.get(tag):!!sim.energized.get(tag);
  let clamp=manual?command.clamp:requested(sceneBinding(scene,'clampOutput'));
  let spindle=manual?command.spindle:requested(sceneBinding(scene,'motorOutput'));
  let feed=manual?command.feed:requested(sceneBinding(scene,'feedOutput'));
  const blocked=[];
  if(stopped) {spindle=false;feed=false;if(manual){command.spindle=false;command.feed=false;}}
  if(scene.interlocks!==false&&!clamp&&(!state.top||!state.stopped)){clamp=true;blocked.push('Klem blijft dicht tot de boor boven en de spindel stil is.');}
  if(scene.interlocks!==false&&(!state.workpiece||!state.clamped||!state.ready)){
    if(spindle||feed)blocked.push('Eerst een werkstuk plaatsen en volledig vastklemmen.');
    spindle=false;feed=false;
  }
  if(scene.interlocks!==false&&feed&&(!spindle||Math.abs(state.rpm)<500)){feed=false;blocked.push('Boorvoeding wacht op de spindel.');}
  sim.machineBlocked=blocked.join(' ');
  // With assistance disabled an automatic program alone owns its outputs.
  if(manual||scene.interlocks!==false)applyControllerOutputs(sim,[[sceneBinding(scene,'clampOutput'),clamp],[sceneBinding(scene,'feedOutput'),feed],[sceneBinding(scene,'motorOutput'),spindle]].filter(([tag])=>tag));
}

export function machineProgress(sim,dt) {
  const state=drillState(sim);if(!state)return;
  // Visual progress only: elapsed dwell, not a cutting-force/material-removal solver.
  if(state.workpiece&&state.clamped&&state.bottom&&Math.abs(state.rpm)>500)sim.machineHole=Math.min(1,(sim.machineHole||0)+dt/2);
}
