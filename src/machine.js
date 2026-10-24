import { applyControllerOutputs } from './ladder.js';

const byTag = (sim, tag) => sim.circuit.instances.find(i => i.params.tag?.value === tag);
export function drillState(sim) {
  const scene=sim.circuit.scene;
  if (scene?.type!=='drill-press') return null;
  const clamp=byTag(sim,scene.clamp), feed=byTag(sim,scene.feed), motor=byTag(sim,scene.motor);
  const clampX=clamp?.sim.x??0, feedX=feed?.sim.x??0, rpm=motor?.sim.rpm??0;
  return {clampX,feedX,rpm,clamped:clampX>=.985,open:clampX<=.015,top:feedX<=.015,bottom:feedX>=.985,stopped:Math.abs(rpm)<50,ready:!!clamp&&!!feed&&!!motor,workpiece:sim.machineWorkpiece!==false,hole:sim.machineHole||0};
}

export function machineInputs(sim) {
  const state=drillState(sim);if(!state)return;
  if (sim.machinePulseUntil != null && sim.time >= sim.machinePulseUntil) { const start=byTag(sim,'S_START'); if(start)start.sim.pressed=false;sim.machinePulseUntil=null; }
  sim.energized.set('B_WERKSTUK',state.workpiece);
  sim.energized.set('B_SPINDEL_STIL',state.stopped);
}

/** Virtual manual control and explicit teaching interlocks, using actual plant feedback. */
export function machineCommands(sim, manual) {
  const state=drillState(sim);if(!state)return;
  const command=sim.machineManual ||= {clamp:false,spindle:false,feed:false};
  const stopped=!!byTag(sim,'S_STOP')?.sim.pressed;
  const requested=tag=>sim.physicalOutputTags?.has(tag)?!!sim.controllerOutputs?.get(tag):!!sim.energized.get(tag);
  let clamp=manual?command.clamp:requested('Y_KLEM');
  let spindle=manual?command.spindle:requested('KM_BOOR');
  let feed=manual?command.feed:requested('Y_BOOR');
  const blocked=[];
  if(stopped) {spindle=false;feed=false;if(manual){command.spindle=false;command.feed=false;}}
  if(!clamp&&(!state.top||!state.stopped)){clamp=true;blocked.push('Klem blijft dicht tot de boor boven en de spindel stil is.');}
  if(!state.workpiece||!state.clamped||!state.ready){
    if(spindle||feed)blocked.push('Eerst een werkstuk plaatsen en volledig vastklemmen.');
    spindle=false;feed=false;
  }
  if(feed&&(!spindle||Math.abs(state.rpm)<500)){feed=false;blocked.push('Boorvoeding wacht op de spindel.');}
  sim.machineBlocked=blocked.join(' ');
  applyControllerOutputs(sim,[['Y_KLEM',clamp],['Y_BOOR',feed],['KM_BOOR',spindle]]);
}

export function machineProgress(sim,dt) {
  const state=drillState(sim);if(!state)return;
  // Visual progress only: elapsed dwell, not a cutting-force/material-removal solver.
  if(state.workpiece&&state.clamped&&state.bottom&&Math.abs(state.rpm)>500)sim.machineHole=Math.min(1,(sim.machineHole||0)+dt/2);
}
