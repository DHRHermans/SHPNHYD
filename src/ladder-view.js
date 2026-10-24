import { sceneBinding } from './machine-scene.js';
import { esc } from './symbols.js';
import { validateLadder, controllerSignal } from './ladder.js';

const symbol = (nc, coil = false, kind = 'coil') => `<svg viewBox="0 0 100 42" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M0 21H32 M68 21H100"/>${coil ? '<path d="M40 6 Q24 21 40 36 M60 6 Q76 21 60 36"/>' : '<path d="M35 6V36 M65 6V36"/>'}${nc ? '<path d="M30 36L70 6"/>' : ''}</g>${coil && kind !== 'coil' ? `<text x="50" y="26" text-anchor="middle" fill="currentColor">${kind === 'set' ? 'S' : kind === 'reset' ? 'R' : kind.toUpperCase()}</text>` : ''}</svg>`;

const TOOLS = { select: 'Selecteren', no: 'Maakcontact', nc: 'Verbreekcontact', coil: 'Uitgang', set: 'Set', reset: 'Reset', ton: 'TON', tof: 'TOF' };

export class LadderEditor {
  constructor(host, { circuit, simulation, changed }) {
    this.host = host; this.circuit = circuit; this.simulation = simulation; this.changed = changed;
    this.tool = 'select'; this.selection = null; this.host.tabIndex = 0;
    this.host.addEventListener('keydown', e => {
      if (e.target.closest('input, select, textarea')) return;
      if (e.key === 'Escape' && this.selection) { e.preventDefault(); e.stopPropagation(); this.selection = null; this.draw(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); e.stopPropagation();
        if (!this.selection) return;
        const {r,b,n,kind} = this.selection, rows = this.circuit().ladder?.rungs;
        if (!rows?.[r]) return;
        if (kind === 'contact') rows[r].branches[b]?.splice(n,1); else { rows[r].coil=''; rows[r].kind='coil'; delete rows[r].delay; }
        this.selection = null; this.changed(); this.draw(); this.host.focus();
      }
    });
    new ResizeObserver(() => this.drawWires()).observe(host);
  }
  draw() {
    const c = this.circuit();
    const program = c.ladder || { rungs: [] };
    const tags = [...new Set(c.instances.flatMap(i => [i.params.tag?.value, i.params.solA?.value, i.params.solB?.value,...Object.entries(i.params).filter(([k])=>/^(input|output)/.test(k)).map(([,p])=>p.value)]).filter(Boolean))].sort();
    if(c.scene?.type==='drill-press')tags.push(...['workpieceInput','stoppedInput'].map(key=>sceneBinding(c.scene,key)).filter(Boolean));
    const button = (action, label, data = '') => `<button type="button" data-ld-action="${action}" ${data}>${label}</button>`;
    const slot = (r,b,n) => `<button type="button" class="ld-insert" data-insert="${r}:${b}:${n}" aria-label="Contact invoegen op positie ${n + 1}" title="Kies een contact en klik, of sleep een contact hierheen">+</button>`;
    this.host.innerHTML = `<div class="ld-intro"><div><h2>PLC Ladder</h2><p>Teken contacten in serie (EN) en parallel (OF). Koppel via aanduidingen aan pneumatiek, hydrauliek of elektrische besturing.</p></div>${button('rung', '+ Netwerk')}</div>
      <div class="ld-palette" role="toolbar" aria-label="Laddergereedschappen">${Object.entries(TOOLS).map(([tool,label]) => `<button type="button" data-ld-tool="${tool}" aria-pressed="${this.tool === tool}" draggable="${tool !== 'select'}"><span>${tool === 'select' ? '↖' : tool === 'no' ? '─| |─' : tool === 'nc' ? '─|/|─' : tool === 'coil' ? '─( )─' : tool.toUpperCase()}</span>${label}</button>`).join('')}</div>
      <p class="ld-help" role="status">Kies een gereedschap en klik op een +, of sleep het naar een invoegpunt. Klik op een symbool om de aanduiding te bewerken. Delete verwijdert de selectie.</p>
      <datalist id="ld-tags">${tags.map(t => `<option value="${esc(t)}"></option>`).join('')}</datalist>
      <div id="ld-errors" role="status">${validateLadder(program).map(e => `<p>${esc(e)}</p>`).join('')}</div>
      <div class="ld-networks">${program.rungs.map((row, r) => `<section class="ld-rung" data-rung="${r}">
        <header><strong>Netwerk ${r + 1}</strong><span></span>${button('up', '↑', `data-r="${r}" aria-label="Netwerk omhoog"`)}${button('down', '↓', `data-r="${r}" aria-label="Netwerk omlaag"`)}${button('delete-rung', 'Verwijderen', `data-r="${r}"`)}</header>
        <div class="ld-circuit"><svg class="ld-wiring" aria-hidden="true"></svg><div class="ld-branches">${row.branches.map((branch, b) => `<div class="ld-branch" data-live-branch="${r}:${b}">${branch.map((contact, n) => `${slot(r,b,n)}<div class="ld-cell" data-live-contact="${r}:${b}:${n}" data-ld-select="contact:${r}:${b}:${n}" tabindex="0" role="group" aria-label="Contact ${esc(contact.tag)}">
          ${symbol(contact.nc)}<input type="text" aria-label="Contactaanduiding" list="ld-tags" data-ld-field="tag" data-r="${r}" data-b="${b}" data-n="${n}" value="${esc(contact.tag)}" placeholder="S1 / B0 / M_run">
          <select aria-label="Contacttype" data-ld-field="nc" data-r="${r}" data-b="${b}" data-n="${n}"><option value="no"${!contact.nc ? ' selected' : ''}>Maakcontact</option><option value="nc"${contact.nc ? ' selected' : ''}>Verbreekcontact</option></select>
          ${button('delete-contact', '×', `data-r="${r}" data-b="${b}" data-n="${n}" aria-label="Contact verwijderen"`)}</div>`).join('')}
          ${slot(r,b,branch.length)}${button('contact', '+ Contact', `data-r="${r}" data-b="${b}"`)}${button('delete-branch', '× Tak', `data-r="${r}" data-b="${b}"`)}</div>`).join('')}</div>
          <div class="ld-cell ld-coil" data-live-output="${r}" data-ld-select="coil:${r}:0:0" tabindex="0" role="group" aria-label="Uitgang ${esc(row.coil)}">${symbol(false, true, row.kind)}<input type="text" aria-label="Uitgangsaanduiding" list="ld-tags" data-ld-field="coil" data-r="${r}" value="${esc(row.coil)}" placeholder="Y1 / KM1 / M_run"><select aria-label="Spoeltype" data-ld-field="kind" data-r="${r}"><option value="coil"${row.kind === 'coil' ? ' selected' : ''}>Uitgang ( )</option><option value="set"${row.kind === 'set' ? ' selected' : ''}>Set (S)</option><option value="reset"${row.kind === 'reset' ? ' selected' : ''}>Reset (R)</option><option value="ton"${row.kind === 'ton' ? ' selected' : ''}>Inschakelvertraging</option><option value="tof"${row.kind === 'tof' ? ' selected' : ''}>Uitschakelvertraging</option></select>${['ton', 'tof'].includes(row.kind) ? `<label>Vertraging (s)<input type="number" min="0" max="3600" step="0.1" data-ld-field="delay" data-r="${r}" value="${row.delay ?? 1}"></label>` : ''}</div></div>
        <footer>${button('branch', '+ Parallelle tak', `data-r="${r}"`)}</footer></section>`).join('') || '<p class="ld-empty">Begin met + Netwerk. Voeg contacten en een uitgang toe; kies daarna bovenaan PLC Ladder als actieve besturing.</p>'}</div>
      <aside class="ld-signals"><strong>Live signalen</strong><div id="ld-signals"></div><p>NC-drukknoppen en noodstop leveren 1 wanneer hun contact gesloten is. Een verbreekcontact in Ladder keert het ingangssignaal nogmaals om. Interne merkers kun je zelf benoemen, bijvoorbeeld M_run. Netwerken worden van boven naar beneden uitgevoerd.</p></aside>`;
    this.host.querySelectorAll('[data-ld-action]').forEach(el => el.addEventListener('click', () => {
      c.ladder ||= { rungs: [] };
      const rows = c.ladder.rungs;
      const r = Number(el.dataset.r), b = Number(el.dataset.b), n = Number(el.dataset.n);
      const row = rows[r];
      switch (el.dataset.ldAction) {
        case 'rung': rows.push({ coil: 'Y1', kind: 'coil', branches: [[{ tag: 'S1', nc: false }]] }); break;
        case 'branch': row.branches.push([{ tag: 'S1', nc: false }]); break;
        case 'contact': row.branches[b].push({ tag: 'S1', nc: false }); break;
        case 'delete-contact': row.branches[b].splice(n, 1); break;
        case 'delete-branch': row.branches.splice(b, 1); break;
        case 'delete-rung': rows.splice(r, 1); break;
        case 'up': if (r > 0) [rows[r - 1], rows[r]] = [rows[r], rows[r - 1]]; break;
        case 'down': if (r < rows.length - 1) [rows[r + 1], rows[r]] = [rows[r], rows[r + 1]]; break;
      }
      this.changed(); this.draw();
    }));
    this.host.querySelectorAll('[data-ld-field]').forEach(el => el.addEventListener('change', () => {
      const row = c.ladder.rungs[Number(el.dataset.r)];
      if (el.dataset.ldField === 'delay') row.delay = Number(el.value);
      else if (el.dataset.ldField === 'coil' || el.dataset.ldField === 'kind') { row[el.dataset.ldField] = el.value.trim(); if (['ton', 'tof'].includes(row.kind)) row.delay ??= 1; }
      else {
        const contact = row.branches[Number(el.dataset.b)][Number(el.dataset.n)];
        if (el.dataset.ldField === 'nc') contact.nc = el.value === 'nc'; else contact.tag = el.value.trim();
      }
      this.changed(); this.draw();
    }));
    this.bindDrawing();
    this.live();
    requestAnimationFrame(() => this.drawWires());
  }
  bindDrawing() {
    this.host.querySelectorAll('[data-ld-tool]').forEach(button => {
      button.addEventListener('click', () => { this.tool = button.dataset.ldTool; this.draw(); });
      button.addEventListener('dragstart', event => {
        if (button.dataset.ldTool === 'select') { event.preventDefault(); return; }
        event.dataTransfer.setData('application/x-shpnhyd-ladder', button.dataset.ldTool);
        event.dataTransfer.effectAllowed = 'copy';
      });
    });
    const apply = (element, tool) => {
      if (!(tool in TOOLS) || tool === 'select') return;
      const rows = this.circuit().ladder?.rungs;
      if (element.dataset.insert) {
        if (!['no','nc'].includes(tool)) return;
        const [r,b,n] = element.dataset.insert.split(':').map(Number);
        rows[r].branches[b].splice(n,0,{tag:'S1',nc:tool === 'nc'});
        this.selection = {kind:'contact',r,b,n};
      } else {
        const [kind,rs,bs,ns] = element.dataset.ldSelect.split(':');
        const r=+rs,b=+bs,n=+ns;
        if (kind === 'contact' && ['no','nc'].includes(tool)) rows[r].branches[b][n].nc = tool === 'nc';
        else if (kind === 'coil' && ['coil','set','reset','ton','tof'].includes(tool)) { rows[r].kind=tool; rows[r].coil ||= 'Y1'; if (tool==='ton'||tool==='tof') rows[r].delay ??= 1; }
        else return;
        this.selection={kind,r,b,n};
      }
      this.changed(); this.draw();
      this.host.querySelector('.ld-cell.selected input')?.focus();
    };
    this.host.querySelectorAll('[data-insert], [data-ld-select]').forEach(element => {
      if (element.dataset.ldSelect) {
        const [kind,r,b,n] = element.dataset.ldSelect.split(':');
        const selected = this.selection && kind === this.selection.kind && +r===this.selection.r && +b===this.selection.b && +n===this.selection.n;
        element.classList.toggle('selected',!!selected);
      }
      if (element.dataset.ldSelect) element.addEventListener('focusin', () => {
        const [kind,r,b,n]=element.dataset.ldSelect.split(':');this.selection={kind,r:+r,b:+b,n:+n};
        this.host.querySelectorAll('.ld-cell.selected').forEach(el=>el.classList.remove('selected'));element.classList.add('selected');
      });
      element.addEventListener('click', event => {
        if (event.target.closest('input,select,button') && !element.dataset.insert) return;
        if (element.dataset.insert) {
          apply(element,['no','nc'].includes(this.tool) ? this.tool : 'no'); return;
        }
        if (this.tool !== 'select') { apply(element,this.tool); return; }
        const [kind,r,b,n]=element.dataset.ldSelect.split(':');this.selection={kind,r:+r,b:+b,n:+n};
        this.draw();this.host.querySelector('.ld-cell.selected input')?.focus();
      });
      element.addEventListener('keydown', event => {
        if (event.target === element && (event.key==='Enter'||event.key===' ')) {event.preventDefault();element.click();}
      });
      element.addEventListener('dragover', event => {
        if (!event.dataTransfer.types.includes('application/x-shpnhyd-ladder')) return;
        event.preventDefault(); event.dataTransfer.dropEffect='copy';element.classList.add('drop-target');
      });
      element.addEventListener('dragleave',()=>element.classList.remove('drop-target'));
      element.addEventListener('drop', event => {event.preventDefault();event.stopPropagation();element.classList.remove('drop-target');apply(element,event.dataTransfer.getData('application/x-shpnhyd-ladder'));});
    });
  }
  drawWires() {
    if (!this.host.getClientRects().length) return;
    for (const circuit of this.host.querySelectorAll('.ld-circuit')) {
      const box=circuit.getBoundingClientRect(), svg=circuit.querySelector('.ld-wiring');
      if (!box.width||!box.height) continue;
      svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
      const coil=circuit.querySelector('.ld-coil > svg').getBoundingClientRect();
      const coilY=coil.top-box.top+coil.height/2, joinX=coil.left-box.left-12;
      const paths=[];const ys=[];
      const line=(x,y,x2,y2)=>paths.push(`<path d="M ${x} ${y} L ${x2} ${y2}"/>`);
      for(const branch of circuit.querySelectorAll('.ld-branch')) {
        const icons=[...branch.querySelectorAll('.ld-cell > svg')].map(e=>e.getBoundingClientRect());
        if(!icons.length)continue;
        const y=icons[0].top-box.top+icons[0].height/2;ys.push(y);let last=0;
        for(const icon of icons){line(last,y,icon.left-box.left,y);last=icon.right-box.left;}
        line(last,y,joinX,y);
      }
      if(ys.length){line(joinX,Math.min(...ys,coilY),joinX,Math.max(...ys,coilY));line(joinX,coilY,coil.left-box.left,coilY);line(coil.right-box.left,coilY,box.width,coilY);}
      svg.innerHTML=paths.join('');
    }
  }
  live() {
    const sim = this.simulation(), c = this.circuit();
    if (!sim) return;
    const runtime = sim.ladderRuntime;
    const active = c.controller === 'ladder';
    this.host.querySelectorAll('[data-live-contact]').forEach(el => {
      const [r,b,n] = el.dataset.liveContact.split(':').map(Number);
      el.classList.toggle('live', active && !!runtime?.live[r]?.contacts[b]?.[n]);
    });
    this.host.querySelectorAll('[data-live-branch]').forEach(el => {
      const [r,b] = el.dataset.liveBranch.split(':').map(Number);
      el.classList.toggle('live', active && !!runtime?.live[r]?.branches[b]);
    });
    this.host.querySelectorAll('[data-live-output]').forEach(el => {
      const row = c.ladder?.rungs[Number(el.dataset.liveOutput)];
      el.classList.toggle('live', active && !!runtime?.outputs.get(row?.coil));
    });
    const signals = this.host.querySelector('#ld-signals');
    if (signals) {
      const tags = new Set();
      for (const row of c.ladder?.rungs || []) { tags.add(row.coil); for (const branch of row.branches) for (const contact of branch) tags.add(contact.tag); }
      signals.innerHTML = [...tags].filter(Boolean).map(t => `<span class="${controllerSignal(sim, t) ? 'on' : ''}">${esc(t)} <b>${controllerSignal(sim, t) ? '1' : '0'}</b></span>`).join('');
    }
    if (sim.controllerError) { const host = this.host.querySelector('#ld-errors'); if (host) host.textContent = sim.controllerError; }
  }
}
