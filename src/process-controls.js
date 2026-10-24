import { BY_ID } from './catalog.js';
import { isVisualActuator } from './actuator-view.js';
import { bindManualButton } from './manual-control.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Inline styles also keep a printed process symbol readable outside the application.
const ink='<style>.sym{fill:none;stroke:#153b40;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.sym.thin{stroke-width:1.1}.sym.fill{fill:#153b40;stroke:none}.sym.fill-soft{fill:#cfd6dd}.sym.barrel{fill:white}.sym.dash{stroke-dasharray:4 3}.sym.live-fill{fill:#c5eadc;stroke:#087f78}.sym.lamp-on{fill:#ffd66b;stroke:#a67c00}.sym-label,.sym-port,.sym-tag{fill:#153b40;stroke:none;font-family:monospace;font-size:10px}.sym-port{font-size:8px}.sym-tag{font-size:9px}.needle{stroke:#cf5548;stroke-width:1.6}</style>';
export function processStatus(inst,def){
  const s=inst.sim,parts=[];
  if(def.manual)parts.push(`Hefboom: ${s.lever<0?'links':s.lever>0?'rechts':'midden'}`);
  if(def.interactive&&!def.manual)parts.push(s.pressed?'Ingedrukt / ingeschakeld':'Losgelaten / uitgeschakeld');
  if(s.state!=null)parts.push(`Ventielstand ${Number(s.state)+1}`);
  if(s.on!=null)parts.push(s.on?'Bekrachtigd':'Niet bekrachtigd');
  if(s.closed!=null)parts.push(s.closed?'Contact gesloten':'Contact open');
  if(s.tripped!=null)parts.push(s.tripped?'Thermisch uitgeschakeld':'Thermisch gereed');
  if(s.heat!=null)parts.push(`Belasting ${Math.round(s.heat*100)} %`);
  return parts.join(' · ');
}
export class ProcessControls {
  constructor(host,{circuit,simulation,run,parametersChanged}){Object.assign(this,{host,circuit,simulation,run,parametersChanged});this.disposers=[];}
  dispose(){for(const dispose of this.disposers)dispose();this.disposers=[];}
  draw(){
    this.dispose();
    const parts=this.circuit().instances.filter(i=>!isVisualActuator(i));
    const primary=i=>{const d=BY_ID.get(i.type);return d.interactive||d.geom||/ventiel|sensor|schakelaar|drukknop|spoel|lamp|relais/i.test(d.name);};
    const card=i=>{
      const def=BY_ID.get(i.type),knobs=Object.entries(i.params).filter(([key,p])=>p.type==='range'&&['opening','pressure','setpoint'].includes(key));
      const buttons=def.interactive?(def.manual?'<button data-operate="-1">◀ Links vasthouden</button><button data-operate="1">Rechts vasthouden ▶</button>':'<button data-operate="1"></button>'):`<p class="process-automatic">${knobs.length?'Handmatig instelbaar via schuif':'Volgt het schema / de besturing'}</p>`;
      return `<article class="process-card" data-process="${esc(i.id)}"><h4>${esc(i.params.tag?.value||def.short)}</h4><p>${esc(def.short)}</p><svg viewBox="-85 -25 ${def.size.w+170} ${def.size.h+55}" role="img" aria-label="${esc(def.short)}"><g data-process-symbol></g></svg><div class="process-buttons">${buttons}</div>${def.manual?'<p>Veerterugstelling: loslaten = middenstand.</p>':''}${knobs.map(([key,p])=>`<label>${esc(p.label)} <output data-knob-value="${key}"></output><input data-process-knob="${key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}"></label>`).join('')}<div data-process-state></div><div data-process-ports></div></article>`;
    };
    this.host.innerHTML=`<section class="process-overview"><h3>Bediening en ventielen uit mijn schema</h3><p>Bedien handmatige onderdelen hier rechtstreeks. Houd drukknoppen en veerteruggestelde hefbomen ingedrukt; vergrendelende knoppen blijven staan tot je opnieuw drukt. Elektrische ventielen volgen hun spoelen en sensoren volgen hun schema.</p><div class="process-grid">${parts.filter(primary).map(card).join('')}</div>${parts.some(i=>!primary(i))?`<details class="process-other"><summary>Voedingen en overige schemaonderdelen</summary><div class="process-grid">${parts.filter(i=>!primary(i)).map(card).join('')}</div></details>`:''}${parts.length?'':'<p>Plaats drukknoppen, ventielen of andere onderdelen in Schakeling; ze verschijnen hier automatisch.</p>'}</section>`;
    for(const node of this.host.querySelectorAll('[data-process]')){
      const inst=this.circuit().byId(node.dataset.process),def=BY_ID.get(inst.type);
      for(const button of node.querySelectorAll('[data-operate]'))this.disposers.push(bindManualButton(button,{inst,def,direction:Number(button.dataset.operate),run:this.run,live:()=>this.live()}));
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
      const html=ink.replaceAll('.sym','[data-process-symbol] .sym').replaceAll('.needle','[data-process-symbol] .needle')+def.render(inst),symbol=card.querySelector('[data-process-symbol]');if(symbol._markup!==html){symbol.innerHTML=html;symbol._markup=html;}
      card.querySelector('[data-process-state]').textContent=processStatus(inst,def);
      card.querySelector('[data-process-ports]').textContent=def.ports.map(p=>p.kind==='electric'?`${p.id}: ${sim.volts(inst.id,p.id).toFixed(1)} V`:`${p.id}: ${(p.kind==='hydraulic'?sim.hgauge(inst.id,p.id):sim.gauge(inst.id,p.id)).toFixed(1)} bar`).join(' · ');
      for(const button of card.querySelectorAll('[data-operate]')){
        const active=def.manual?inst.sim.lever===Number(button.dataset.operate):!!inst.sim.pressed;button.setAttribute('aria-pressed',String(active));
        if(!def.manual)button.textContent=inst.type==='estop'?(active?'Noodstop ontgrendelen':'Noodstop indrukken'):inst.type==='industrial_overload'?'Thermisch relais resetten':def.toggle?(active?'Uitschakelen / vrijgeven':'Inschakelen / vergrendelen'):'Indrukken (vasthouden)';
      }
      for(const output of card.querySelectorAll('[data-knob-value]')){const p=inst.params[output.dataset.knobValue];output.textContent=String(p.value)+(p.unit?' '+p.unit:'');}
    }
  }
}
