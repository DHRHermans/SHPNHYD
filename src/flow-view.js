import {massFlow,orificeFlow,RT,P_ATM} from './engine.js';
const key=(id,port)=>id+':'+port;
/** Read-only component through-flow, sampled from the same constitutive laws as the solver. */
export function componentFlows(sim){
 const values=new Map(),c=sim.circuit,ctx=sim.makeCtx(.001);
 for(const inst of c.instances){const d=c.defOf(inst),oil=d.ports.some(p=>p.kind==='hydraulic'),ports=d.ports.filter(p=>['pneumatic','hydraulic'].includes(p.kind||'pneumatic'));
  const add=(net,q)=>{if(!Number.isFinite(q))return;for(const p of ports){const n=oil?sim.hydIndex(inst.id,p.id):sim.netIndex(inst.id,p.id);if(n===net&&net!=null)values.set(key(inst.id,p.id),(values.get(key(inst.id,p.id))||0)+q);}};
  if(inst.sim.x!=null&&inst.params.bore){
   const area=Math.PI*(inst.params.bore.value/1000)**2/4,rod=Math.PI*(inst.params.rod?.value/1000||0)**2/4,v=inst.sim.v||0;
   ports.forEach((p,n)=>{const q=(n?-(area-rod):area)*v;values.set(key(inst.id,p.id),oil?q:q*sim.pressureAt(inst.id,p.id)/RT);});continue;
  }
  if(ports.length&&!d.fluidExtras&&(oil?d.stampHydraulic:d.stamp)){
   const pressure=n=>n==null?P_ATM:(oil?sim.ph[n]:sim.p[n])??P_ATM;
   const methods={restrict:(a,b,C,crit)=>{const q=massFlow(pressure(a),pressure(b),C,crit);add(a,q);add(b,-q);},restrictToFixed:(a,C,crit,p)=>add(a,massFlow(pressure(a),p,C,crit)),orifice:(a,b,K)=>{const q=orificeFlow(pressure(a),pressure(b),K);add(a,q);add(b,-q);},orificeToFixed:(a,K,p)=>add(a,orificeFlow(pressure(a),p,K)),toFixed:(a,g,p)=>add(a,g*(pressure(a)-p)),inject:(a,q)=>add(a,-q)};
   const st=new Proxy(methods,{get:(o,k)=>o[k]||(()=>0)});
   // Some stamps retain working diagnostics; run those on a detached instance copy.
   try{const copy={...inst,sim:structuredClone(inst.sim),params:structuredClone(inst.params),faults:{...inst.faults}};(oil?d.stampHydraulic:d.stamp)(copy,st,ctx,oil?sim.ph:sim.p);}catch{for(const p of ports)values.delete(key(inst.id,p.id));}
  }
  if(d.resistance&&d.ports.length===2&&d.ports.every(p=>p.kind==='electric')){
   const q=inst.faults.coil_open||inst.faults.off?0:(sim.volts(inst.id,d.ports[0].id)-sim.volts(inst.id,d.ports[1].id))/d.resistance;
   values.set(key(inst.id,d.ports[0].id),q);values.set(key(inst.id,d.ports[1].id),-q);
  }
 }
 return values;
}
export function wireActivity(w,flows){
 if(w.kind==='motor')return 0;
 const a=flows.get(key(w.from.inst,w.from.port)),b=flows.get(key(w.to.inst,w.to.port)),epsilon=w.kind==='hydraulic'?1e-9:w.kind==='electric'?1e-6:1e-8;
 if(a!=null&&b!=null){if(a< -epsilon&&b>epsilon)return 1;if(a>epsilon&&b< -epsilon)return -1;return 0;}
 if(b!=null&&Math.abs(b)>epsilon)return Math.sign(b);if(a!=null&&Math.abs(a)>epsilon)return -Math.sign(a);return 0;
}
export function drawFlowActivity(host,sim,enabled){
 if(!enabled){host.querySelectorAll('.energy-flow').forEach(n=>{n.classList.remove('energy-flow');n.style.strokeDasharray='';n.style.strokeDashoffset='';});return;}
 const values=componentFlows(sim);
 for(const w of sim.circuit.wires){const line=host.querySelector(`[data-wire-line="${w.id}"]`);if(!line)continue;const direction=wireActivity(w,values);line.classList.toggle('energy-flow',!!direction);line.style.strokeDasharray=direction?'3 9':'';line.style.strokeDashoffset=direction?String(-direction*sim.time*42):'';}
}
