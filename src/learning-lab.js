import {BY_ID,FAULT_LABELS} from './catalog.js';
import {LESSONS,lessonSteps,freshEvidence,observeEvidence,componentExplanation,runtimeIssues,measure,controlTrace} from './learning-core.js';
import {decorateLayout} from './simulation-layout.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tabs={lesson:'Opdrachten',help:'Onderdeeluitleg',meter:'Meetgereedschap',issues:'Diagnose',faults:'Storingszoeken',step:'Stap voor stap',save:'Bewaren / herstel',layout:'Indeling'};
export class LearningLab {
 constructor(options){Object.assign(this,options);this.tab='lesson';this.layoutEditing=false;this.flowEnabled=false;this.evidence=freshEvidence();this.lastCircuit=null;this.lastLive=0;this.hints=0;this.trace=[];}
 sync(){const c=this.state().circuit;if(c!==this.lastCircuit){this.lastCircuit=c;this.evidence={...freshEvidence(),...(c.learning?.evidence||{})};this.trace=[];this.hints=0;this.meterHeld=null;}}
 observe(sim){this.sync();if(sim.circuit.learning?.lesson)observeEvidence(this.evidence,sim);}
 open(tab=this.tab,inst=null,doc=document){
  this.sync();this.panel?.remove();this.tab=tab;this.helpId=inst||this.helpId;this.doc=doc;
  this.panel=doc.createElement('dialog');this.panel.className='learning-lab';this.panel.setAttribute('aria-label','Leeratelier');
  this.panel.innerHTML='<header><strong>SH · Leeratelier</strong><button data-close aria-label="Leeratelier sluiten">×</button></header><nav></nav><main></main>';
  doc.body.appendChild(this.panel);this.panel.querySelector('[data-close]').onclick=()=>{this.panel.remove();this.panel=null;};
  this.panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.panel.close();this.panel.remove();this.panel=null;}else if(!(e.ctrlKey||e.metaKey))e.stopPropagation();});
  this.panel.show();this.paint();
  const header=this.panel.querySelector('header');let drag=null;
  header.onpointerdown=e=>{if(e.target.closest('button'))return;const r=this.panel.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX-r.x,y:e.clientY-r.y};header.setPointerCapture(e.pointerId);};
  header.onpointermove=e=>{if(!drag)return;this.panel.style.left=Math.max(0,Math.min(doc.defaultView.innerWidth-160,e.clientX-drag.x))+'px';this.panel.style.top=Math.max(0,Math.min(doc.defaultView.innerHeight-60,e.clientY-drag.y))+'px';this.panel.style.right='auto';};
  header.onpointerup=header.onpointercancel=()=>{drag=null;};
 }
 paint(){
  if(!this.panel)return;this.sync();const nav=this.panel.querySelector('nav');nav.innerHTML=Object.entries(tabs).map(([key,label])=>`<button data-tab="${key}" aria-pressed="${this.tab===key}">${label}</button>`).join('');nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{this.tab=b.dataset.tab;this.paint();});
  this.body=this.panel.querySelector('main');const c=this.state().circuit;
  if(this.tab==='lesson')this.lesson(c);if(this.tab==='help')this.help(c);if(this.tab==='meter')this.meter(c);if(this.tab==='issues')this.issues(c);if(this.tab==='faults')this.faults(c);if(this.tab==='step')this.steps(c);if(this.tab==='save')this.saves();if(this.tab==='layout')this.layout();
  this.live(true);
 }
 selectParts(id=''){return this.state().circuit.instances.map(i=>`<option value="${esc(i.id)}" ${i.id===id?'selected':''}>${esc(i.params.tag?.value||i.type)} · ${esc(BY_ID.get(i.type).short)}</option>`).join('');}
 saveLearning(){this.state().circuit.learning.evidence=structuredClone(this.evidence);this.save();}
 lesson(c){
  const data=c.learning||{},lesson=LESSONS.find(l=>l.id===data.lesson),steps=lesson?lessonSteps(lesson):[];
  this.body.innerHTML=`<h2>Begeleid onderzoeken</h2><p>Voorspel, bouw of bekijk, bedien en verklaar. Je werkt in dezelfde toepassing; er zijn geen aparte rollen.</p><select data-lesson><option value="">Kies een opdracht</option>${LESSONS.map(l=>`<option value="${l.id}" ${l.id===lesson?.id?'selected':''}>${esc(l.name)}</option>`).join('')}</select><button data-example ${lesson?'':'disabled'}>Laad oefenschema</button>${lesson?`<h3>${esc(lesson.name)}</h3><label>Mijn voorspelling<textarea data-prediction maxlength="10000" placeholder="Wat verwacht je bij starten en stoppen?">${esc(data.prediction)}</textarea></label><ol class="lesson-steps">${steps.map((s,n)=>`<li class="${data.completed?.includes(n)?'done':''}">${esc(s.label)} ${data.completed?.includes(n)?'✓':''}</li>`).join('')}</ol><label>Mijn verklaring / observaties<textarea data-notes maxlength="10000">${esc(data.notes)}</textarea></label><button data-check>Controleer huidige stap</button><button data-hint>Geef een hint</button><p data-feedback role="status"></p><details><summary>Waar kijkt de controle naar?</summary><p>De controle gebruikt voeding en werkelijk waargenomen bediening, eindstand, terugkeer of motortoerental. Een ingevulde reflectie wordt alleen op aanwezigheid gecontroleerd. Een vinkje beoordeelt niet automatisch je volledige schema of redenering.</p></details>`:'<p>Kies een opdracht. Je kunt je eigen schema blijven gebruiken of bewust het oefenschema laden.</p>'}`;
  this.body.querySelector('[data-lesson]').onchange=e=>{c.learning={lesson:e.target.value,completed:[],notes:'',prediction:'',evidence:freshEvidence()};this.evidence=freshEvidence();this.hints=0;this.save();this.paint();};
  this.body.querySelector('[data-example]').onclick=()=>{this.flush();this.loadExample(lesson.example);const next=this.state().circuit;next.learning={lesson:lesson.id,completed:[],notes:'',prediction:'',evidence:freshEvidence()};this.evidence=freshEvidence();this.lastCircuit=next;this.save();this.paint();};
  for(const name of ['notes','prediction'])this.body.querySelector(`[data-${name}]`)?.addEventListener('input',e=>{c.learning[name]=e.target.value;this.saveLearning();});
  this.body.querySelector('[data-check]')?.addEventListener('click',()=>{
    const n=steps.findIndex((s,n)=>!c.learning.completed.includes(n)),s=steps[n];if(!s){this.feedback('Alle stappen zijn afgevinkt. Vergelijk nu je uitleg met de werking.');return;}
    const ok=s.reflection?c.learning.notes.trim().length>=25:s.check(c,this.evidence);
    if(ok){c.learning.completed.push(n);this.saveLearning();this.paint();this.feedback(s.reflection?'Reflectie bewaard. De inhoud wordt niet automatisch beoordeeld.':'Deze waarneming is bevestigd. Ga door met de volgende stap.');}else this.feedback(s.reflection?'Schrijf minstens één inhoudelijke zin over de werking (25 tekens).':'Nog niet waargenomen. '+s.hint);
  });
  this.body.querySelector('[data-hint]')?.addEventListener('click',()=>this.feedback(lesson.hints[Math.min(this.hints++,lesson.hints.length-1)]));
 }
 feedback(text){const node=this.body?.querySelector('[data-feedback]');if(node)node.textContent=text;}
 help(c){
  if(!c.instances.length){this.body.innerHTML='<h2>Onderdeeluitleg</h2><p>Plaats een onderdeel in je schema. Kies het en open Uitleg.</p>';return;}
  const inst=c.byId(this.helpId)||c.instances[0],def=c.defOf(inst),info=componentExplanation(inst,def);this.helpId=inst.id;
  this.body.innerHTML=`<h2>Hoe werkt dit onderdeel?</h2><select data-help-part>${this.selectParts(inst.id)}</select><h3>${esc(def.name)}</h3><p>${esc(info.operation)}</p><h4>Poorten</h4><table><tbody>${info.ports.map(p=>`<tr><th>${esc(p.id)}</th><td>${esc(p.meaning)}</td></tr>`).join('')}</tbody></table><h4>Onderzoek</h4><p>${esc(info.example)}</p><h4>Instellingen</h4><ul>${Object.values(inst.params).map(p=>`<li>${esc(p.label)}${p.unit?' ('+esc(p.unit)+')':''}</li>`).join('')}</ul><button data-find>Wijs aan in schema</button>`;
  this.body.querySelector('select').onchange=e=>{this.helpId=e.target.value;this.paint();};this.body.querySelector('[data-find]').onclick=()=>this.locate(inst.id);
 }
 meter(c){
  const config=this.meterConfig||{mode:'voltage',a:c.instances[0]?.id||'',ap:'',b:c.instances[1]?.id||'',bp:''};if(!c.byId(config.a))config.a=c.instances[0]?.id||'';if(!c.byId(config.b))config.b=c.instances[1]?.id||c.instances[0]?.id||'';this.meterConfig=config;
  const ports=id=>c.byId(id)?c.defOf(c.byId(id)).ports.map(p=>`<option value="${esc(p.id)}">${esc(p.id)}</option>`).join(''):'';
  this.body.innerHTML=`<h2>Virtuele meettafel</h2><p>Deze modelinstrumenten lezen waarden zonder de schakeling te belasten.</p><label>Instrument<select data-meter="mode"><option value="voltage">Multimeter · gelijkspanning</option><option value="current">Belastingsstroom (U/R)</option><option value="pressure">Manometer</option><option value="rpm">Toerentalmeter</option><option value="temperature">Temperatuurmeter</option><option value="motorCurrent">Motorstroom (model)</option><option value="position">Cilinderpositie</option></select></label><label>Onderdeel / rode meetpen<select data-meter="a">${this.selectParts(config.a)}</select></label><label>Poort<select data-meter="ap">${ports(config.a)}</select></label><div data-black><label>Zwarte meetpen<select data-meter="b">${this.selectParts(config.b)}</select></label><label>Poort<select data-meter="bp">${ports(config.b)}</select></label></div><output class="meter-display" data-live-meter>—</output><p data-meter-note></p><button data-hold>Meetwaarde vasthouden</button><button data-capture>Noteer meting</button><button data-mark>Toon meetpennen in schema</button><pre data-measurements></pre>`;
  this.body.querySelector('[data-meter="mode"]').value=config.mode;
  for(const key of ['ap','bp']){const select=this.body.querySelector(`[data-meter="${key}"]`);if([...select.options].some(o=>o.value===config[key]))select.value=config[key];else config[key]=select.value;}
  this.body.querySelector('[data-black]').hidden=config.mode!=='voltage';
  this.body.querySelectorAll('[data-meter]').forEach(input=>input.onchange=()=>{config[input.dataset.meter]=input.value;this.meterHeld=null;this.paint();});
  this.body.querySelector('[data-mark]').onclick=()=>{this.meterMarked=true;this.markMeters(config,true);};
  this.body.querySelector('[data-hold]').onclick=()=>{this.meterHeld=this.meterHeld?null:measure(c,this.state().sim,config);this.live(true);};
  this.body.querySelector('[data-capture]').onclick=()=>{const m=this.meterHeld||measure(c,this.state().sim,config);c.learning||={lesson:'',completed:[],notes:'',prediction:'',evidence:freshEvidence()};c.learning.measurements||=[];c.learning.measurements.push(`${this.state().sim.time.toFixed(3)} s · ${c.byId(config.a)?.params.tag?.value||config.a}:${config.ap} · ${m.value==null?'niet beschikbaar':m.value.toFixed(3)+' '+m.unit}`);c.learning.measurements=c.learning.measurements.slice(-100);this.save();this.live(true);};
 }
 issues(c){
  const all=[...this.checkCircuit(c).map(i=>({...i,hint:'Volg de aansluitingen en gebruik de meettafel.'})),...runtimeIssues(c,this.state().sim).filter(i=>!c.challenge||c.challenge.revealed||!i.text.includes('componentstoring'))];
  this.body.innerHTML='<h2>Gerichte diagnose</h2><p>Meldingen zijn aanwijzingen, geen automatische beoordeling van een volledig ontwerp.</p><button data-refresh>Opnieuw controleren</button>'+all.map((i,n)=>`<article><p>${esc(i.text)}</p><p>${esc(i.hint)}</p>${i.id?`<button data-issue="${n}">Wijs onderdeel aan</button>`:''}</article>`).join('')+(all.length?'':'<p>Geen van de ondersteunde controles vond een probleem. Test ook de werking en stopvoorwaarden.</p>');
  this.body.querySelector('[data-refresh]').onclick=()=>this.paint();this.body.querySelectorAll('[data-issue]').forEach(b=>b.onclick=()=>this.locate(all[Number(b.dataset.issue)].id));
 }
 faults(c){
  const challenge=c.challenge,inst=challenge&&c.byId(challenge.inst),eligible=c.instances.filter(i=>c.defOf(i).faultTypes?.some(f=>!i.faults[f]));
  this.body.innerHTML=`<h2>Storingszoeken</h2><p>Er wordt één ondersteunde storing toegevoegd. Je onderzoekt het effect met echte metingen. Onthullen is altijd beschikbaar; dit is geen beveiligde toetsmodus.</p>${challenge?`<p>${challenge.revealed?esc((inst?.params.tag?.value||inst?.type)+' · '+(FAULT_LABELS[challenge.fault]||challenge.fault)):'Eén storing is verborgen in de interface. Zoek eerst voeding, bediening en actuator na.'}</p><label>Mijn verdachte onderdeel<select data-guess>${this.selectParts()}</select></label><button data-diagnosis>Controleer diagnose</button><button data-reveal>Onthul storing</button><button data-repair>Herstel opdrachtstoring</button><p data-feedback role="status"></p>`:`<button data-random ${eligible.length?'':'disabled'}>Maak een willekeurige storingsopdracht</button><p>Een actief eerder defect wordt niet overschreven. De oorspronkelijke defectinstellingen van het gekozen onderdeel worden bewaard.</p>`}`;
  this.body.querySelector('[data-random]')?.addEventListener('click',()=>{if(!eligible.length)return;const i=eligible[Math.floor(Math.random()*eligible.length)],faults=c.defOf(i).faultTypes.filter(f=>!i.faults[f]),fault=faults[Math.floor(Math.random()*faults.length)];c.challenge={inst:i.id,fault,baseline:{...i.faults},revealed:false};i.faults={...i.faults,[fault]:true};this.mutate('challenge');this.paint();});
  this.body.querySelector('[data-diagnosis]')?.addEventListener('click',()=>this.feedback(this.body.querySelector('[data-guess]').value===challenge.inst?'Je hebt het betrokken onderdeel gevonden. Verklaar met een meting welk gedrag afwijkt.':'Dit is niet het onderdeel met de toegevoegde storing. Volg de energieketen verder.'));
  this.body.querySelector('[data-reveal]')?.addEventListener('click',()=>{challenge.revealed=true;this.mutate('challenge');this.paint();});
  this.body.querySelector('[data-repair]')?.addEventListener('click',()=>{if(inst)inst.faults={...challenge.baseline};c.challenge=null;this.mutate('challenge');this.paint();});
 }
 steps(){
  this.body.innerHTML=`<h2>De simulatie stap voor stap</h2><p>Elke modeltick duurt 1 ms. De Ladder wordt eenmaal per modeltick doorlopen. GRAFCET kan binnen één tick meerdere opeenvolgende ware overgangen doorlopen.</p><button data-step="1">1 tick / PLC-scan</button><button data-step="100">100 ms uitvoeren</button><button data-transition>Tot volgende GRAFCET-situatie</button><label><input data-flow type="checkbox" ${this.flowEnabled?'checked':''}>Toon energiestroom in het schema</label><p>Stippen volgen berekende componentdoorstroming waar die beschikbaar is. Slagdebiet is gebaseerd op zuigerverplaatsing; laden van leidingvolumes en niet-ondersteunde takken zijn niet als afzonderlijke leidingstromen bepaald. De functionele driefasenkring heeft geen echte AC-stroommeting.</p><p data-feedback role="status"></p><pre data-live-trace></pre><button data-log>Bewaar momentopname</button><pre data-trace-log></pre>`;
  this.body.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{this.step(Number(b.dataset.step));this.live(true);});
  this.body.querySelector('[data-transition]').onclick=()=>{const n=this.step('transition');this.feedback(n?'Een nieuwe actieve GRAFCET-situatie is bereikt.':'Binnen maximaal één modelseconde is geen nieuwe situatie bereikt. Controleer de voorwaarden en timers.');this.live(true);};
  this.body.querySelector('[data-flow]').onchange=e=>{this.flowEnabled=e.target.checked;this.showFlow(this.flowEnabled);};
  this.body.querySelector('[data-log]').onclick=()=>{const t=controlTrace(this.state().sim),c=this.state().circuit;c.learning||={lesson:'',completed:[],notes:'',prediction:'',evidence:freshEvidence()};c.learning.traceLog||=[];c.learning.traceLog.push(`${t.time.toFixed(3)} s · stappen ${t.steps.join(', ')}\nSignalen: ${t.signals.map(([k,v])=>k+'='+(v?1:0)).join(', ')}\nUitgangen: ${t.outputs.map(([k,v])=>k+'='+(v?1:0)).join(', ')}`);c.learning.traceLog=c.learning.traceLog.slice(-12);this.save();this.live(true);};
 }
 saves(){
  const data=this.autosave.read(),entries=data?[data.current,...(data.backups||[])]:[];
  this.body.innerHTML='<h2>Automatisch bewaren en herstel</h2><p>Je werk wordt lokaal in deze browser bewaard, inclusief schema, programma, machinebeeld, indeling en opdrachttekst. Gebruik JSON-export voor overdracht of een eigen reservekopie. Browsergegevens wissen verwijdert deze lokale kopieën.</p><button data-save-now>Nu bewaren</button>'+entries.map((e,n)=>`<article><p>${esc(e.title||'Schakelschema')} · ${esc(new Date(e.savedAt).toLocaleString('nl-BE',{timeZone:'Europe/Brussels'}))}</p><button data-restore="${n}">Herstel deze versie</button></article>`).join('');
  this.body.querySelector('[data-save-now]').onclick=()=>{this.flush();this.paint();};this.body.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{const entry=entries[Number(b.dataset.restore)];this.flush();this.restore(entry);this.paint();});
 }
 layout(){
  this.body.innerHTML=`<h2>Mijn simulatie-indeling</h2><p>Open Machinebeeld en zet indeling bewerken aan. Sleep via de verplaatshandgreep om kaarten binnen hetzelfde paneel te ordenen. Kies beeldgrootte en groepeer onderdelen, bijvoorbeeld Klemkring en Boorvoeding. De indeling wordt met JSON en automatisch lokaal opgeslagen.</p><button data-layout>${this.layoutEditing?'Klaar met indelen':'Indeling bewerken'}</button><button data-reset-layout>Standaardindeling herstellen</button>`;
  this.body.querySelector('[data-layout]').onclick=()=>{this.layoutEditing=!this.layoutEditing;this.pause();this.openMachine();this.redraw();this.paint();};
  this.body.querySelector('[data-reset-layout]').onclick=()=>{for(const i of this.state().circuit.instances)delete i.presentation;this.layoutChanged();this.paint();};
 }
 layoutChanged(){this.commit('presentation');this.redraw();}
 decorateHost(host){
  decorateLayout(host,this.state().circuit,{editing:this.layoutEditing,changed:()=>this.layoutChanged()});
  for(const card of host.querySelectorAll('.process-card,.actuator-card')){const id=card.dataset.process||card.dataset.actuator,b=host.ownerDocument.createElement('button');b.className='component-info';b.textContent='Uitleg';b.onclick=()=>this.open('help',id,host.ownerDocument);card.appendChild(b);}
 }
 live(force=false){
  this.sync();if(!this.panel||!this.panel.isConnected)return;const now=performance.now();if(!force&&now-this.lastLive<150)return;this.lastLive=now;
  const c=this.state().circuit,sim=this.state().sim;
  if(this.meterMarked&&this.meterConfig)this.markMeters(this.meterConfig,false);
  const meter=this.body.querySelector('[data-live-meter]');if(meter){const m=this.meterHeld||measure(c,sim,this.meterConfig);meter.textContent=(m.value==null?'—':m.value.toFixed(3)+' '+m.unit)+(this.meterHeld?' · HOLD':'');this.body.querySelector('[data-meter-note]').textContent=m.note;this.body.querySelector('[data-measurements]').textContent=(c.learning?.measurements||[]).slice(-20).join('\n');}
  const trace=this.body.querySelector('[data-live-trace]');if(trace){const t=controlTrace(sim);trace.textContent=`${t.time.toFixed(3)} s\nActieve stappen: ${t.steps.join(', ')||'geen'}\n`+t.signals.map(([k,v])=>`${k}: ${v?1:0}`).join('\n')+'\n\nGRAFCET-voorwaarden:\n'+t.conditions.map(x=>`${x.condition}: ${x.value==null?x.note:x.value?'WAAR':'ONWAAR'} · voorgaande stappen ${x.enabled?'actief':'niet alle actief'}`).join('\n');this.body.querySelector('[data-trace-log]').textContent=(c.learning?.traceLog||[]).join('\n\n');}
 }
}
