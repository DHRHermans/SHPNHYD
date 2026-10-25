import {isRotaryMotor as isMotor} from './power-network.js';
import { ProcessControls } from './process-controls.js';
import { ActuatorView } from './actuator-view.js';
import { MACHINE_PARTS, MACHINE_BINDINGS, newMachineScene, sceneBinding, sceneParts } from './machine-scene.js';
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
import { drillState } from './machine.js';

export class MachineView {
  constructor(host,{circuit,simulation,load,run,mode,changed,parametersChanged}) {Object.assign(this,{host,circuit,simulation,load,run,mode,changed,parametersChanged});this.editing=false;this.selected=null;}
  draw() {
    this.controls?.dispose();
    if(this.lastScene!==this.circuit().scene){this.lastScene=this.circuit().scene;this.editing=this.lastScene?.parts?.length===0;this.selected=null;this.showActuators=false;}
    const hasMachine=this.circuit().scene?.type==='drill-press';
    const standalone=!hasMachine||this.showActuators;
    this.host.classList.toggle('machine-standalone',standalone);
    if(standalone){
      this.host.innerHTML='<header class="machine-head"><div><span>MIJN AANDRIJVINGEN</span><h2>Cilinders en motoren</h2><p class="machine-standalone-intro">De onderdelen uit je schema bewegen hier mee met de simulatie.</p></div><div class="machine-scene-actions"><button id="machine-create">Zelf een machineopstelling maken</button><button id="machine-load">Open uitgewerkt lesvoorbeeld</button></div></header>';
      this.host.querySelector('#machine-create').addEventListener('click',()=>this.create());
      this.host.querySelector('#machine-load').addEventListener('click',()=>this.load());
      if(hasMachine)this.bindViewSwitch('Machineopstelling tonen');
      this.drawActuators();return;
    }
    this.host.innerHTML=`<header class="machine-head"><div><span>MIJN VISUELE PROCES</span><h2>${escape(this.circuit().scene.title||(this.circuit().scene.parts===undefined?'Bankschroef & kolomboormachine':'Mijn machineopstelling'))}</h2><button id="machine-edit">${this.editing?'Klaar met opbouwen':'Opstelling bewerken'}</button></div><label>Oefenstand <select id="machine-mode"><option value="manual">Handmatig</option><option value="grafcet">Automatisch · GRAFCET</option><option value="ladder">Automatisch · PLC Ladder</option></select></label></header>
      ${this.editing?this.editor():''}<div class="machine-layout"><div class="machine-illustration"><svg viewBox="0 0 900 560" role="img" aria-label="Visuele bankschroef en kolomboormachine"><defs><linearGradient id="machine-metal"><stop stop-color="#d5e3e4"/><stop offset=".5" stop-color="#f8fbfa"/><stop offset="1" stop-color="#9fb7b7"/></linearGradient><pattern id="machine-drill-pattern" width="10" height="12" patternUnits="userSpaceOnUse"><path d="M-5 12L10 0M5 12L20 0" stroke="#365d62" stroke-width="3"/></pattern></defs>
      <rect x="25" y="20" width="850" height="515" rx="24" fill="#eef5f1"/><path d="M70 500H835" stroke="#b3ccc1" stroke-width="2"/>
      <g data-machine-part="drill"><rect x="410" y="477" width="360" height="24" rx="7" fill="#325d62"/><rect x="690" y="128" width="30" height="349" rx="8" fill="url(#machine-metal)" stroke="#6d9290"/>
      <rect x="492" y="85" width="240" height="90" rx="16" fill="#087f78"/><rect x="668" y="65" width="50" height="35" rx="6" fill="#31555a"/><text x="510" y="115" fill="white" font-size="16" font-weight="700">SH TechniekLab</text><text x="510" y="144" fill="#cfebe1" font-size="12">Kolomboormachine</text><circle id="machine-motor-light" cx="710" cy="144" r="7" fill="#a8bdb5"/>
      <rect x="430" y="398" width="315" height="16" rx="5" fill="#4d7477"/><rect x="675" y="414" width="22" height="62" fill="url(#machine-metal)"/>
      </g><g data-machine-part="vise"><rect x="440" y="381" width="235" height="16" rx="3" fill="#537a79"/><rect x="640" y="332" width="24" height="50" rx="3" fill="#335a60"/>
      </g><g data-machine-part="workpiece"><g id="machine-workpiece"><rect x="550" y="342" width="90" height="34" rx="3" fill="#dca96b" stroke="#a77b47"/><path d="M556 350H634M556 366H634" stroke="#c18f55"/><ellipse id="machine-hole" cx="595" cy="345" rx="0" ry="3" fill="#67513d"/></g>
      </g><g data-machine-part="vise"><rect x="90" y="341" width="180" height="44" rx="6" fill="#d9ecea" stroke="#365d62" stroke-width="3"/><text id="machine-clamp-label" x="90" y="327" font-size="14" fill="#335d5d"></text><g id="machine-clamp-piston"><rect x="108" y="345" width="12" height="36" fill="#087f78"/><path d="M120 363H450" stroke="#6c9290" stroke-width="9"/><path d="M120 363H450" stroke="#d0ded9" stroke-width="3"/></g><g id="machine-clamp"><rect x="450" y="332" width="25" height="50" rx="3" fill="#335a60"/><rect x="410" y="358" width="40" height="10" fill="#779291"/><circle cx="409" cy="363" r="15" fill="none" stroke="#537a79" stroke-width="6"/></g>
      </g><g data-machine-part="drill"><rect x="780" y="179" width="34" height="155" rx="6" fill="#d9ecea" stroke="#365d62" stroke-width="3"/><text id="machine-feed-label" x="740" y="164" font-size="14" fill="#335d5d"></text><g id="machine-feed-piston"><rect x="784" y="189" width="26" height="12" fill="#087f78"/><path d="M797 201V280H625V193" fill="none" stroke="#6c9290" stroke-width="7"/><circle cx="625" cy="193" r="6" fill="#087f78"/></g><g id="machine-feed"><rect x="565" y="175" width="60" height="36" rx="5" fill="url(#machine-metal)" stroke="#779291"/><path d="M578 211H612L608 235H582Z" fill="#33555c"/><rect id="machine-drill" x="590" y="235" width="10" height="25" fill="url(#machine-drill-pattern)"/><path d="M590 260L595 268L600 260Z" fill="#365d62"/></g>
      </g><g class="machine-example-caption"><path d="M205 346H400" stroke="#9ab9ac" stroke-dasharray="5 5"/><text x="85" y="325" fill="#335d5d" font-size="18" font-weight="700">Werkstuk vastklemmen</text><text x="85" y="353" fill="#5b7b76" font-size="13">Voor de spindel en boorvoeding starten</text>
      </g><text id="machine-caption" x="75" y="468" fill="#087f78" font-size="15" font-weight="700"></text></svg></div>
      <aside class="machine-control"><h3>Bediening</h3><p id="machine-stage"></p><div id="machine-manual-controls"><button data-manual="clamp">Klem sluiten</button><button data-manual="spindle">Spindel starten</button><button data-manual="feed">Boor omlaag</button></div><button id="machine-start">Start automatische cyclus</button><button id="machine-stop" class="machine-stop">Stop cyclus</button><button id="machine-piece">Werkstuk verwijderen</button><div id="machine-signals"></div><p id="machine-feedback" role="status"></p></aside></div>
      <p class="machine-note">Het beeld volgt de werkelijke modelposities en het modeltoerental. ${this.circuit().scene.interlocks!==false?'De oefenhulp bewaakt klemvrijgave en boorvoeding.':'Oefenhulp staat uit: je eigen schema en programma bepalen de volgorde en vergrendelingen.'} De boring is een visuele tijdsindicatie; snijkrachten, materiaalgedrag en een gecertificeerde machinebeveiliging worden niet berekend.</p>`;
    this.drawActuators();
    this.bindViewSwitch('Losse cilinders en motoren');
    this.bindEditor();
    this.placeParts();
    this.host.querySelector('#machine-mode').value=this.circuit().controller||'manual';
    this.host.querySelector('#machine-mode').addEventListener('change',e=>this.mode(e.target.value));
    this.host.querySelectorAll('[data-manual]').forEach(button=>button.addEventListener('click',()=>{const sim=this.simulation();sim.machineManual[button.dataset.manual]=!sim.machineManual[button.dataset.manual];this.run();this.live();}));
    this.host.querySelector('#machine-start').addEventListener('click',()=>{const sim=this.simulation();const start=sim.circuit.instances.find(i=>i.params.tag?.value===sceneBinding(this.circuit().scene,'start'));if(start){start.sim.pressed=true;sim.machinePulseUntil=sim.time+.12;this.run();}});
    this.host.querySelector('#machine-stop').addEventListener('click',()=>{const sim=this.simulation();const stop=sim.circuit.instances.find(i=>i.params.tag?.value===sceneBinding(this.circuit().scene,'stop'));if(stop){stop.sim.pressed=!stop.sim.pressed;this.run();this.live();}});
    this.host.querySelector('#machine-piece').addEventListener('click',()=>{const sim=this.simulation(),s=drillState(sim);if(s.top&&s.open&&s.stopped){sim.machineWorkpiece=!s.workpiece;sim.machineHole=0;this.live();}});
    this.live();
  }
  bindViewSwitch(label) {
    const button=this.host.ownerDocument.createElement('button');button.id='machine-view-switch';button.textContent=label;
    button.addEventListener('click',()=>{this.showActuators=!this.showActuators;this.draw();});
    this.host.querySelector('.machine-head>div').appendChild(button);
  }
  create() {
    this.circuit().scene=newMachineScene();this.editing=true;this.selected=null;
    this.changed();this.draw();
  }
  editor() {
    const scene=this.circuit().scene,parts=sceneParts(scene),part=parts.find(p=>p.type===this.selected);
    const instances=this.circuit().instances;
    const options=key=>instances.filter(i=>key==='motor'?isMotor(i):key==='clamp'||key==='feed'?/^(cyl_|h_cyl)/.test(i.type):true).flatMap(i=>(key==='clamp'||key==='feed'||key==='motor'?['tag']:['tag','solA','solB']).map(p=>i.params[p]?.value)).filter(Boolean);
    return `<section class="machine-builder" aria-label="Machineopstelling opbouwen"><div><h3>1 · Onderdelen plaatsen</h3><p>Plaats onderdelen en sleep ze in het beeld. Selecteer een onderdeel om het te verwijderen of precies te positioneren.</p>${Object.entries(MACHINE_PARTS).map(([type,label])=>`<button ${parts.some(p=>p.type===type)?'data-select-part':'data-add-part'}="${type}">${parts.some(p=>p.type===type)?'✓':'+'} ${label}</button>`).join('')}
      ${part?`<p><b>${MACHINE_PARTS[part.type]}</b></p><label>X <input type="number" data-part-position="x" min="-800" max="800" value="${part.x}"></label><label>Y <input type="number" data-part-position="y" min="-500" max="500" value="${part.y}"></label><button id="machine-remove">Onderdeel verwijderen</button>`:''}
      <button id="machine-new">Nieuwe lege opstelling</button></div>
      <div><h3>2 · Koppel aan je eigen schema</h3><label>Naam <input id="machine-title" value="${escape(scene.title||'')}"></label>
      ${Object.entries(MACHINE_BINDINGS).map(([key,[label]])=>`<label>${label}<input data-machine-binding="${key}" list="machine-tags-${key}" value="${escape(sceneBinding(scene,key))}" placeholder="Kies of typ een eigen tag"><datalist id="machine-tags-${key}">${[...new Set(options(key))].map(tag=>`<option value="${escape(tag)}"></option>`).join('')}</datalist></label>`).join('')}
      <label class="machine-assistance"><input id="machine-interlocks" type="checkbox" ${scene.interlocks!==false?'checked':''}>Oefenhulp: bewaak klem, spindel en boorvoeding</label>
      <p>Oefenhulp uit: je bouwt alle volgordes en vergrendelingen zelf. Gebruik een cilinder voor de klem en één voor de boorvoeding (ingeschoven = boven). Uitgangen zijn spoel-/contactortags, geen fysieke poortnamen. Kies in GRAFCET of Ladder je eigen besturing. Onderdelen plaatsen maakt geen schema of programma aan.</p></div></section>`;
  }
  bindEditor() {
    const scene=this.circuit().scene;
    this.host.querySelector('#machine-edit').onclick=()=>{this.editing=!this.editing;this.draw();};
    this.host.querySelector('#machine-new')?.addEventListener('click',()=>this.create());
    this.host.querySelectorAll('[data-select-part]').forEach(b=>b.onclick=()=>{this.selected=b.dataset.selectPart;this.draw();});
    this.host.querySelectorAll('[data-add-part]').forEach(b=>b.onclick=()=>{
      scene.parts=sceneParts(scene);scene.parts.push({type:b.dataset.addPart,x:0,y:0});this.selected=b.dataset.addPart;this.changed();this.draw();
    });
    this.host.querySelector('#machine-remove')?.addEventListener('click',()=>{scene.parts=sceneParts(scene).filter(p=>p.type!==this.selected);this.selected=null;this.changed();this.draw();});
    this.host.querySelectorAll('[data-part-position]').forEach(input=>input.onchange=()=>{
      const n=Number(input.value);if(!Number.isFinite(n))return;
      scene.parts=sceneParts(scene);const part=scene.parts.find(p=>p.type===this.selected);
      part[input.dataset.partPosition]=Math.max(Number(input.min),Math.min(Number(input.max),n));this.changed();this.draw();
    });
    this.host.querySelectorAll('[data-machine-binding]').forEach(input=>input.onchange=()=>{scene[input.dataset.machineBinding]=input.value.trim();this.changed();this.draw();});
    this.host.querySelector('#machine-title')?.addEventListener('change',e=>{scene.title=e.target.value;this.changed();this.draw();});
    this.host.querySelector('#machine-interlocks')?.addEventListener('change',e=>{scene.interlocks=e.target.checked;this.changed();this.draw();});
    this.host.querySelectorAll('[data-machine-part]').forEach(group=>{
      group.addEventListener('pointerdown',e=>{
        if(!this.editing||e.button!==0)return;e.preventDefault();
        const type=group.dataset.machinePart,svg=group.ownerSVGElement;
        const point=event=>{const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
        const start=point(e);scene.parts=sceneParts(scene);const part=scene.parts.find(p=>p.type===type);if(!part)return;
        this.selected=type;const initial={x:part.x,y:part.y};group.setPointerCapture(e.pointerId);
        const move=event=>{const p=point(event);part.x=Math.max(-800,Math.min(800,Math.round(initial.x+p.x-start.x)));part.y=Math.max(-500,Math.min(500,Math.round(initial.y+p.y-start.y)));this.placeParts();};
        const up=()=>{group.removeEventListener('pointermove',move);group.removeEventListener('pointerup',up);group.removeEventListener('pointercancel',up);if(part.x!==initial.x||part.y!==initial.y)this.changed();this.draw();};
        group.addEventListener('pointermove',move);group.addEventListener('pointerup',up);group.addEventListener('pointercancel',up);
      });
    });
  }
  placeParts() {
    const parts=sceneParts(this.circuit().scene);
    for(const group of this.host.querySelectorAll('[data-machine-part]')){
      const p=parts.find(p=>p.type===group.dataset.machinePart);
      group.style.display=p?'':'none';group.setAttribute('transform',`translate(${p?.x||0} ${p?.y||0})`);
      group.classList.toggle('machine-part-editable',this.editing);group.classList.toggle('machine-part-selected',this.editing&&this.selected===p?.type);
    }
    this.host.querySelector('.machine-example-caption').style.display='none';
  }
  drawActuators() {
    const controls=document.createElement('div');controls.className='simulation-process-panel';this.host.appendChild(controls);
    this.controls=new ProcessControls(controls,{circuit:this.circuit,simulation:this.simulation,run:this.run,parametersChanged:this.parametersChanged});this.controls.draw();
    const host=document.createElement('div');host.className='simulation-actuator-panel';this.host.appendChild(host);
    this.actuators=new ActuatorView(host,this.circuit,this.simulation);this.actuators.draw();
    if(this.host.classList.contains('machine-standalone'))this.host.insertBefore(host,controls);
    this.screen?.decorate(this.host);
  }
  live() {
    this.actuators?.live();
    this.controls?.live();
    const sim=this.simulation(),s=sim&&drillState(sim);if(!s||!this.host.querySelector('#machine-feed'))return;
    const manual=(this.circuit().controller||'manual')==='manual';
    const assisted=this.circuit().scene.interlocks!==false;
    this.host.querySelector('#machine-mode').value=this.circuit().controller||'manual';
    this.host.querySelector('#machine-manual-controls').hidden=!manual;
    const stop=sim.circuit.instances.find(i=>i.params.tag?.value===sceneBinding(this.circuit().scene,'stop'))?.sim.pressed;
    this.host.querySelector('#machine-clamp-label').textContent=this.circuit().scene.clamp?'Klemcilinder · '+this.circuit().scene.clamp:'Klemcilinder · nog koppelen';
    this.host.querySelector('#machine-feed-label').textContent=this.circuit().scene.feed?'Boorcilinder · '+this.circuit().scene.feed:'Boorcilinder · nog koppelen';
    this.host.querySelector('#machine-clamp-piston').setAttribute('transform',`translate(${s.clampX*75} 0)`);
    this.host.querySelector('#machine-feed-piston').setAttribute('transform',`translate(0 ${s.feedX*112})`);
    this.host.querySelector('#machine-feed').setAttribute('transform',`translate(0 ${s.feedX*112})`);
    this.host.querySelector('#machine-clamp').setAttribute('transform',`translate(${s.clampX*75} 0)`);
    this.host.querySelector('#machine-workpiece').style.visibility=s.workpiece?'visible':'hidden';
    this.host.querySelector('#machine-hole').setAttribute('rx',String(s.hole*6));
    this.host.querySelector('#machine-drill').style.fill=Math.abs(s.rpm)>50?'url(#machine-drill-pattern)':'#779291';
    this.host.querySelector('#machine-drill-pattern').setAttribute('patternTransform',`translate(0 ${Math.abs(s.rpm)>50?(sim.time*s.rpm/60*10)%12:0})`);
    this.host.querySelector('#machine-motor-light').setAttribute('fill',s.stopped?'#a8bdb5':'#b5ee94');
    this.host.querySelector('#machine-caption').textContent=!s.ready?'Bouw en koppel je machineopstelling':s.hole>=.99?'Boring gereed · wacht op vrijgave':s.bottom&&!s.stopped?`Boren · ${Math.round(s.hole*100)} %`:'Klemmen → boren → terug → loslaten';
    const labels=['Gereed','Klemmen','Spindel starten','Boor omlaag','Boren','Boor omhoog','Spindel stoppen','Klem los','Stop: boor omhoog'];
    const active=[...(sim.chart?.active||[])].map(id=>sim.chart.steps.get(id)?.name);
    const marker=sim.ladderRuntime?.outputs;
    const states=[['M_KLEM','Klemmen'],['M_SPIN','Spindel starten'],['M_NEER','Boor omlaag'],['M_BOREN','Boren'],['M_OP','Boor omhoog'],['M_STIL','Spindel stoppen'],['M_LOS','Klem los'],['M_STOP','Stop: boor omhoog']];
    const phase=manual?'Handmatig bedienen':this.circuit().controller==='ladder'?(states.find(([tag])=>marker?.get(tag))?.[1]||'Gereed'):(labels[Number(active[0])]||(active.length?'GRAFCET-stap '+active.join(', '):'Gereed'));
    this.host.querySelector('#machine-stage').textContent=this.circuit().scene.parts===undefined?phase:manual?'Handmatig bedienen':this.circuit().controller==='grafcet'?'Actieve stappen: '+(active.join(', ')||'geen'):'Mijn PLC-programma';
    for(const button of this.host.querySelectorAll('[data-manual]')){
      const key=button.dataset.manual,on=sim.machineManual?.[key];button.setAttribute('aria-pressed',String(!!on));
      button.textContent=key==='clamp'?(on?'Klem loslaten':'Klem sluiten'):key==='spindle'?(on?'Spindel stoppen':'Spindel starten'):(on?'Boor omhoog':'Boor omlaag');
      button.disabled=!s.ready||!sceneBinding(this.circuit().scene,{clamp:'clampOutput',spindle:'motorOutput',feed:'feedOutput'}[key])||(!assisted?false:key==='clamp'?(!on&&!s.workpiece)||(on&&(!s.top||!s.stopped)):key==='spindle'?!on&&(!s.clamped||!s.workpiece||stop):!on&&(!s.clamped||Math.abs(s.rpm)<500||stop));
    }
    const start=this.host.querySelector('#machine-start');start.hidden=manual;start.disabled=!s.ready||!sim.circuit.instances.some(i=>i.params.tag?.value===sceneBinding(this.circuit().scene,'start'))||(assisted&&(!!stop||!s.workpiece||!s.open||!s.top||!s.stopped));
    this.host.querySelector('#machine-stop').disabled=!sim.circuit.instances.some(i=>i.params.tag?.value===sceneBinding(this.circuit().scene,'stop'));
    this.host.querySelector('#machine-stop').textContent=stop?'Stop vrijgeven':'Stop cyclus';
    const piece=this.host.querySelector('#machine-piece');piece.textContent=s.workpiece?'Werkstuk verwijderen':'Nieuw werkstuk plaatsen';piece.disabled=!s.open||!s.top||!s.stopped;
    this.host.querySelector('#machine-feedback').textContent=!s.ready?'Plaats kolomboor, bankschroef en werkstuk; koppel daarna twee cilinders en een motor.':sim.machineBlocked||(!s.workpiece?'Plaats een werkstuk om te starten.':'');
    const signals=[['Klem dicht',s.clamped],['Boor boven',s.top],['Boor beneden',s.bottom],['Spindel stil',s.stopped]];
    this.host.querySelector('#machine-signals').innerHTML=signals.map(([label,on])=>`<div class="${on?'on':''}"><span>${label}</span><b>${on?'1':'0'}</b></div>`).join('')+`<div><span>Spindel</span><b>${Math.round(s.rpm)} rpm</b></div>`;
  }
}
