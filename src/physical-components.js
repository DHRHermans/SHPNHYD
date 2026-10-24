/** Own physical illustrations, deliberately independent of the schematic renderer. */
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,label,size=12,color='#335d5d')=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="${color}">${esc(label)}</text>`;
const bolt=(x,y)=>`<circle cx="${x}" cy="${y}" r="5" fill="#667e82"/><path d="M${x-2} ${y-2}l4 4m0-4l-4 4" stroke="#dce7e5" stroke-width="1.5"/>`;
export function physicalKind(inst,def){
  if(['btn_no','btn_nc','estop'].includes(inst.type))return 'pushbutton';
  if(def.geom||/ventiel|smoor/i.test(def.name))return 'valve';
  if(/gauge/.test(inst.type))return 'gauge';
  if(inst.type==='lamp')return 'lamp';
  if(/sensor|switch/.test(inst.type)||/sensor|schakelaar/i.test(def.name))return 'sensor';
  return 'module';
}
function pushbutton(i){
  const pressed=!!i.sim.pressed,emergency=i.type==='estop',red=emergency||i.type==='btn_nc';
  const color=red?'#ce4743':'#149f78',light=red?'#f77565':'#50d3a2';
  return `<rect x="94" y="24" width="172" height="154" rx="16" fill="#e4ece8" stroke="#b4c8c1" stroke-width="2"/>${bolt(108,38)}${bolt(252,164)}${bolt(252,38)}${bolt(108,164)}${emergency?'<circle cx="180" cy="94" r="62" fill="#f3d650"/>':''}<ellipse cx="180" cy="${pressed?115:109}" rx="${emergency?52:45}" ry="41" fill="#879a97"/><circle cx="180" cy="94" r="48" fill="#d3dfda" stroke="#607b76" stroke-width="4"/><g transform="translate(0 ${pressed?7:0})"><ellipse cx="180" cy="92" rx="${emergency?49:37}" ry="${emergency?37:34}" fill="${color}" stroke="${red?'#9d302e':'#08735c'}" stroke-width="4"/><path d="M157 72Q180 57 202 72" fill="none" stroke="${light}" stroke-width="5" stroke-linecap="round"/>${text(180,99,emergency?'STOP':red?'0':'I',21,'white')}</g>${text(180,163,emergency?(pressed?'VERGRENDELD':'NOODSTOP'):(pressed?'INGEDRUKT':'DRUKKNOP'),10)}`;
}
function valve(i,d,sim){
  const oil=d.ports.some(p=>p.kind==='hydraulic'),fluid=oil?'#bd8a35':'#278fbb',active=Number(i.sim.state||0),geom=d.geom;
  const opening=i.params.opening||i.params.setpoint||i.params.pressure;
  const act=geom?.actLeft||(d.manual?'lever':opening?'knob':'housing');
  const right=geom?.actRight||'housing';
  const lever=act==='lever',angle=d.manual?(i.sim.lever||0)*30:(i.sim.pressed?30:-25);
  let image=`<path d="M90 87L112 65H278L298 87V147L278 164H90Z" fill="${oil?'#607e83':'#b9cbcc'}" stroke="#446166" stroke-width="2"/><path d="M90 87H278V164H90Z" fill="${oil?'#7e999c':'#dbe5e3'}" stroke="#6a8586"/><path d="M278 87L298 67V146L278 164Z" fill="#9aafb1"/>${bolt(104,101)}${bolt(264,101)}${bolt(104,150)}${bolt(264,150)}<rect x="127" y="99" width="111" height="35" rx="4" fill="#f6f9f5"/>${text(182,114,oil?'HYDRAULIEK':'PNEUMATIEK',9)}${text(182,128,geom?`${geom.boxes.length} standen`:'Regelventiel',10)}<rect x="124" y="143" width="115" height="6" rx="3" fill="#a6b9b4"/><rect x="${130+active*31}" y="143" width="23" height="6" rx="3" fill="#087f78"/>`;
  if(lever){const x=d.manual?180:91;image+=`<circle cx="${x}" cy="88" r="13" fill="#344c52"/><g transform="rotate(${angle} ${x} 88)"><path d="M${x} 88V32" stroke="#a8b7b6" stroke-width="9"/><ellipse cx="${x}" cy="28" rx="15" ry="20" fill="#284a50"/><path d="M${x-5} 16V32" stroke="#58767a" stroke-width="4" stroke-linecap="round"/></g>`;}
  else if(act==='button')image+=`<rect x="59" y="102" width="31" height="25" fill="#9cafb1"/><g transform="translate(${i.sim.pressed?9:0} 0)"><rect x="45" y="98" width="20" height="32" rx="6" fill="#c64c40"/><path d="M49 104V123" stroke="#fa9580" stroke-width="3"/></g>`;
  else if(act==='roller')image+=`<path d="M90 92L61 ${i.sim.state?56:45}" stroke="#8d9f9d" stroke-width="8"/><circle cx="60" cy="${i.sim.state?52:41}" r="12" fill="#354f55" stroke="#9fb5ae" stroke-width="4"/>`;
  for(const [side,a]of [[0,act],[1,right]]){
    const x=side?297:47;
    if(a==='solenoid'){
      const tag=i.params[side?'solB':'solA']?.value,on=!!sim.energized.get(tag);
      image+=`<rect x="${x}" y="94" width="40" height="48" rx="5" fill="#304a50"/><rect x="${x+8}" y="82" width="24" height="18" rx="3" fill="#415e65"/><path d="M${x+20} 82V66" stroke="#344d52" stroke-width="5"/><circle cx="${x+29}" cy="106" r="5" fill="${on?'#ffc94a':'#78908c'}"/>${text(x+20,157,tag||'Spoel',9)}`;
    } else if(a==='pilot')image+=`<rect x="${x}" y="102" width="33" height="30" rx="6" fill="#6798a8"/><path d="M${x+16} 102V74" stroke="${fluid}" stroke-width="6"/>`;
    else if(a==='spring')image+=`<rect x="${x}" y="100" width="24" height="33" rx="5" fill="#9fb2b3"/><path d="M${x+6} 104V129M${x+12} 104V129M${x+18} 104V129" stroke="#718c8e" stroke-width="2"/>`;
  }
  const ports=d.ports.filter(p=>p.kind!=='electric').slice(0,7);
  ports.forEach((p,n)=>{const x=112+n*(142/Math.max(1,ports.length-1));const bar=oil?sim.hgauge(i.id,p.id):sim.gauge(i.id,p.id);image+=`<rect x="${x-8}" y="166" width="16" height="11" rx="2" fill="#b99350"/><ellipse cx="${x}" cy="180" rx="8" ry="5" fill="#405d61"/><path d="M${x} 184V196" stroke="${bar>.2?fluid:'#b8c8c4'}" stroke-width="6" stroke-linecap="round"/>${text(x,215,p.id,10)}`;});
  if(opening){const f=(opening.value-opening.min)/(opening.max-opening.min);image+=`<rect x="169" y="36" width="26" height="30" fill="#9aafb0"/><g transform="rotate(${-135+270*f} 182 38)"><circle cx="182" cy="38" r="24" fill="#2b5156" stroke="#476b6d" stroke-width="5"/><path d="M182 20V32" stroke="#e4f2e8" stroke-width="4" stroke-linecap="round"/></g>`;}
  return image;
}
function gauge(i,d,sim){
  const oil=d.ports[0]?.kind==='hydraulic',bar=oil?sim.hgauge(i.id,d.ports[0].id):sim.gauge(i.id,d.ports[0].id),angle=-130+260*Math.max(0,Math.min(1,bar/(oil?250:10)));
  let marks='';for(let n=0;n<=10;n++)marks+=`<path d="M180 40V${n%2?48:53}" transform="rotate(${-130+n*26} 180 103)" stroke="#415b60" stroke-width="2"/>`;
  return `<rect x="172" y="171" width="16" height="26" fill="#b99350"/><circle cx="180" cy="103" r="77" fill="#95aaa9"/><circle cx="180" cy="103" r="68" fill="#fffdf5" stroke="#3d5c5f" stroke-width="3"/>${marks}<path d="M180 103V49" transform="rotate(${angle} 180 103)" stroke="#cd5143" stroke-width="4"/><circle cx="180" cy="103" r="7" fill="#365d62"/>${text(180,136,bar.toFixed(1)+' bar',17)}`;
}
function moduleImage(i,d){
  const on=!!(i.sim.on||i.sim.closed||i.sim.powered),sensor=/sensor|switch|schakelaar/i.test(d.name),lamp=i.type==='lamp';
  if(lamp)return `<rect x="105" y="31" width="150" height="155" rx="14" fill="#e0e9e3"/>${bolt(118,44)}${bolt(242,173)}<circle cx="180" cy="103" r="53" fill="#819c96"/><circle cx="180" cy="103" r="44" fill="${on?'#ffd35c':'#a3aa80'}" stroke="#6b805e" stroke-width="4"/><ellipse cx="171" cy="88" rx="23" ry="14" fill="${on?'#fff1a6':'#bcc5a0'}"/>${text(180,172,on?'LAMP AAN':'LAMP UIT',11)}`;
  if(sensor)return `<path d="M72 109H120" stroke="#4c7279" stroke-width="9"/><rect x="118" y="81" width="133" height="48" rx="14" fill="#b7c6c4" stroke="#6c898a" stroke-width="2"/><path d="M140 83V127M150 83V127M160 83V127M170 83V127" stroke="#839b9b" stroke-width="3"/><ellipse cx="253" cy="105" rx="12" ry="24" fill="#42656d"/><circle cx="226" cy="93" r="6" fill="${on?'#ffcb47':'#809385'}"/>${text(185,158,on?'GEDETECTEERD':'SENSOR VRIJ',12)}`;
  const controller=/^(plc|grafcet)_io$/.test(i.type),tank=i.type==='h_tank';
  return `<path d="M95 54L117 38H269L287 54V172L268 190H95Z" fill="#8fa5a5"/><rect x="95" y="54" width="174" height="136" rx="9" fill="${tank?'#8eaaa7':controller?'#d4dfdb':'#dfe8e1'}" stroke="#637e80" stroke-width="2"/>${bolt(108,67)}${bolt(256,177)}<rect x="116" y="77" width="131" height="51" rx="5" fill="#375b60"/>${text(181,99,controller?(i.type==='plc_io'?'PLC':'GRAFCET'):tank?'OLIERESERVOIR':d.short,controller?17:11,'#eef6eb')}${text(181,118,on?'ACTIEF':'SH TechniekLab',10,'#b6d7c6')}<circle cx="237" cy="141" r="6" fill="${on?'#70cf95':'#829b8f'}"/>${Array.from({length:5},(_,n)=>`<rect x="${123+n*24}" y="165" width="16" height="17" rx="2" fill="#617e82"/><circle cx="${131+n*24}" cy="174" r="3" fill="#d5e2dc"/>`).join('')}`;
}
export function physicalComponentSVG(inst,def,sim){
  const kind=physicalKind(inst,def),image=kind==='pushbutton'?pushbutton(inst):kind==='valve'?valve(inst,def,sim):kind==='gauge'?gauge(inst,def,sim):moduleImage(inst,def);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" role="img" aria-label="${esc('Fysieke uitvoering: '+def.short)}" data-physical-kind="${kind}"><rect x="20" y="12" width="320" height="205" rx="18" fill="#f1f6f2"/>${image}</svg>`;
}
