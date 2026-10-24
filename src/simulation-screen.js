import { MachineView } from './machine-view.js';

/** Two views share one circuit and one simulation; a second window never runs a second solver. */
export class SimulationScreen {
  constructor(view,{toggleRun,stop,speed,setSpeed,returnToEditor,message,learning}){
    Object.assign(this,{view,toggleRun,stop,speed,setSpeed,returnToEditor,message,learning});this.popup=null;this.popupView=null;this.shell=null;
    view.screen=this;
    document.addEventListener('visibilitychange',()=>this.schedule(this.frameCallback));
    window.addEventListener('pagehide',()=>{this.popupView?.controls?.dispose();this.popup?.close();});
  }
  decorate(host){
    const doc=host.ownerDocument,detached=doc!==document;
    host.classList.toggle('simulation-dashboard',detached||!!this.shell);
    const tools=doc.createElement('nav');tools.className='simulation-toolbar';tools.setAttribute('aria-label','Simulatiescherm');
    tools.innerHTML=`<strong>SH · Simulatie</strong><button data-screen-run>Start</button><button data-screen-stop>Stop / reset</button><button data-screen-learning>Leeratelier</button><button data-screen-layout>Indeling</button><label>Tempo <input data-screen-speed type="range" min="0.1" max="2" step="0.1" value="${this.speed()}"><output data-screen-speed-value></output></label><span data-screen-clock></span><span class="simulation-tools-spacer"></span><button data-screen-focus>${detached?'Volledig scherm':this.shell?'Terug naar werkblad':'Groot simulatiescherm'}</button>${detached?'<button data-screen-return>Terug naar hoofdvenster</button>':'<button data-screen-detach>Extra venster</button>'}<span class="simulation-window-status" role="status"></span>`;
    host.prepend(tools);
    tools.querySelector('[data-screen-run]').onclick=()=>{this.toggleRun();this.live();};
    tools.querySelector('[data-screen-learning]').onclick=()=>this.learning?.open(this.learning.tab,null,doc);
    tools.querySelector('[data-screen-layout]').onclick=()=>this.learning?.open('layout',null,doc);
    this.learning?.decorateHost(host);
    tools.querySelector('[data-screen-stop]').onclick=()=>{this.stop();this.live();};
    tools.querySelector('[data-screen-speed]').oninput=e=>{this.setSpeed(Number(e.target.value));this.live();};
    tools.querySelector('[data-screen-focus]').onclick=()=>{
      if(detached){const action=doc.fullscreenElement?doc.exitFullscreen():doc.documentElement.requestFullscreen?.();action?.catch(()=>{tools.querySelector('.simulation-window-status').textContent='Maximaliseer dit venster via de vensterknoppen.';});}
      else this.toggleFocus();
    };
    tools.querySelector('[data-screen-detach]')?.addEventListener('click',()=>this.open());
    tools.querySelector('[data-screen-return]')?.addEventListener('click',()=>this.close(true));
    this.live();
  }
  toggleFocus(){
    if(this.shell){this.restore();return;}
    this.origin=this.view.host.parentNode;this.next=this.view.host.nextSibling;
    this.shell=document.createElement('section');this.shell.className='simulation-shell';this.shell.setAttribute('aria-label','Groot simulatiescherm');document.body.appendChild(this.shell);
    this.shell.appendChild(this.view.host);this.view.host.classList.remove('is-hidden');this.view.draw();
  }
  restore(){
    if(!this.shell)return;this.view.controls?.dispose();this.origin.insertBefore(this.view.host,this.next?.parentNode===this.origin?this.next:null);this.shell.remove();this.shell=null;this.returnToEditor();this.view.draw();
  }
  open(){
    if(this.popup&&!this.popup.closed){this.popup.focus();return;}
    const popup=window.open('','SH-TechniekLab-Simulatie','popup=yes,width=1500,height=950,resizable=yes,scrollbars=yes');
    if(!popup){const status=this.view.host.querySelector('.simulation-window-status');if(status)status.textContent='Extra venster geblokkeerd: sta pop-ups toe of kies Groot simulatiescherm.';this.message('Het extra venster is geblokkeerd. Sta pop-ups toe voor deze website of kies Groot simulatiescherm.');return;}
    this.popup=popup;
    const doc=popup.document;doc.open();doc.write('<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SH TechniekLab · Simulatiescherm</title></head><body class="simulation-window"></body></html>');doc.close();
    for(const link of document.querySelectorAll('link[rel="stylesheet"]')){const copy=doc.createElement('link');copy.rel='stylesheet';copy.href=link.href;doc.head.appendChild(copy);}
    const host=doc.createElement('main');host.className='machine-view';doc.body.appendChild(host);
    const source=this.view;
    this.popupView=new MachineView(host,{circuit:source.circuit,simulation:source.simulation,run:source.run,load:source.load,changed:source.changed,parametersChanged:source.parametersChanged,mode:value=>{source.mode(value);this.popupView?.draw();}});
    this.popupView.showActuators=source.showActuators;this.popupView.lastScene=source.circuit().scene;this.popupView.editing=source.editing;
    this.popupView.screen=this;this.popupCircuit=source.circuit();this.popupRevision=this.popupCircuit.revision;this.popupView.draw();
    const leave=()=>{if(this.popup!==popup)return;this.popupView?.controls?.dispose();this.popupView=null;this.popup=null;this.schedule(this.frameCallback);};
    doc.addEventListener('visibilitychange',()=>this.schedule(this.frameCallback));
    popup.addEventListener('pagehide',leave);popup.addEventListener('beforeunload',leave);
    doc.addEventListener('keydown',e=>{if(e.key==='Escape'){this.stop();this.live();}});
    popup.focus();this.schedule(this.frameCallback);
    this.message('Het simulatievenster is geopend. Je kunt het naar een tweede scherm verplaatsen.');
  }
  close(focus=false){
    const popup=this.popup;this.popupView?.controls?.dispose();this.popupView=null;this.popup=null;popup?.close();this.schedule(this.frameCallback);
    if(focus){window.focus();this.returnToEditor();}
  }
  refresh(){this.popupCircuit=this.view.circuit();this.popupRevision=this.popupCircuit.revision;this.popupView?.draw();}
  live(){
    if(this.popupView&&(this.popupCircuit!==this.view.circuit()||this.popupRevision!==this.view.circuit().revision))this.refresh();
    this.popupView?.live();
    for(const host of [this.view.host,this.popupView?.host].filter(Boolean)){
      const sim=this.view.simulation(),tools=host.querySelector('.simulation-toolbar');if(!tools)continue;
      tools.querySelector('[data-screen-run]').textContent=sim.running?'Pauze':'Start';
      if(host.ownerDocument!==document)tools.querySelector('[data-screen-focus]').textContent=host.ownerDocument.fullscreenElement?'Volledig scherm verlaten':'Volledig scherm';
      tools.querySelector('[data-screen-clock]').textContent=sim.time.toFixed(2).replace('.',',')+' s';
      const input=tools.querySelector('[data-screen-speed]');if(input.ownerDocument.activeElement!==input)input.value=this.speed();
      tools.querySelector('[data-screen-speed-value]').textContent=this.speed().toFixed(1).replace('.',',')+'×';
    }
  }
  schedule(callback){
    if(!callback)return;this.frameCallback=callback;
    if(this.request)this.request.win.cancelAnimationFrame(this.request.id);
    const win=this.popup&&!this.popup.closed&&!this.popup.document.hidden?this.popup:window;
    this.request={win,id:win.requestAnimationFrame(()=>callback(performance.now()))};
  }
}
