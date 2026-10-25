/** Shared physical input state, used by schematic and process controls alike. */
export function pressManual(inst,def,direction=1){
  if(!def.interactive)return false;
  if(def.manual)inst.sim.lever=direction<0?-1:1;
  else inst.sim.pressed=def.toggle?!inst.sim.pressed:true;
  return true;
}
export function releaseManual(inst,def){
  if(!def.interactive)return;
  if(def.manual)inst.sim.lever=0;
  else if(!def.toggle)inst.sim.pressed=false;
}

/** Pointer and keyboard holds return on release, cancellation, blur or disposal. */
export function bindManualButton(button,{inst,def,direction=1,run,live,hitTest=()=>true}){
  const doc=button.ownerDocument,win=doc.defaultView;
  let held=false,pointer=null;
  const release=()=>{if(!held)return;held=false;releaseManual(inst,def);pointer=null;live();};
  const press=()=>{if(held)return;held=true;pressManual(inst,def,direction);run();live();};
  button.addEventListener('pointerdown',e=>{
    if(e.button!==0||!hitTest(e))return;e.preventDefault();button.focus();pointer=e.pointerId;button.setPointerCapture(e.pointerId);press();
  });
  button.addEventListener('pointerup',e=>{if(e.pointerId===pointer)release();});
  button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  button.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();if(!e.repeat)press();}});
  button.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();release();}});
  // Assistive technology may activate a button without pointer/keyboard events.
  button.addEventListener('click',e=>{if(e.detail===0&&!held){press();release();}});
  button.addEventListener('blur',release);win.addEventListener('blur',release);
  const visibility=()=>{if(doc.hidden)release();};doc.addEventListener('visibilitychange',visibility);
  return ()=>{release();win.removeEventListener('blur',release);doc.removeEventListener('visibilitychange',visibility);};
}
