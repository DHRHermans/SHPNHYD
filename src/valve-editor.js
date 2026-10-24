import { esc } from './symbols.js';
import { validateValveLayout } from './valves.js';

export function valveEditorMarkup(def) {
  if(!def.geom)return '';
  return `<details class="valve-advanced"><summary>Extra: interne verbindingen tekenen</summary><label>Ventielstand <select id="valve-position">${def.geom.boxes.map((_,n)=>`<option value="${n}">Stand ${n+1}${def.geom.boxes.length===3&&n===1?' · midden':''}</option>`).join('')}</select></label><p>Klik twee poorten om een verbinding te maken of te verwijderen. Niet verbonden poorten zijn afgesloten.</p><svg id="valve-connections" viewBox="0 0 220 160" role="img" aria-label="Interne ventielverbindingen"></svg><button type="button" id="valve-restore">Standaardverbindingen herstellen</button><p>De bestaande aansluitpoorten blijven vast. Een andere standaarduitvoering kiezen herstelt ook de bijbehorende interne verbindingen.</p></details>`;
}

export function bindValveEditor(host,inst,def,changed) {
  const svg=host.querySelector('#valve-connections'),select=host.querySelector('#valve-position');if(!svg)return;
  const ports=Object.keys(def.geom.slots);let chosen=null;
  const coords=new Map(ports.map((p,n)=>[p,{x:110+70*Math.cos(n*Math.PI*2/ports.length-Math.PI/2),y:80+58*Math.sin(n*Math.PI*2/ports.length-Math.PI/2)}]));
  const draw=()=>{
    const index=Number(select.value),box=(inst.valveLayout?.boxes||def.geom.boxes)[index];
    svg.innerHTML=(box.paths||[]).map(([a,b])=>{const p=coords.get(a),q=coords.get(b);return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#087f78" stroke-width="3"/>`;}).join('')+ports.map(p=>{const c=coords.get(p);return `<g data-valve-port="${esc(p)}" role="button" tabindex="0" aria-label="Poort ${esc(p)}"><circle cx="${c.x}" cy="${c.y}" r="15" fill="${p===chosen?'#c3e7d6':'white'}" stroke="#087f78" stroke-width="2"/><text x="${c.x}" y="${c.y+4}" text-anchor="middle" fill="#153b40" font-size="12">${esc(p)}</text></g>`;}).join('');
  };
  const activate=port=>{
    if(chosen===null){chosen=port;draw();return;}
    if(chosen!==port){
      const layout=structuredClone(inst.valveLayout||{boxes:def.geom.boxes.map(b=>({paths:structuredClone(b.paths||[])}))});
      const paths=layout.boxes[Number(select.value)].paths;
      const match=paths.findIndex(pair=>pair.includes(chosen)&&pair.includes(port));
      if(match>=0)paths.splice(match,1);else paths.push([chosen,port]);
      inst.valveLayout=validateValveLayout(def,layout);changed();
    }
    chosen=null;draw();
  };
  svg.addEventListener('click',e=>{const port=e.target.closest('[data-valve-port]');if(port)activate(port.dataset.valvePort);});
  svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const port=e.target.closest('[data-valve-port]');if(port){e.preventDefault();activate(port.dataset.valvePort);}}});
  select.addEventListener('change',()=>{chosen=null;draw();});
  host.querySelector('#valve-restore').addEventListener('click',()=>{delete inst.valveLayout;chosen=null;changed();draw();});draw();
}
