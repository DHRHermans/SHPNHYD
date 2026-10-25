import {isMotor} from './power-network.js';
import { BY_ID } from './catalog.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isVisualActuator=i=>/^(cyl_|h_cyl$)/.test(i.type)||isMotor(i);

/** Read actual solver results; this view never issues actuator commands. */
export function actuatorState(inst,sim){
  if(!isVisualActuator(inst))return null;
  const motor=inst.type.includes('motor'),hydraulic=inst.type==='h_cyl';
  const position=Math.max(0,Math.min(1,inst.sim.x||0));
  const pressures=motor?[]:BY_ID.get(inst.type).ports.map(p=>({port:p.id,bar:hydraulic?sim.hgauge(inst.id,p.id):sim.gauge(inst.id,p.id)}));
  return {motor,hydraulic,position,stroke:position*(inst.params.stroke?.value||0),rpm:inst.sim.rpm||0,pressures};
}
export class ActuatorView {
  constructor(host,circuit,simulation){Object.assign(this,{host,circuit,simulation});this.angles=new Map();this.lastTime=0;}
  draw(){
    const parts=this.circuit().instances.filter(isVisualActuator);
    this.host.innerHTML=`<section class="actuator-overview"><h3>Aandrijvingen uit mijn schema</h3><p>Cilinders en elektromotoren verschijnen hier automatisch zodra je ze in het schema plaatst. Beweging, druk en toerental volgen de simulatie. Start de simulatie en bedien je ventielen of elektrische schakelaars in het schema.</p><div class="actuator-grid">${parts.map(i=>{
      const motor=i.type.includes('motor'),color=i.type==='h_cyl'?'#c18b35':'#1587ac';
      return `<article class="actuator-card" data-actuator="${esc(i.id)}"><h4>${esc(i.params.tag?.value||BY_ID.get(i.type).short)}</h4><p>${esc(BY_ID.get(i.type).short)}</p><svg viewBox="${i.type==='cyl_through'?'-80 0 560 175':'0 0 470 175'}" role="img" aria-label="${esc(i.params.tag?.value||i.type)} bewegend model">${motor?`
        <rect x="95" y="45" width="175" height="90" rx="18" fill="#147c73"/><path d="M115 55V125M135 55V125M155 55V125M175 55V125M195 55V125" stroke="#68b3a3" stroke-width="5"/><rect x="116" y="130" width="135" height="12" fill="#365d62"/><rect x="270" y="82" width="40" height="16" fill="#8ba4a4"/><circle cx="310" cy="90" r="36" fill="#dce8e5" stroke="#365d62" stroke-width="4"/><g data-rotor><path d="M310 60V120M280 90H340" stroke="#087f78" stroke-width="7"/><circle cx="310" cy="90" r="8" fill="#365d62"/></g>${i.type==='industrial_motor_6'?'<rect x="120" y="10" width="105" height="54" rx="4" fill="#e1ebe3" stroke="#587d76"/>'+['U1','V1','W1','W2','U2','V2'].map((p,n)=>'<circle cx="'+(139+(n%3)*32)+'" cy="'+(n<3?25:50)+'" r="4" fill="#a8894c"/><text x="'+(139+(n%3)*32)+'" y="'+(n<3?20:44)+'" text-anchor="middle" font-size="7">'+p+'</text>').join(''):''}<text data-direction x="200" y="164" text-anchor="middle" fill="#335d5d"></text>`:`
        <rect x="28" y="55" width="220" height="70" rx="7" fill="#e7f0ed" stroke="#365d62" stroke-width="3"/><rect data-chamber-a x="32" y="59" width="15" height="62" fill="${color}" opacity=".35"/><rect data-chamber-b x="63" y="59" width="180" height="62" fill="${color}" opacity=".12"/><g data-piston><rect x="48" y="59" width="14" height="62" rx="2" fill="#365d62"/><rect x="62" y="83" width="195" height="14" fill="#95aaaa" stroke="#365d62"/><circle cx="260" cy="90" r="9" fill="#edf5f0" stroke="#365d62" stroke-width="3"/></g>${i.type==='cyl_through'?'<rect data-through-rod y="83" height="14" fill="#95aaaa" stroke="#365d62"/>':''}
        <path d="${i.type==='cyl_single'?'M43 125V144':'M43 125V144M230 125V144'}" stroke="${color}" stroke-width="5"/><text x="38" y="163" fill="#335d5d">${i.type==='h_cyl'?'A':'1'}</text>${i.type==='cyl_single'?'':`<text x="225" y="163" fill="#335d5d">${i.type==='h_cyl'?'B':'2'}</text>`}`}</svg><div data-actuator-readout role="status"></div></article>`;
    }).join('')}</div>${parts.length?'':'<p class="actuator-empty">Nog geen cilinder of motor geplaatst. Voeg deze toe via de componentbibliotheek in Schakeling.</p>'}</section>`;
    this.angles.clear();this.lastTime=this.simulation().time;this.live();
  }
  live(){
    const sim=this.simulation(),dt=Math.max(0,sim.time-this.lastTime);if(sim.time<this.lastTime)this.angles.clear();this.lastTime=sim.time;
    for(const card of this.host.querySelectorAll('[data-actuator]')){
      const inst=this.circuit().instances.find(i=>i.id===card.dataset.actuator);if(!inst)continue;
      const s=actuatorState(inst,sim);if(!s)continue;
      if(s.motor){
        const angle=((this.angles.get(inst.id)||0)+dt*s.rpm*6)%360;this.angles.set(inst.id,angle);
        card.querySelector('[data-rotor]').setAttribute('transform',`rotate(${angle} 310 90)`);
        card.querySelector('[data-direction]').textContent=Math.abs(s.rpm)<1?'Stilstand':s.rpm>0?'↻ Rechtsom':'↺ Linksom';
        card.querySelector('[data-actuator-readout]').textContent=`${Math.round(s.rpm)} omw/min · ${inst.sim.status|| (Math.abs(s.rpm)>1?'Motor draait':'Stilstand')} · ${(inst.sim.current||0).toFixed(1)} A · ${(inst.sim.temperature||20).toFixed(1)} °C`;
      }else{
        const x=s.position*175;card.querySelector('[data-piston]').setAttribute('transform',`translate(${x} 0)`);
        const through=card.querySelector('[data-through-rod]');if(through){through.setAttribute('x',String(-70+x));through.setAttribute('width','118');}
        card.querySelector('[data-chamber-a]').setAttribute('width',String(16+x));card.querySelector('[data-chamber-b]').setAttribute('x',String(63+x));card.querySelector('[data-chamber-b]').setAttribute('width',String(180-x));
        for(const [n,key]of ['a','b'].entries()){const bar=s.pressures[n]?.bar||0;card.querySelector(`[data-chamber-${key}]`).setAttribute('opacity',String(.10+.6*Math.min(1,Math.max(0,bar)/(s.hydraulic?100:6))));}
        card.querySelector('[data-actuator-readout]').textContent=`Slag ${s.stroke.toFixed(1)} mm · ${Math.round(s.position*100)} % · `+s.pressures.map(p=>`${p.port}: ${p.bar.toFixed(1)} bar`).join(' · ');
      }
    }
  }
}
