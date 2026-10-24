import { esc } from './symbols.js';

export const SH_LOGO = `<svg class="sh-print-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" role="img" aria-label="SH-logo"><rect width="44" height="44" rx="12" fill="#087f78"/><text x="22" y="29" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="white">SH</text></svg>`;

/** Static, unclipped ladder drawing, independent of editor selection and scroll position. */
export function ladderPrintSVG(row) {
  const count = Math.max(1, ...row.branches.map(b => b.length));
  const width = Math.max(800, count * 120 + 260), height = Math.max(180, row.branches.length * 85 + 70);
  const coilX = width - 110, coilY = height / 2, joinX = coilX - 90;
  const line = (x,y,x2,y2) => `<path d="M${x} ${y}L${x2} ${y2}"/>`;
  let drawing = line(25,20,25,height-20) + line(width-25,20,width-25,height-20);
  row.branches.forEach((branch,b) => {
    const y = 45 + b * 85;
    drawing += line(25,y,joinX,y) + line(joinX,y,joinX,coilY);
    branch.forEach((contact,n) => {
      const x = 90 + n * 120;
      drawing += `<rect x="${x-22}" y="${y-19}" width="44" height="38" fill="white" stroke="none"/>${line(x-15,y-18,x-15,y+18)}${line(x+15,y-18,x+15,y+18)}${contact.nc ? line(x-21,y+20,x+21,y-20) : ''}<text x="${x}" y="${y-27}">${esc(contact.tag)}</text>`;
    });
  });
  const label = row.kind === 'coil' ? '' : row.kind === 'set' ? 'S' : row.kind === 'reset' ? 'R' : row.kind.toUpperCase();
  drawing += line(joinX,coilY,coilX-20,coilY) + line(coilX+20,coilY,width-25,coilY)
    + `<path d="M${coilX-12} ${coilY-20}Q${coilX-35} ${coilY} ${coilX-12} ${coilY+20} M${coilX+12} ${coilY-20}Q${coilX+35} ${coilY} ${coilX+12} ${coilY+20}"/><text x="${coilX}" y="${coilY-30}">${esc(row.coil)}</text><text x="${coilX}" y="${coilY+5}">${esc(label)}</text>`;
  if (row.kind==='ton'||row.kind==='tof') drawing += `<text x="${coilX}" y="${coilY+42}">${esc(row.delay)} s</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><style>path{fill:none;stroke:#153b40;stroke-width:2}text{font:14px monospace;text-anchor:middle;fill:#153b40;stroke:none}</style>${drawing}</svg>`;
}

export function printDocument(title, pages, date = new Date()) {
  const stamp = new Intl.DateTimeFormat('nl-BE', {timeZone:'Europe/Brussels'}).format(date);
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{margin:0;background:#eaf0ed;color:#153b40;font-family:Arial,sans-serif}.print-page{background:white;width:273mm;min-height:180mm;margin:12px auto;padding:0;break-after:page}.print-page:last-child{break-after:auto}header{display:flex;gap:14px;align-items:center;padding:4mm 0;border-bottom:1px solid #b7d2c8}.sh-print-logo{width:44px;height:44px;flex-shrink:0}h1{font-size:17px;margin:0 0 4px}p{font-size:11px;margin:0}.drawing{height:148mm;display:flex;align-items:center;justify-content:center;padding:4mm 0}.drawing>svg{display:block;max-width:100%;width:100%;height:100%;object-fit:contain}footer{border-top:1px solid #d0ddd7;padding:2mm 0;font-size:10px;display:flex;justify-content:space-between}@media print{body{background:white}.print-page{width:auto;min-height:0;margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>${pages.map((page,n)=>`<section class="print-page"><header>${SH_LOGO}<div><h1>${esc(title)}</h1><p>SH TechniekLab — ${esc(page.label)}</p></div></header><div class="drawing">${page.svg.replace(/^<\?xml[^>]*>\s*/, '')}</div><footer><span>Het techniekatelier · ${esc(stamp)}</span><span>Blad ${n+1} van ${pages.length}</span></footer></section>`).join('')}</body></html>`;
}

export function openPrintPreview(title, pages) {
  if (!pages.length) return false;
  document.querySelector('#print-preview')?.remove();
  const opener = document.activeElement;
  const dialog = document.createElement('dialog');dialog.id='print-preview';
  dialog.innerHTML='<header><h2>Afdrukvoorbeeld met SH-logo</h2><span>A4 liggend · aanpassen kan in het afdrukvenster</span><button type="button" data-print disabled>Afdrukken / PDF bewaren</button><button type="button" data-close>Sluiten</button></header><iframe title="Afdrukvoorbeeld van het schema"></iframe>';
  const frame=dialog.querySelector('iframe');
  frame.addEventListener('load',()=>dialog.querySelector('[data-print]').disabled=false);
  frame.srcdoc=printDocument(title,pages);
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-print]').addEventListener('click',()=>{frame.contentWindow.focus();frame.contentWindow.print();});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
  dialog.addEventListener('close',()=>{dialog.remove();const target=opener?.getClientRects().length?opener:document.querySelector('#btn-export');target?.focus();});
  document.body.appendChild(dialog);dialog.showModal();return true;
}
