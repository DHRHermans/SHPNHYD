import { line,rect,circle,text } from './symbols.js';

const modeOf=c=>c.controller||(c.chart?'grafcet':'manual');
const active=(sim,inst)=>modeOf(sim.circuit)===(inst.type==='plc_io'?'ladder':'grafcet');

export function prepareControllerIO(sim) {
  sim.controllerInputs=new Map();sim.physicalOutputTags=new Set();sim.ioError=null;
  sim.controllerOutputs ||= new Map();
  const activeOutputs=new Set();
  for(const inst of sim.circuit.instances.filter(i=>['plc_io','grafcet_io'].includes(i.type))) {
    const powered=!inst.faults?.off&&sim.volts(inst.id,'L+')-sim.volts(inst.id,'M')>18;
    inst.sim.powered=powered;inst.sim.inputs=[];inst.sim.outputs=[];
    for(let n=0;n<8;n++){
      const input=powered&&sim.volts(inst.id,`I${n}`)-sim.volts(inst.id,'M')>12;
      inst.sim.inputs.push(input);inst.sim.outputs.push(powered&&sim.volts(inst.id,`Q${n}`)-sim.volts(inst.id,'M')>12);
      const inputName=inst.params[`input${n}`].value,outputName=inst.params[`output${n}`].value;
      if(outputName)sim.physicalOutputTags.add(outputName);
      if(!active(sim,inst))continue;
      if(inputName){if(sim.controllerInputs.has(inputName)){sim.ioError=`Ingang ${inputName} is dubbel gekoppeld.`;sim.controllerInputs.set(inputName,false);}else sim.controllerInputs.set(inputName,input);}
      if(outputName){if(activeOutputs.has(outputName))sim.ioError=`Uitgang ${outputName} is dubbel gekoppeld.`;activeOutputs.add(outputName);}
    }
  }
  for(const tag of sim.controllerInputs.keys())if(activeOutputs.has(tag))sim.ioError=`${tag} is tegelijk als ingang en uitgang gekoppeld.`;
  if(sim.ioError){for(const tag of sim.controllerInputs.keys())sim.controllerInputs.set(tag,false);for(const tag of sim.physicalOutputTags)sim.controllerOutputs.set(tag,false);}
}

export function routeControllerOutput(sim,tag,value) {
  if(!sim.physicalOutputTags?.has(tag))return false;
  sim.controllerOutputs.set(tag,!sim.ioError&&!!value);return true;
}

function moduleDefinition(id,name,mode) {
  const ports=[{id:'L+',x:60,y:0,dir:'up',kind:'electric'},{id:'M',x:120,y:0,dir:'up',kind:'electric'}];
  const params={tag:{label:'Aanduiding',type:'text',value:mode==='ladder'?'PLC1':'GC1'}};
  for(let n=0;n<8;n++){
    ports.push({id:`I${n}`,x:0,y:65+n*38,dir:'left',kind:'electric'},{id:`Q${n}`,x:180,y:65+n*38,dir:'right',kind:'electric'});
    params[`input${n}`]={label:`I${n} → programmanaam`,type:'text',value:`I${n}`};
    params[`output${n}`]={label:`Q${n} → programmanaam`,type:'text',value:`Q${n}`};
  }
  return {id,name,short:mode==='ladder'?'PLC · 8 in / 8 uit':'GRAFCET · 8 in / 8 uit',group:'Besturingsmodules',size:{w:180,h:365},ports,params,faultTypes:['off'],
    initSim(i){i.sim.powered=false;i.sim.inputs=Array(8).fill(false);i.sim.outputs=Array(8).fill(false);},
    stampElectric(i,st,ctx){
      const ground=ctx.net(i,'M');
      for(let n=0;n<8;n++){
        st.conduct(ctx.net(i,`I${n}`),ground,1e-6);
        const on=active(ctx.sim,i)&&!ctx.fault(i,'off')&&!ctx.sim.ioError&&ctx.sim.controllerOutputs?.get(i.params[`output${n}`].value);
        st.conduct(ctx.net(i,`Q${n}`),on?ctx.net(i,'L+'):ground,on?1:1e-6);
      }
    },
    render(i){
      let s=rect(10,22,160,336,'sym barrel')+line(60,0,60,22)+line(120,0,120,22)+text(60,16,'L+','sym-tag')+text(120,16,'M','sym-tag')+text(90,40,mode==='ladder'?'PLC LADDER':'GRAFCET','sym-tag')+circle(153,38,4,i.sim.powered?'sym lamp-on':'sym');
      for(let n=0;n<8;n++){const y=65+n*38;s+=line(0,y,10,y)+line(170,y,180,y)+circle(24,y,3,i.sim.inputs[n]?'sym lamp-on':'sym')+circle(156,y,3,i.sim.outputs[n]?'sym lamp-on':'sym')+text(34,y+3,`I${n}`,'sym-tag','start')+text(145,y+3,`Q${n}`,'sym-tag','end')+(i.params[`input${n}`].value!==`I${n}`?text(16,y+16,String(i.params[`input${n}`].value).slice(0,10),'sym-port','start'):'')+(i.params[`output${n}`].value!==`Q${n}`?text(164,y+16,String(i.params[`output${n}`].value).slice(0,10),'sym-port','end'):'');}
      return s+text(90,380,i.params.tag.value,'sym-tag');
    },
  };
}
export const CONTROL_IO_CATALOG=[moduleDefinition('plc_io','PLC-module: 24 V, 8 ingangen en 8 uitgangen','ladder'),moduleDefinition('grafcet_io','GRAFCET-module: 24 V, 8 ingangen en 8 uitgangen','grafcet')];
