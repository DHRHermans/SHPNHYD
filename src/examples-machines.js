import { Grafcet } from './grafcet.js';

export function drillingMachine(Circuit) {
  const c=new Circuit();
  const add=(type,tag,x,y)=>{const i=c.add(type,x,y);if(i.params.tag)i.params.tag.value=tag;return i;};
  const wire=(a,ap,b,bp)=>c.connect({inst:a.id,port:ap},{inst:b.id,port:bp});
  const air=add('supply','P_LUCHT',100,500);
  for(const [n,name] of ['KLEM','BOOR'].entries()){
    const x=200+n*300;
    const cyl=add('cyl_double',`A_${name}`,x,60);
    const valve=add('v52_sol_spring',`V_${name}`,x+20,330);valve.params.solA.value=`Y_${name}`;
    wire(air,'1',valve,'1');
    for(let p=0;p<2;p++){
      const throttle=add('throttle_check',`R_${name}${p}`,x+p*90,220);throttle.params.opening.value=name==='BOOR'?.14:.3;
      wire(valve,p?'2':'4',throttle,'1');wire(throttle,'2',cyl,p?'2':'1');
      const sensor=add('limit_switch',name==='KLEM'?(p?'B_KLEM_DICHT':'B_KLEM_OPEN'):(p?'B_BOOR_BENEDEN':'B_BOOR_BOVEN'),x+p*130,620);
      sensor.params.target.value=cyl.id;sensor.params.at.value=p;sensor.params.width.value=.01;
    }
  }
  const supply=add('industrial_supply','Q_BOOR',900,60),contact=add('industrial_contactor','KM_BOOR',900,220),motor=add('industrial_motor','M_BOOR',900,410);
  for(let p=1;p<=3;p++){wire(supply,`L${p}`,contact,`L${p}`);wire(contact,`T${p}`,motor,['U','V','W'][p-1]);}
  add('industrial_coil','KM_BOOR',1160,220);
  add('btn_no','S_START',1160,410);add('btn_nc','S_STOP',1280,410);
  c.scene={type:'drill-press',clamp:'A_KLEM',feed:'A_BOOR',motor:'M_BOOR'};
  c.controller='manual';
  const g=new Grafcet();
  const names=['Gereed','Klemmen','Spindel starten','Boor omlaag','Boren','Boor omhoog','Spindel stoppen','Klem los','Stop: boor omhoog'];
  const actions=[[],['Y_KLEM'],['Y_KLEM','KM_BOOR'],['Y_KLEM','KM_BOOR','Y_BOOR'],['Y_KLEM','KM_BOOR','Y_BOOR'],['Y_KLEM','KM_BOOR'],['Y_KLEM'],[],['Y_KLEM']];
  const steps=names.map((name,n)=>g.addStep({name:String(n),initial:n===0,x:n===8?470:120,y:40+n*125,actions:actions[n].map(target=>({kind:'continuous',target}))}));
  const conditions=['S_START * S_STOP * B_WERKSTUK * B_KLEM_OPEN * B_BOOR_BOVEN','B_KLEM_DICHT * S_STOP','t/X2/0.5s * S_STOP','B_BOOR_BENEDEN * S_STOP','t/X4/2s * S_STOP','B_BOOR_BOVEN * S_STOP','B_SPINDEL_STIL * B_BOOR_BOVEN','B_KLEM_OPEN'];
  conditions.forEach((condition,n)=>g.addTransition({from:[steps[n].id],to:[steps[(n+1)%8].id],receptivity:condition,x:137,y:130+n*125}));
  for(let n=1;n<=5;n++)g.addTransition({from:[steps[n].id],to:[steps[8].id],receptivity:'/S_STOP',x:350,y:100+n*125});
  g.addTransition({from:[steps[8].id],to:[steps[6].id],receptivity:'B_BOOR_BOVEN',x:487,y:1160});g.reset();c.chart=g;
  const no=tag=>({tag,nc:false}),nc=tag=>({tag,nc:true}),row=(coil,contacts,kind='coil')=>({coil,kind,branches:[contacts.map(t=>typeof t==='string'?no(t):t)]});
  const rows=[row('M_KLEM',['S_START','S_STOP','B_WERKSTUK','B_KLEM_OPEN','B_BOOR_BOVEN',nc('M_CYCLUS')],'set'),row('M_CYCLUS',['M_KLEM'],'set'),{...row('T_SPIN',['M_SPIN'],'ton'),delay:.5},{...row('T_BOOR',['M_BOREN'],'ton'),delay:2}];
  const states=['M_KLEM','M_SPIN','M_NEER','M_BOREN','M_OP','M_STIL','M_LOS'];
  const sensors=['B_KLEM_DICHT','T_SPIN','B_BOOR_BENEDEN','T_BOOR','B_BOOR_BOVEN','B_SPINDEL_STIL'];
  for(let n=0;n<6;n++){
    const condition=[states[n],sensors[n],...(n<5?['S_STOP']:['B_BOOR_BOVEN'])];
    rows.push(row(states[n+1],condition,'set'),row(states[n],condition,'reset'));
  }
  rows.push(row('M_STOP',['M_CYCLUS',nc('S_STOP'),nc('M_STIL'),nc('M_LOS')],'set'));
  for(const state of states)rows.push(row(state,['M_STOP'],'reset'));
  rows.push(row('M_STIL',['M_STOP','B_BOOR_BOVEN'],'set'),row('M_STOP',['M_STOP','B_BOOR_BOVEN'],'reset'),row('M_CYCLUS',['M_LOS','B_KLEM_OPEN'],'reset'),row('M_LOS',['M_LOS','B_KLEM_OPEN'],'reset'));
  for(const [output,tags] of [['Y_KLEM',[...states.slice(0,6),'M_STOP']],['KM_BOOR',['M_SPIN','M_NEER','M_BOREN','M_OP']],['Y_BOOR',['M_NEER','M_BOREN']]])rows.push({coil:output,kind:'coil',branches:tags.map(tag=>[no(tag)])});
  c.ladder={rungs:rows};return c;
}
