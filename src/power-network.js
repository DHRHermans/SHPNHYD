/** Functional mains topology. Conductors carry identities and RMS nameplate values, not AC waveforms. */
export const MOTOR_TYPES=['industrial_motor','industrial_dc_motor','industrial_motor_1p','industrial_motor_6'];
export const isMotor=i=>!!i&&MOTOR_TYPES.includes(i.type);
export function contactorClosed(i,sim){
 if(i.faults?.contact_welded)return true;
 return !!sim.energized.get(i.params.tag.value)&&!(i.params.interlock?.value&&sim.energized.get(i.params.interlock.value));
}
export function powerClosed(i,c,sim){
 if(i.type==='industrial_contactor'||i.type==='industrial_contactor_1p')return contactorClosed(i,sim);
 return !!i.sim.pressed&&!i.sim.tripped&&!i.faults?.off;
}
export function motorNetwork(circuit,sim,{exclude=null}={}){
 const parent=new Map(),key=(i,p)=>`${i}:${p}`;
 const root=k=>{if(!parent.has(k))parent.set(k,k);let r=k;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(k)!==k){const n=parent.get(k);parent.set(k,r);k=n;}return r;};
 const join=(a,b)=>parent.set(root(a),root(b));
 for(const w of circuit.wires)if(w.kind==='motor')join(key(w.from.inst,w.from.port),key(w.to.inst,w.to.port));
 for(const i of circuit.instances){if(i.id===exclude)continue;const d=circuit.defOf(i);const pairs=d.powerPairs||(i.type==='industrial_contactor'?[['L1','T1'],['L2','T2'],['L3','T3']]:null);if(pairs&&powerClosed(i,circuit,sim))for(const[a,b]of pairs)join(key(i.id,a),key(i.id,b));}
 const phases=new Map(),sources=new Map();
 const emit=(id,port,phase)=>{const r=root(key(id,port));if(!phases.has(r))phases.set(r,new Set());phases.get(r).add(`${id}/${phase}`);};
 for(const i of circuit.instances){
  if(i.type==='industrial_earth'){emit(i.id,'PE','PE');continue;}
  if(!['industrial_supply','industrial_supply_1p','industrial_mains'].includes(i.type)||i.faults?.off)continue;
  const single=i.type==='industrial_supply_1p',voltage=i.params.voltage?.value||(single?230:400),system=i.params.system?.value||'TN-S';
  sources.set(i.id,{id:i.id,voltage,single,system});
  if(single){if(!Number(i.params.missing?.value||0))emit(i.id,'L',1);}else for(let p=1;p<=3;p++)if(Number(i.params.missing?.value||0)!==p)emit(i.id,`L${p}`,p);
  if(i.type==='industrial_supply')continue;
  if(system==='TN-C')emit(i.id,'PEN',0);
  else{if(system!=='IT'||i.params.neutral?.value==='yes')emit(i.id,'N',0);if(system==='TN-S'||system==='TN-C-S')emit(i.id,'PE','PE');}
 }
 const net=(id,p)=>phases.get(root(key(id,p)))||new Set();net.node=(id,p)=>root(key(id,p));net.sources=sources;return net;
}
export function terminalSupply(net,id,port){const values=[...net(id,port)];if(values.length!==1)return null;const[source,p]=values[0].split('/');return {source,phase:p==='PE'?'PE':Number(p),...net.sources.get(source)};}
export function windingSupply(net,id,a,b){
 const x=terminalSupply(net,id,a),y=terminalSupply(net,id,b);
 if(!x||!y||x.source!==y.source||x.phase==='PE'||y.phase==='PE'||x.phase===y.phase)return null;
 const voltage=x.single?x.voltage:(x.phase===0||y.phase===0?x.voltage/Math.sqrt(3):x.voltage);
 return{voltage,source:x.source,direction:1};
}
export function downstreamMotors(device,circuit,sim){
 const net=motorNetwork(circuit,sim,{exclude:device.id}),pairs=circuit.defOf(device).powerPairs||[];
 const outputs=new Set(pairs.map(([,p])=>net.node(device.id,p)));
 return circuit.instances.filter(i=>isMotor(i)&&circuit.defOf(i).ports.some(p=>p.kind==='motor'&&p.id!=='PE'&&outputs.has(net.node(i.id,p.id))));
}
