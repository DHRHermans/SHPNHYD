import {isMotor} from './power-network.js';
import {parseReceptivity} from './grafcet.js';
import {controllerSignal} from './ladder.js';
export const LESSONS=[
 {id:'air',name:'Pneumatiek: van knop naar beweging',example:'direct',domain:'air',hints:['Verbind bron → poort 1, poort 2 → cilinder. Poort 3 ontlucht.','Het 3/2-ventiel schakelt zolang je de knop vasthoudt.','De veer brengt de enkelwerkende cilinder terug.']},
 {id:'oil',name:'Hydrauliek: sturen en eindstanden',example:'electroHydraulic',domain:'oil',hints:['Een oliekring heeft pomp, tank en drukbegrenzing nodig.','Koppel S1/S2 aan de spoelen van het 4/3-ventiel.','Vergelijk B0 en B1 met de werkelijke cilinderpositie.']},
 {id:'motor',name:'Motor: starten, zelfhouding en stoppen',example:'motorDirect',domain:'motor',hints:['Een kort startcommando moet de contactor aantrekken.','Het hulpcontact overbrugt de startknop, maar niet de stopknop.','De stopknop verbreekt de stuurkring; loslaten start niet opnieuw.']},
 {id:'plc',name:'PLC Ladder: van bedrade ingang naar uitgang',example:'ladderWired',domain:'air',hints:['Voed L+ en M van de PLC-module met 24 V.','Volg I0 → programmanaam S1 → contact → uitgang Y1.','Q0 moet echt naar de ventielspoel bedraad zijn.']},
 {id:'grafcet',name:'GRAFCET: stappen en voorwaarden',example:'grafcetWired',domain:'air',hints:['De initiële stap is actief bij reset.','Een overgang vereist actieve voorgaande stappen én een ware voorwaarde.','Een actie stuurt een uitgang; die beweegt pas iets als de bedrading klopt.']},
 {id:'machine',name:'Klemmen en boren: van handmatig naar automatisch',example:'drillingMachine',domain:'machine',hints:['Klem eerst het werkstuk voordat de spindel start.','Boor terug naar boven en wacht op stilstand voordat je de klem opent.','Maak zelf de volgorde in GRAFCET of Ladder en test ook de stop.']},
];
export function freshEvidence(){return {input:false,moved:false,end:false,returned:false,motorRan:false,motorStopped:false,output:false,steps:false,endTargets:[],runningTargets:[]};}
export function observeEvidence(e,sim){
  e.endTargets||=[];e.runningTargets||=[];
  for(const i of sim.circuit.instances){
    const target=i.type+'|'+(i.params.tag?.value||i.id);
    if(sim.circuit.defOf(i).interactive&&!['industrial_breaker','industrial_motor_protector','industrial_load'].includes(i.type)&&(i.sim.pressed||i.sim.lever))e.input=true;
    if(i.sim.x!=null){if(i.sim.x>.08)e.moved=true;if(i.sim.x>.97){e.end=true;if(!e.endTargets.includes(target))e.endTargets.push(target);}if(e.endTargets.includes(target)&&i.sim.x<.03)e.returned=true;}
    if(isMotor(i)&&i.sim.rpm!=null){if(Math.abs(i.sim.rpm)>50){e.motorRan=true;if(!e.runningTargets.includes(target))e.runningTargets.push(target);}if(e.runningTargets.includes(target)&&Math.abs(i.sim.rpm)<1)e.motorStopped=true;}
  }
  if([...sim.energized.values()].some(Boolean))e.output=true;
  if(sim.chart?.active.size&&[...sim.chart.active].some(id=>!sim.chart.steps.get(id)?.initial))e.steps=true;
}
export function lessonSteps(lesson){
  const motor=lesson.domain==='motor';return [
    {label:'Onderzoek de voeding en aansluitingen',check:(c,e)=>c.instances.some(i=>motor?['industrial_supply','industrial_supply_1p','industrial_mains'].includes(i.type):lesson.domain==='oil'?i.type==='h_pump':['supply','air_compressor'].includes(i.type)),hint:'Zoek de energiebron. Gebruik Onderdeeluitleg en controleer de poorten.'},
    {label:'Geef een echt handmatig startcommando',check:(c,e)=>e.input,hint:'Start de simulatie en bedien een fysieke drukknop. Observeer het contact of ventiel.'},
    {label:motor?'Laat de motor draaien':'Laat een cilinder de eindstand bereiken',check:(c,e)=>motor?e.motorRan:e.end,hint:'Controleer bij geen beweging eerst voeding, ventiel/contactor en meetwaarden.'},
    {label:motor?'Stop de motor en wacht op stilstand':'Laat de cilinder terugkeren',check:(c,e)=>motor?e.motorStopped:e.returned,hint:'Geef het passende stop- of terugcommando en volg de werkelijke positie of het toerental.'},
    {label:'Leg uit waarom de beweging start en stopt',reflection:true,check:()=>false,hint:'Noem voeding, bediening, ventiel/contactor en de actuator. Je toelichting wordt bewaard, niet automatisch inhoudelijk beoordeeld.'},
  ];
}
export function componentExplanation(inst,def){
  const t=inst.type;let operation,example;
  if(/^cyl_|^h_cyl/.test(t)){operation='Druk op een zuigeroppervlak levert kracht. Het drukverschil, de last en wrijving bepalen de beweging. Een enkelwerkende cilinder keert door een veer terug; een dubbelwerkende wordt aan beide zijden gestuurd.';example='Een werkstuk klemmen of een boorvoeding verplaatsen.';}
  else if(def.geom||/ventiel/i.test(def.name)){operation='Een ventiel verbindt of blokkeert poorten. De bediening bepaalt de stand; een veer keert terug, een vergrendeling of geheugen houdt de stand vast. Een smoorventiel regelt het debiet.';example='Vergelijk ruststand en bediende stand, en volg de weg van voeding naar actuator en afvoer.';}
  else if(isMotor(inst)){operation='Elektrische voeding veroorzaakt rotatie. De driefasenmotor volgt de aangesloten fasevolgorde; de DC-motor volgt polariteit en spanning. De getoonde stroom en uitloop zijn vereenvoudigde modelwaarden.';example='Een spindel of transportband starten met een contactor en zelfhouding.';}
  else if(inst.type==='industrial_breaker'||inst.type==='industrial_motor_protector'){operation='Deze instelbare beveiliging opent de hoofdkring bij berekende thermische overbelasting of de ingestelde magnetische modelgrens. De gekoppelde motoren worden via de getekende hoofdkring bepaald. Reset vereist afkoeling.';example='Vergroot de aslast of blokkeer de motor en vergelijk stroom, tijd en uitschakeling.';}
  else if(inst.params.motor){operation='Dit onderdeel is via een mechanische as of motoraanduiding gekoppeld. Een pomp volgt het toerental en levert een aslast; de temperatuursensor volgt het thermische motormodel. PT100 levert een temperatuurafhankelijke weerstand, geen rechtstreeks digitaal PLC-signaal.';example='Verbind de as of kies de motor, start de aandrijving en volg toerental, belasting en temperatuur.';}
  else if(def.interactive){operation=t==='btn_nc'||t==='estop'?'Het contact is in rust gesloten en opent bij bediening. Een noodstop vergrendelt totdat je hem bewust vrijgeeft.':'Een momentane bediening werkt zolang je indrukt; een vergrendelende bediening blijft staan. De simulatie gebruikt dezelfde fysieke ingang in schema en procesbeeld.';example='Voorspel het ingangssignaal in rust, ingedrukt en na loslaten.';}
  else if(inst.params.target){operation='Deze sensor volgt de gekoppelde cilinder en de ingestelde detectiepositie. Zonder juiste koppeling kan de besturing geen betrouwbare eindstand herkennen.';example='Laat B0 het begin van de slag en B1 het einde detecteren.';}
  else if(/^(plc|grafcet)_io$/.test(t)){operation='De module leest spanning op I0–I7 en schakelt Q0–Q7. L+ en M moeten gevoed zijn. Programmanamen verbinden de bedrading met je Ladder of GRAFCET.';example='Verbind een drukknop met I0 en een ventielspoel met Q0, met een gedeelde 0 V.';}
  else{operation=def.coilLike?'Deze elektrische belasting reageert op haar voeding. Een spoelaanduiding koppelt de spoel aan contactor, relais of ventiel; een lamp toont de bekrachtiging.':'Dit onderdeel verwerkt, levert of meet energie/signalen volgens de aansluitingen en instellingen. De meetwaarden tonen de berekende modeltoestand.';example='Controleer voeding, aansluitingen en het effect van één wijziging tegelijk.';}
  const ports=def.ports.map(p=>{const kind=p.kind||'pneumatic';let meaning=kind==='electric'?'Elektrische aansluiting':kind==='motor'?'Functionele driefasenaansluiting':kind==='hydraulic'?'Oliepoort':kind==='mechanical'?'Mechanische as: verbind met motor, belasting of pomp':'Luchtpoort';
    if(def.geom)meaning=kind==='hydraulic'?({P:'Pompaansluiting',T:'Retour naar tank',A:'Werkpoort A',B:'Werkpoort B'}[p.id]||meaning):({'1':'Persluchttoevoer','2':'Werkpoort','4':'Werkpoort','3':'Ontluchting','5':'Ontluchting','12':'Stuurpoort','14':'Stuurpoort'}[p.id]||meaning);
    if(p.id==='L+')meaning='+24 V modulevoeding';if(p.id==='M'&&/io$/.test(t))meaning='0 V referentie';if(/^I\d$/.test(p.id))meaning='Fysieke ingang';if(/^Q\d$/.test(p.id))meaning='Fysieke uitgang';return{id:p.id,meaning};});
  return {operation,example,ports};
}
export function runtimeIssues(c,sim){
  const out=[];for(const i of c.instances){const d=c.defOf(i),tag=i.params.tag?.value||d.short;
    if(isMotor(i)&&d.ports.some(p=>p.id==='PE')&&!c.hasWire(i.id,'PE'))out.push({id:i.id,text:`${tag}: de PE-aansluiting is niet verbonden.`,hint:'Een functioneel draaiende motor bewijst niet dat de beschermingsgeleider correct is aangesloten. Verbind PE volgens het gekozen netstelsel.'});
    if(i.params.motor?.value&&!c.instances.some(m=>isMotor(m)&&m.params.tag?.value===i.params.motor.value))out.push({id:i.id,text:`${tag}: de opgegeven motor is niet gevonden.`,hint:'Kies een bestaande motoraanduiding of verbind de mechanische as.'});
    if(i.params.target&&!i.params.target.value)out.push({id:i.id,text:`${tag}: sensor is niet aan een cilinder gekoppeld.`,hint:'Kies in Eigenschappen de cilinder en de detectiepositie.'});
    if(/^cyl_|^h_cyl/.test(i.type)&&sim.time>.1&&Math.abs(i.sim.v||0)<.0001){const ports=d.ports,pressures=ports.map(p=>p.kind==='hydraulic'?sim.hgauge(i.id,p.id):sim.gauge(i.id,p.id));if(pressures.every(v=>v<.1))out.push({id:i.id,text:`${tag}: op de cilinderpoorten is vrijwel geen overdruk gemeten.`,hint:'Volg de bron, leidingen en huidige ventielstand. Lage druk kan in rust normaal zijn.'});}
    for(const[f,on]of Object.entries(i.faults||{}))if(on)out.push({id:i.id,text:`${tag}: een componentstoring is actief.`,hint:'Gebruik metingen om het gevolg te onderzoeken; onthul de storing wanneer je wilt nakijken.'});
  }
  if(sim.ioError)out.push({text:sim.ioError,hint:'Controleer voeding en unieke ingangs-/uitgangsnamen.'});
  if(sim.controllerError)out.push({text:sim.controllerError,hint:'Open de actieve besturing en herstel de gemelde uitdrukking of het Laddernetwerk.'});return out;
}
export function measure(c,sim,{mode,a,ap,b,bp}){
  const inst=c.byId(a),def=inst&&c.defOf(inst);if(!inst)return {value:null,unit:'',note:'Kies een onderdeel.'};
  if(mode==='motorCurrent')return {value:isMotor(inst)&&Number.isFinite(inst.sim.current)?inst.sim.current:null,unit:'A',note:'Geschatte motorstroom in het functionele model; geen echte AC-stroommeting.'};
  if(mode==='temperature')return {value:Number.isFinite(inst.sim.temperature)?inst.sim.temperature:null,unit:'°C',note:'Thermisch onderwijsmodel van motor of gekoppelde sensor.'};
  if(mode==='rpm')return {value:Number.isFinite(inst.sim.rpm)?inst.sim.rpm:null,unit:'omw/min',note:'Modeltoerental; alleen beschikbaar op motoren.'};
  if(mode==='position')return {value:Number.isFinite(inst.sim.x)?inst.sim.x*100:null,unit:'%',note:'Positie over de ingestelde slag.'};
  if(mode==='pressure'){const p=def.ports.find(p=>p.id===ap);return {value:p&&['pneumatic','hydraulic'].includes(p.kind||'pneumatic')?(p.kind==='hydraulic'?sim.hgauge(a,ap):sim.gauge(a,ap)):null,unit:'bar',note:'Overdruk ten opzichte van atmosfeer/tank.'};}
  const port=def.ports.find(p=>p.id===ap),other=c.byId(b),otherPort=other&&c.defOf(other).ports.find(p=>p.id===bp);
  if(mode==='voltage')return {value:port?.kind==='electric'&&otherPort?.kind==='electric'?sim.volts(a,ap)-sim.volts(b,bp):null,unit:'V',note:'Rode meetpen minus zwarte meetpen. Het meetinstrument belast het model niet.'};
  if(mode==='current'){const r=def.resistance,ports=def.ports.filter(p=>p.kind==='electric');return {value:r&&ports.length===2?(inst.faults.coil_open||inst.faults.off?0:(sim.volts(a,ports[0].id)-sim.volts(a,ports[1].id))/r):null,unit:'A',note:'Afgeleid uit spanning/weerstand voor ondersteunde tweepolige weerstandsbelastingen; geen seriemeting of AC-meting.'};}
  return {value:null,unit:'',note:'Deze meting is niet beschikbaar.'};
}
export function controlTrace(sim){
  const tags=new Set(sim.circuit.instances.flatMap(i=>[i.params.tag?.value,i.params.solA?.value,i.params.solB?.value]).filter(Boolean));
  for(const row of sim.circuit.ladder?.rungs||[]){tags.add(row.coil);for(const branch of row.branches)for(const contact of branch)tags.add(contact.tag);}
  return {time:sim.time,conditions:inspectConditions(sim),steps:sim.chart?[...sim.chart.active].map(id=>sim.chart.steps.get(id)?.name||id):[],signals:[...tags].map(tag=>[tag,controllerSignal(sim,tag)]),outputs:[...(sim.ladderRuntime?.outputs||new Map())]};
}

export function inspectConditions(sim){
 if(!sim.chart)return [];
 return [...sim.chart.transitions.values()].map(t=>{
  const enabled=t.from.length>0&&t.from.every(id=>sim.chart.active.has(id));
  if(/[↑↓]/.test(t.receptivity))return {condition:t.receptivity,enabled,value:null,note:'Flank wordt in de modeltick beoordeeld.'};
  try{const find=name=>[...sim.chart.steps.values()].find(s=>s.name===name||s.id===name);
   const value=!!parseReceptivity(t.receptivity)({signal:tag=>controllerSignal(sim,tag),stepActive:name=>sim.chart.active.has(find(name)?.id),stepTime:name=>sim.chart.stepTime(find(name)?.id)});
   return {condition:t.receptivity,enabled,value,note:''};
  }catch(error){return {condition:t.receptivity,enabled,value:null,note:error.message};}
 });
}
