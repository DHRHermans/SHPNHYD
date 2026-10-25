import {isMotor} from './power-network.js';
export {isMotor} from './power-network.js';
export const shaft=(x,y)=>({id:'shaft',x,y,dir:'right',kind:'mechanical'});
export function resolveDrive(device,circuit){
 const linked=circuit.wires.filter(w=>w.kind==='mechanical');const seen=new Set([device.id]),queue=[device.id];
 while(queue.length){const id=queue.shift();for(const w of linked){const next=w.from.inst===id?w.to.inst:w.to.inst===id?w.from.inst:null;if(next&&!seen.has(next)){seen.add(next);queue.push(next);}}}
 const motors=circuit.instances.filter(i=>isMotor(i)&&i.id!==device.id&&seen.has(i.id));
 const wired=seen.size>1;
 if(wired)return{motor:motors.length===1?motors[0]:null,coupled:true,conflict:motors.length>1,wired:true};
 const tag=device.params.motor?.value,motor=tag?circuit.instances.find(i=>isMotor(i)&&i.params.tag?.value===tag):null;
 return{motor: motor||null,coupled:!!tag,conflict:false,wired:false};
}
export function driveState(device,circuit){
 const r=resolveDrive(device,circuit);if(!r.coupled)return{...r,ratio:1,rpm:device.params.nominalRpm?.value||1450,status:'Eigen aandrijving'};
 const rpm=r.motor?.sim.rpm||0,nominal=device.params.nominalRpm?.value||r.motor?.params.speed?.value||1450;
 const reverse=device.params.reverse?.value==='yes';
 return{...r,rpm,ratio:r.motor?Math.max(0,Math.min(1.5,(reverse?Math.abs(rpm):rpm)/nominal)):0,status:r.conflict?'Meerdere motoren aan dezelfde as':!r.motor?'Geen motor aan gekoppelde as':rpm< -1&&!reverse?'Verkeerde draairichting':Math.abs(rpm)<1?'Motor stil':'Motor gekoppeld'};
}
export function shaftLoad(motor,circuit,sim){
 let torque=0,inertia=0;const nominal=motor.params.torque?.value||10;
 for(const i of circuit.instances){if(!['industrial_load','h_pump','air_compressor'].includes(i.type))continue;const r=resolveDrive(i,circuit);if(r.motor!==motor)continue;
  if(i.type==='industrial_load'){
   if(i.params.enabled.value==='off'||!i.sim.pressed)continue;
   const speed=Math.abs(motor.sim.rpm||0)/Math.max(1,motor.params.speed.value),kind=i.params.kind.value;
   const t=i.params.torque.value*(kind==='fan'?speed*speed:kind==='flywheel'?0:1);
   torque+=t;inertia+=i.params.inertia.value;i.sim.torque=t;i.sim.rpm=motor.sim.rpm||0;
  }else if(i.type==='h_pump'&&i.params.running.value!=='off'&&!i.faults.off){
   const pressure=Math.max(0,sim.hgauge(i.id,'P')-sim.hgauge(i.id,'T'))*1e5;
   torque+=pressure*(i.params.flow.value/60000)/(Math.max(1,i.params.nominalRpm?.value||1450)*Math.PI/30)/.85;
  }else if(i.type==='air_compressor'&&!i.faults.off&&i.sim.on){torque+=i.params.torque.value;}
 }
 return{torque,inertia,ratio:torque/nominal};
}
export function advanceDrive(i,ctx,{direction,target,status,currentFactor=1,legacy=false,response=.3,torqueFactor=1}){
 const load=shaftLoad(i,ctx.sim.circuit,ctx.sim),base=i.params.load?.value??1,total=base+load.ratio;
 const stalled=!!direction&&(i.faults?.seized||total>2.5*torqueFactor),off=i.faults?.off;
 if(off)direction=0;
 const rpmTarget=direction&&!stalled?target:0,tau=response+load.inertia*.4;
 i.sim.rpm+=(rpmTarget-i.sim.rpm)*(1-Math.exp(-ctx.dt/tau));if(Math.abs(i.sim.rpm)<.01)i.sim.rpm=0;
 const rated=i.params.current?.value||1,inrush=legacy?1:1+4*Math.max(0,1-Math.abs(i.sim.rpm)/Math.max(1,Math.abs(target)));
 i.sim.current=direction?rated*Math.max(.1,total)*currentFactor*(stalled?6:inrush):0;
 i.sim.direction=direction;i.sim.status=off?'Voeding onderbroken':stalled?'Geblokkeerd / overbelast':status;
 i.sim.loadTorque=load.torque;i.sim.loadRatio=total;
 const ambient=i.params.ambient?.value??20,time=i.params.thermalTime?.value??60,rise=i.params.temperatureRise?.value??55;
 i.sim.temperature??=ambient;
 const heating=rise*(i.sim.current/rated)**2;
 i.sim.temperature+=(ambient+heating-i.sim.temperature)*(1-Math.exp(-ctx.dt/(direction?time:time*1.8)));
}
