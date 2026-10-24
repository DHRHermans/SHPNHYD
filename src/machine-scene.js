/** Serializable user-built scene. Old example files retain their original layout. */
export const MACHINE_PARTS = {drill:'Kolomboor',vise:'Bankschroef',workpiece:'Werkstuk'};
export const MACHINE_BINDINGS = {
  clamp:['Klemcilinder','A_KLEM'],feed:['Boorcilinder','A_BOOR'],motor:['Spindelmotor','M_BOOR'],
  clampOutput:['Uitgang klemventiel','Y_KLEM'],feedOutput:['Uitgang boorventiel','Y_BOOR'],motorOutput:['Uitgang motorcontactor','KM_BOOR'],
  start:['Startknop','S_START'],stop:['Stopknop (NC)','S_STOP'],
  workpieceInput:['Signaal werkstuk aanwezig','B_WERKSTUK'],stoppedInput:['Signaal spindel stil','B_SPINDEL_STIL'],
};
export function newMachineScene() {
  return {type:'drill-press',title:'Mijn machineopstelling',parts:[],clamp:'',feed:'',motor:'',clampOutput:'',feedOutput:'',motorOutput:'',start:'',stop:'',workpieceInput:'',stoppedInput:'',interlocks:false};
}
export function sceneBinding(scene,key) { return String(scene[key] ?? MACHINE_BINDINGS[key]?.[1] ?? ''); }
export function sceneParts(scene) { return scene.parts ?? ['drill','vise','workpiece'].map(type=>({type,x:0,y:0})); }
export function normalizeMachineScene(raw) {
  const scene={type:'drill-press',title:String(raw.title??'Bankschroef & kolomboormachine'),interlocks:raw.interlocks!==false};
  for(const key of Object.keys(MACHINE_BINDINGS))scene[key]=sceneBinding(raw,key);
  if(raw.parts!==undefined){
    if(!Array.isArray(raw.parts)||raw.parts.length>3)throw new Error('Ongeldige machineonderdelen.');
    const used=new Set();
    scene.parts=raw.parts.map(p=>{
      const x=Number(p.x??0),y=Number(p.y??0);
      if(!Object.hasOwn(MACHINE_PARTS,p.type)||used.has(p.type)||!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>800||Math.abs(y)>500)throw new Error('Ongeldig machineonderdeel of positie.');
      used.add(p.type);return {type:p.type,x,y};
    });
  }
  return scene;
}
