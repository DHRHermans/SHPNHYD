import { drillState } from './machine.js';

export class MachineView {
  constructor(host,{circuit,simulation,load,run,mode}) {Object.assign(this,{host,circuit,simulation,load,run,mode});}
  draw() {
    if(this.circuit().scene?.type!=='drill-press'){
      this.host.innerHTML='<section class="machine-empty"><span>VISUEEL PROCES</span><h2>Van schema naar een werkende machine</h2><p>Begin met een bankschroef die een werkstuk vastklemt en een kolomboor die automatisch boort. Het beeld volgt de cilinders en motor uit het schema.</p><button id="machine-load">Laad bankschroef en kolomboormachine</button></section>';
      this.host.querySelector('#machine-load').addEventListener('click',()=>this.load());return;
    }
    this.host.innerHTML=`<header class="machine-head"><div><span>OPDRACHT 01 · KLEMMEN EN BOREN</span><h2>Bankschroef & kolomboormachine</h2></div><label>Oefenstand <select id="machine-mode"><option value="manual">Handmatig</option><option value="grafcet">Automatisch · GRAFCET</option><option value="ladder">Automatisch · PLC Ladder</option></select></label></header>
      <div class="machine-layout"><div class="machine-illustration"><svg viewBox="0 0 900 560" role="img" aria-label="Visuele bankschroef en kolomboormachine"><defs><linearGradient id="machine-metal"><stop stop-color="#d5e3e4"/><stop offset=".5" stop-color="#f8fbfa"/><stop offset="1" stop-color="#9fb7b7"/></linearGradient><pattern id="machine-drill-pattern" width="10" height="12" patternUnits="userSpaceOnUse"><path d="M-5 12L10 0M5 12L20 0" stroke="#365d62" stroke-width="3"/></pattern></defs>
      <rect x="25" y="20" width="850" height="515" rx="24" fill="#eef5f1"/><path d="M70 500H835" stroke="#b3ccc1" stroke-width="2"/>
      <rect x="410" y="477" width="360" height="24" rx="7" fill="#325d62"/><rect x="690" y="128" width="30" height="349" rx="8" fill="url(#machine-metal)" stroke="#6d9290"/>
      <rect x="492" y="85" width="240" height="90" rx="16" fill="#087f78"/><rect x="668" y="65" width="50" height="35" rx="6" fill="#31555a"/><text x="510" y="115" fill="white" font-size="16" font-weight="700">SH TechniekLab</text><text x="510" y="144" fill="#cfebe1" font-size="12">Kolomboormachine</text><circle id="machine-motor-light" cx="710" cy="144" r="7" fill="#a8bdb5"/>
      <rect x="430" y="398" width="315" height="16" rx="5" fill="#4d7477"/><rect x="675" y="414" width="22" height="62" fill="url(#machine-metal)"/>
      <rect x="440" y="381" width="235" height="16" rx="3" fill="#537a79"/><rect x="640" y="332" width="24" height="50" rx="3" fill="#335a60"/>
      <g id="machine-workpiece"><rect x="550" y="342" width="90" height="34" rx="3" fill="#dca96b" stroke="#a77b47"/><path d="M556 350H634M556 366H634" stroke="#c18f55"/><ellipse id="machine-hole" cx="595" cy="345" rx="0" ry="3" fill="#67513d"/></g>
      <g id="machine-clamp"><rect x="450" y="332" width="25" height="50" rx="3" fill="#335a60"/><rect x="410" y="358" width="40" height="10" fill="#779291"/><circle cx="409" cy="363" r="15" fill="none" stroke="#537a79" stroke-width="6"/></g>
      <g id="machine-feed"><rect x="565" y="175" width="60" height="36" rx="5" fill="url(#machine-metal)" stroke="#779291"/><path d="M578 211H612L608 235H582Z" fill="#33555c"/><rect id="machine-drill" x="590" y="235" width="10" height="25" fill="url(#machine-drill-pattern)"/><path d="M590 260L595 268L600 260Z" fill="#365d62"/></g>
      <path d="M205 346H400" stroke="#9ab9ac" stroke-dasharray="5 5"/><text x="85" y="325" fill="#335d5d" font-size="18" font-weight="700">Werkstuk vastklemmen</text><text x="85" y="353" fill="#5b7b76" font-size="13">Voor de spindel en boorvoeding starten</text>
      <text id="machine-caption" x="75" y="468" fill="#087f78" font-size="15" font-weight="700"></text></svg></div>
      <aside class="machine-control"><h3>Bediening</h3><p id="machine-stage"></p><div id="machine-manual-controls"><button data-manual="clamp">Klem sluiten</button><button data-manual="spindle">Spindel starten</button><button data-manual="feed">Boor omlaag</button></div><button id="machine-start">Start automatische cyclus</button><button id="machine-stop" class="machine-stop">Stop cyclus</button><button id="machine-piece">Werkstuk verwijderen</button><div id="machine-signals"></div><p id="machine-feedback" role="status"></p></aside></div>
      <p class="machine-note">Het beeld volgt de werkelijke modelposities en het modeltoerental. Klemvrijgave wacht op een boor bovenaan en een stilstaande spindel. De boring is een visuele tijdsindicatie; snijkrachten, materiaalgedrag en een gecertificeerde machinebeveiliging worden niet berekend.</p>`;
    this.host.querySelector('#machine-mode').value=this.circuit().controller||'manual';
    this.host.querySelector('#machine-mode').addEventListener('change',e=>this.mode(e.target.value));
    this.host.querySelectorAll('[data-manual]').forEach(button=>button.addEventListener('click',()=>{const sim=this.simulation();sim.machineManual[button.dataset.manual]=!sim.machineManual[button.dataset.manual];this.run();this.live();}));
    this.host.querySelector('#machine-start').addEventListener('click',()=>{const sim=this.simulation();const start=sim.circuit.instances.find(i=>i.params.tag?.value==='S_START');if(start){start.sim.pressed=true;sim.machinePulseUntil=sim.time+.12;this.run();}});
    this.host.querySelector('#machine-stop').addEventListener('click',()=>{const sim=this.simulation();const stop=sim.circuit.instances.find(i=>i.params.tag?.value==='S_STOP');if(stop){stop.sim.pressed=!stop.sim.pressed;this.run();this.live();}});
    this.host.querySelector('#machine-piece').addEventListener('click',()=>{const sim=this.simulation(),s=drillState(sim);if(s.top&&s.open&&s.stopped){sim.machineWorkpiece=!s.workpiece;sim.machineHole=0;this.live();}});
    this.live();
  }
  live() {
    const sim=this.simulation(),s=sim&&drillState(sim);if(!s||!this.host.querySelector('#machine-feed'))return;
    const manual=this.circuit().controller==='manual';
    this.host.querySelector('#machine-mode').value=this.circuit().controller||'manual';
    this.host.querySelector('#machine-manual-controls').hidden=!manual;
    const stop=sim.circuit.instances.find(i=>i.params.tag?.value==='S_STOP')?.sim.pressed;
    this.host.querySelector('#machine-feed').setAttribute('transform',`translate(0 ${s.feedX*112})`);
    this.host.querySelector('#machine-clamp').setAttribute('transform',`translate(${s.clampX*75} 0)`);
    this.host.querySelector('#machine-workpiece').style.visibility=s.workpiece?'visible':'hidden';
    this.host.querySelector('#machine-hole').setAttribute('rx',String(s.hole*6));
    this.host.querySelector('#machine-drill').style.fill=Math.abs(s.rpm)>50?'url(#machine-drill-pattern)':'#779291';
    this.host.querySelector('#machine-drill-pattern').setAttribute('patternTransform',`translate(0 ${Math.abs(s.rpm)>50?(sim.time*s.rpm/60*10)%12:0})`);
    this.host.querySelector('#machine-motor-light').setAttribute('fill',s.stopped?'#a8bdb5':'#b5ee94');
    this.host.querySelector('#machine-caption').textContent=s.hole>=.99?'Boring gereed · wacht op vrijgave':s.bottom&&!s.stopped?`Boren · ${Math.round(s.hole*100)} %`:'Klemmen → boren → terug → loslaten';
    const labels=['Gereed','Klemmen','Spindel starten','Boor omlaag','Boren','Boor omhoog','Spindel stoppen','Klem los','Stop: boor omhoog'];
    const active=[...(sim.chart?.active||[])].map(id=>sim.chart.steps.get(id)?.name);
    const marker=sim.ladderRuntime?.outputs;
    const states=[['M_KLEM','Klemmen'],['M_SPIN','Spindel starten'],['M_NEER','Boor omlaag'],['M_BOREN','Boren'],['M_OP','Boor omhoog'],['M_STIL','Spindel stoppen'],['M_LOS','Klem los'],['M_STOP','Stop: boor omhoog']];
    const phase=manual?'Handmatig bedienen':this.circuit().controller==='ladder'?(states.find(([tag])=>marker?.get(tag))?.[1]||'Gereed'):(labels[Number(active[0])]||(active.length?'GRAFCET-stap '+active.join(', '):'Gereed'));
    this.host.querySelector('#machine-stage').textContent=phase;
    for(const button of this.host.querySelectorAll('[data-manual]')){
      const key=button.dataset.manual,on=sim.machineManual?.[key];button.setAttribute('aria-pressed',String(!!on));
      button.textContent=key==='clamp'?(on?'Klem loslaten':'Klem sluiten'):key==='spindle'?(on?'Spindel stoppen':'Spindel starten'):(on?'Boor omhoog':'Boor omlaag');
      button.disabled=key==='clamp'?(!on&&!s.workpiece)||(on&&(!s.top||!s.stopped)):key==='spindle'?!on&&(!s.clamped||!s.workpiece||stop):!on&&(!s.clamped||Math.abs(s.rpm)<500||stop);
    }
    const start=this.host.querySelector('#machine-start');start.hidden=manual;start.disabled=!!stop||!s.ready||!s.workpiece||!s.open||!s.top||!s.stopped;
    this.host.querySelector('#machine-stop').textContent=stop?'Stop vrijgeven':'Stop cyclus';
    const piece=this.host.querySelector('#machine-piece');piece.textContent=s.workpiece?'Werkstuk verwijderen':'Nieuw werkstuk plaatsen';piece.disabled=!s.open||!s.top||!s.stopped;
    this.host.querySelector('#machine-feedback').textContent=!s.ready?'Een gekoppelde cilinder of motor ontbreekt.':sim.machineBlocked||(!s.workpiece?'Plaats een werkstuk om te starten.':'');
    const signals=[['Klem dicht',s.clamped],['Boor boven',s.top],['Boor beneden',s.bottom],['Spindel stil',s.stopped]];
    this.host.querySelector('#machine-signals').innerHTML=signals.map(([label,on])=>`<div class="${on?'on':''}"><span>${label}</span><b>${on?'1':'0'}</b></div>`).join('')+`<div><span>Spindel</span><b>${Math.round(s.rpm)} rpm</b></div>`;
  }
}
