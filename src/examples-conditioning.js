import {fluidMotorExample} from './examples-switchgear.js';
export function conditioningExample(Circuit,oil=false,receiver=false){
 const c=fluidMotorExample(Circuit,oil),motor=c.instances.find(i=>i.type===(oil?'h_motor':'air_motor')),load=c.instances.find(i=>i.type==='industrial_load');load.params.torque.value=oil?3:.5;
 const wire=(a,p,b,q)=>c.connect({inst:a.id,port:p},{inst:b.id,port:q}),add=(type,x,y)=>c.add(type,x,y);
 const supply=c.instances.find(i=>i.type===(oil?'h_pump':'supply')),returnEnd=c.instances.find(i=>i.type===(oil?'h_tank':'silencer'));
 if(oil){const old=c.wireBetween({inst:motor.id,port:'B'},{inst:returnEnd.id,port:'T'});c.removeWire(old.id);const filter=add('h_return_filter',270,350),cooler=add('h_cooler',450,350);wire(motor,'B',filter,'P');wire(filter,'T',cooler,'P');wire(cooler,'T',returnEnd,'T');}
 else{const old=c.wireBetween({inst:supply.id,port:'1'},{inst:motor.id,port:'A'});c.removeWire(old.id);const filter=add('air_filter',100,70);wire(supply,'1',filter,'1');if(receiver){const valve=add('air_shutoff',240,70),tank=add('air_receiver',350,70);wire(filter,'2',valve,'1');wire(valve,'2',tank,'1');wire(tank,'2',motor,'A');}else{const separator=add('air_separator',250,70),dryer=add('air_dryer',400,70),lubricator=add('air_lubricator',550,70);wire(filter,'2',separator,'1');wire(separator,'2',dryer,'1');wire(dryer,'2',lubricator,'1');wire(lubricator,'2',motor,'A');}}
 const positions=oil?{h_pump:[60,110],h_tank:[60,500],h_relief:[250,300],h_motor:[450,130],industrial_load:[700,130],h_return_filter:[450,350],h_cooler:[650,350]}:receiver?{supply:[60,120],air_filter:[180,110],air_shutoff:[370,110],air_receiver:[560,110],air_motor:[800,130],industrial_load:[1000,130],silencer:[800,400]}:{supply:[60,120],air_filter:[180,110],air_separator:[350,110],air_dryer:[520,110],air_lubricator:[690,110],air_motor:[880,130],industrial_load:[1100,130],silencer:[880,400]};
 for(const i of c.instances)if(positions[i.type])[i.x,i.y]=positions[i.type];c.touch();
 return c;
}
export function accumulatorExample(Circuit){
 const c=fluidMotorExample(Circuit,true),pump=c.instances.find(i=>i.type==='h_pump'),motor=c.instances.find(i=>i.type==='h_motor'),tank=c.instances.find(i=>i.type==='h_tank'),wire=(a,p,b,q)=>c.connect({inst:a.id,port:p},{inst:b.id,port:q});
 c.removeWire(c.wireBetween({inst:pump.id,port:'P'},{inst:motor.id,port:'A'}).id);
 const valve=c.add('h_shutoff',200,100),acc=c.add('h_accumulator',420,20),gauge=c.add('h_gauge',560,50);
 wire(pump,'P',valve,'P');wire(valve,'T',motor,'A');wire(motor,'A',acc,'P');wire(motor,'A',gauge,'P');
 motor.x=600;motor.y=180;tank.x=60;tank.y=500;c.instances.find(i=>i.type==='industrial_load').x=850;return c;
}
