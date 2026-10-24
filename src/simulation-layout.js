const fields=i=>i.presentation||{order:0,scale:'normal',group:''};
export function decorateLayout(host,circuit,{editing,changed}){
  for(const grid of host.querySelectorAll('.process-grid,.actuator-grid')){
    const cards=[...grid.querySelectorAll(':scope>.process-card,:scope>.actuator-card')];
    cards.sort((a,b)=>{const x=fields(circuit.byId(a.dataset.process||a.dataset.actuator)),y=fields(circuit.byId(b.dataset.process||b.dataset.actuator));return x.group.localeCompare(y.group,'nl')||x.order-y.order;});
    let group=null;
    for(const card of cards){
      const id=card.dataset.process||card.dataset.actuator,inst=circuit.byId(id);if(!inst)continue;
      const data=fields(inst);card.dataset.cardScale=data.scale;
      if(group!==data.group){group=data.group;if(group){const label=host.ownerDocument.createElement('h4');label.className='simulation-group-title';label.textContent=group;grid.appendChild(label);}}
      grid.appendChild(card);
      if(!editing)continue;
      const tools=host.ownerDocument.createElement('div');tools.className='simulation-card-layout';
      tools.innerHTML='<button type="button" data-move-card title="Sleep om te verplaatsen" aria-label="Onderdeel verplaatsen">⠿ Verplaats</button><label>Beeldgrootte<select data-card-scale><option value="small">Klein</option><option value="normal">Normaal</option><option value="large">Groot</option></select></label><label>Groep<input data-card-group maxlength="60" placeholder="Bijv. Klemkring"></label>';
      card.prepend(tools);tools.querySelector('select').value=data.scale;tools.querySelector('input').value=data.group;
      const update=()=>{inst.presentation={...fields(inst),scale:tools.querySelector('select').value,group:tools.querySelector('input').value.trim().slice(0,60)};changed();};
      tools.querySelector('select').onchange=update;tools.querySelector('input').onchange=update;
      const handle=tools.querySelector('[data-move-card]');let start=null;
      handle.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();start=e.pointerId;handle.setPointerCapture(e.pointerId);card.classList.add('card-moving');};
      handle.onpointerup=e=>{
        if(start!==e.pointerId)return;start=null;card.classList.remove('card-moving');
        const target=host.ownerDocument.elementFromPoint(e.clientX,e.clientY)?.closest('.process-card,.actuator-card');
        if(!target||target===card||target.parentNode!==grid)return;
        const ordered=cards.filter(c=>c!==card),at=ordered.indexOf(target);ordered.splice(at,0,card);
        const targetInst=circuit.byId(target.dataset.process||target.dataset.actuator);
        inst.presentation={...fields(inst),group:fields(targetInst).group};
        ordered.forEach((node,n)=>{const part=circuit.byId(node.dataset.process||node.dataset.actuator);part.presentation={...fields(part),order:n};});changed();
      };
      handle.onpointercancel=()=>{start=null;card.classList.remove('card-moving');};
    }
  }
}
