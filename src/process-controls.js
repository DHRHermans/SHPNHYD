import {isMotor} from './power-network.js';
import {resolveDrive} from './motor-mechanics.js';
import { physicalComponentSVG } from './physical-components.js';
import { BY_ID } from './catalog.js';
import { isVisualActuator } from './actuator-view.js';
import { bindManualButton } from './manual-control.js';
const instDrive=(i,c)=>i.params.motor?resolveDrive(i,c):{wired:false};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function processStatus(inst,def){
  const s=inst.sim,parts=[];
  if(def.manual)parts.push(`Hefboom: ${s.lever<0?'links':s.lever>0?'rechts':'midden'}`);
  if(def.interactive&&!def.manual)parts.push(s.pressed?'Ingedrukt / ingeschakeld':'Losgelaten / uitgeschakeld');
  if(s.state!=null)parts.push(`Ventielstand ${Number(s.state)+1}`);
  if(s.on!=null)parts.push(s.on?'Bekrachtigd':'Niet bekrachtigd');
  if(s.closed!=null)parts.push(s.closed?'Contact gesloten':'Contact open');
  if(s.tripped!=null)parts.push(s.tripped?'Thermisch uitgeschakeld':'Thermisch gereed');
  if(s.temperature!=null)parts.push(`${s.temperature.toFixed(1)} °C`);
  if(s.resistance!=null)parts.push(`${s.resistance.toFixed(1)} Ω`);
  if(s.current!=null)parts.push(`${s.current.toFixed(1)} A (model)`);
  if(s.driveStatus)parts.push(s.driveStatus);
  if(s.reason)parts.push(s.reason);
  if(typeof s.q==='number')parts.push(`${s.q.toFixed(1)} l/min`);
  if(s.torque!=null)parts.push(`${s.torque.toFixed(1)} Nm`);
  if(s.heat!=null)parts.push(`Belasting ${Math.round(s.heat*100)} %`);
  return parts.join(' · ');
}
export class ProcessControls {
  constructor(host,{circuit,simulation,run,parametersChanged}){Object.assign(this,{host,circuit,simulation,run,parametersChanged});this.disposers=[];}
  dispose(){for(const dispose of this.disposers)dispose();this.disposers=[];}
  draw(){
    this.dispose();
    const parts=this.circuit().instances.filter(i=>!isVisualActuator(i));
    const primary=i=>{const d=BY_ID.get(i.type);return ['h_pump','air_compressor'].includes(i.type)||d.interactive||d.geom||/ventiel|sensor|schakelaar|drukknop|spoel|lamp|relais|contactor|contact|automaat|beveilig/i.test(d.name);};
    const card=i=>{
      const def=BY_ID.get(i.type),knobs=Object.entries(i.params).filter(([key,p])=>p.type==='range'&&['opening','pressure','setpoint','rated','torque'].includes(key));
      const buttons=def.interactive?(def.manual?'<button data-operate="-1">◀ Links vasthouden</button><button data-operate="1">Rechts vasthouden ▶</button>':'<button data-operate="1"></button>'):`<p class="process-automatic">${knobs.length?'Handmatig instelbaar via schuif':'Volgt het schema / de besturing'}</p>`;
      const drive=instDrive(i,this.circuit());
      const binding=i.params.motor?`<label>${esc(i.params.motor.label)}<select data-drive-motor ${drive.wired?'disabled':''}><option value="">${i.type==='h_pump'?'Eigen aandrijving':'Geen motor gekozen'}</option>${this.circuit().instances.filter(isMotor).map(m=>`<option value="${esc(m.params.tag.value)}" ${(drive.wired?drive.motor?.params.tag.value:i.params.motor.value)===m.params.tag.value?'selected':''}>${esc(m.params.tag.value)}</option>`).join('')}</select></label>${drive.wired?'<p>Mechanische asverbinding uit het schema heeft voorrang.</p>':''}`:'';
      return `<article class="process-card" data-process="${esc(i.id)}"><h4>${esc(i.params.tag?.value||def.short)}</h4><p>${esc(def.short)}</p><div class="process-device ${def.interactive?'process-device-operable':''}"><div data-process-physical>${physicalComponentSVG(i,def,this.simulation())}</div><div class="process-buttons">${def.interactive?buttons:''}</div></div><p data-process-action>${def.interactive?'Bedien het fysieke onderdeel hierboven.':knobs.length?'Instelbaar met de draaiknop en schuif.':'Volgt het schema / de besturing'}</p>${def.manual?'<p>Veerterugstelling: loslaten = middenstand.</p>':''}${binding}${knobs.map(([key,p])=>`<label>${esc(p.label)} <output data-knob-value="${key}"></output><input data-process-knob="${key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}"></label>`).join('')}<div data-process-state></div><div data-process-ports></div></article>`;
    };
    this.host.innerHTML=`<section class="process-overview"><h3>Bediening en ventielen uit mijn schema</h3><p>Bedien handmatige onderdelen hier rechtstreeks. Houd drukknoppen en veerteruggestelde hefbomen ingedrukt; vergrendelende knoppen blijven staan tot je opnieuw drukt. Elektrische ventielen volgen hun spoelen en sensoren volgen hun schema.</p><div class="process-grid">${parts.filter(primary).map(card).join('')}</div>${parts.some(i=>!primary(i))?`<details class="process-other"><summary>Voedingen en overige schemaonderdelen</summary><div class="process-grid">${parts.filter(i=>!primary(i)).map(card).join('')}</div></details>`:''}${parts.length?'':'<p>Plaats drukknoppen, ventielen of andere onderdelen in Schakeling; ze verschijnen hier automatisch.</p>'}</section>`;
    for(const node of this.host.querySelectorAll('[data-process]')){
      const inst=this.circuit().byId(node.dataset.process),def=BY_ID.get(inst.type);
      node.querySelector('[data-drive-motor]')?.addEventListener('change',e=>{inst.params.motor.value=e.target.value;this.parametersChanged(inst,'motor');this.live();});
      const dialPoint=inst.type==='industrial_load'?{x:270,y:40}:['industrial_breaker','industrial_motor_protector'].includes(inst.type)?{x:157,y:165}:{x:182,y:38};
      const inDial=e=>{const svg=node.querySelector('svg'),p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return Math.hypot(q.x-dialPoint.x,q.y-dialPoint.y)<=26;};
      for(const button of node.querySelectorAll('[data-operate]'))this.disposers.push(bindManualButton(button,{inst,def,direction:Number(button.dataset.operate),run:this.run,live:()=>this.live(),hitTest:e=>!node.querySelector('[data-process-knob]')||!inDial(e)}));
      const dialInput=node.querySelector('[data-process-knob]');
      if(dialInput){
        const device=node.querySelector('.process-device');let drag=null;
        device.addEventListener('pointerdown',e=>{
          if(e.button!==0)return;const svg=device.querySelector('svg'),point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;
          const p=point.matrixTransform(svg.getScreenCTM().inverse());if(Math.hypot(p.x-dialPoint.x,p.y-dialPoint.y)>26)return;
          e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY,value:Number(dialInput.value)};device.setPointerCapture(e.pointerId);
        });
        device.addEventListener('pointermove',e=>{
          if(!drag||e.pointerId!==drag.id)return;const min=Number(dialInput.min),max=Number(dialInput.max),step=Number(dialInput.step);
          const value=drag.value+(e.clientX-drag.x+drag.y-e.clientY)*(max-min)/180;
          dialInput.value=String(Math.max(min,Math.min(max,min+Math.round((value-min)/step)*step)));dialInput.dispatchEvent(new Event('input',{bubbles:true}));
        });
        const end=()=>{drag=null;};device.addEventListener('pointerup',end);device.addEventListener('pointercancel',end);device.addEventListener('lostpointercapture',end);
      }
      for(const input of node.querySelectorAll('[data-process-knob]'))input.addEventListener('input',()=>{
        const p=inst.params[input.dataset.processKnob];const n=Number(input.value);if(!Number.isFinite(n))return;
        p.value=Math.max(p.min,Math.min(p.max,n));this.parametersChanged(inst,input.dataset.processKnob);this.live();
      });
    }
    this.live();
  }
  live(){
    const sim=this.simulation();
    for(const card of this.host.querySelectorAll('[data-process]')){
      const inst=this.circuit().byId(card.dataset.process);if(!inst)continue;const def=BY_ID.get(inst.type);
      const html=physicalComponentSVG(inst,def,sim),image=card.querySelector('[data-process-physical]');if(image._markup!==html){image.innerHTML=html;image._markup=html;}
      card.querySelector('[data-process-state]').textContent=processStatus(inst,def);
      card.querySelector('[data-process-ports]').textContent=def.ports.filter(p=>!['motor','mechanical'].includes(p.kind)).map(p=>p.kind==='electric'?`${p.id}: ${sim.volts(inst.id,p.id).toFixed(1)} V`:`${p.id}: ${(p.kind==='hydraulic'?sim.hgauge(inst.id,p.id):sim.gauge(inst.id,p.id)).toFixed(1)} bar`).join(' · ');
      for(const button of card.querySelectorAll('[data-operate]')){
        const active=def.manual?inst.sim.lever===Number(button.dataset.operate):!!inst.sim.pressed;button.setAttribute('aria-pressed',String(active));
        if(!def.manual)button.textContent=inst.type==='estop'?(active?'Noodstop ontgrendelen':'Noodstop indrukken'):['industrial_breaker','industrial_motor_protector'].includes(inst.type)?(inst.sim.tripped?'Beveiliging resetten (na afkoelen)':active?'Uitschakelen':'Inschakelen'):inst.type==='industrial_load'?(active?'Belasting losnemen':'Belasting aanleggen'):inst.type==='industrial_overload'?'Thermisch relais resetten':def.toggle?(active?'Uitschakelen / vrijgeven':'Inschakelen / vergrendelen'):'Indrukken (vasthouden)';
      }
      if(def.interactive)card.querySelector('[data-process-action]').textContent=def.manual?'Houd de linker- of rechterkant van de hefboom ingedrukt.':card.querySelector('[data-operate]').textContent;
      for(const output of card.querySelectorAll('[data-knob-value]')){const p=inst.params[output.dataset.knobValue];output.textContent=String(p.value)+(p.unit?' '+p.unit:'');}
    }
  }
}
