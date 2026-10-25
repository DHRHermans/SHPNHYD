import {buildMotorExample} from './examples-industrial.js';
export function advancedDriveExample(Circuit,kind){
 const c=buildMotorExample(Circuit),oldMotor=c.instances.find(i=>i.type==='industrial_motor'),oldSource=c.instances.find(i=>i.type==='industrial_supply'),oldContactor=c.instances.find(i=>i.type==='industrial_contactor');
 const add=(type,tag,x,y)=>{const i=c.add(type,x,y);if(i.params.tag)i.params.tag.value=tag;return i;};
 const wire=(a,ap,b,bp)=>c.connect({inst:a.id,port:ap},{inst:b.id,port:bp});
 c.remove(oldMotor.id);c.remove(oldSource.id);c.remove(oldContactor.id);
 const mono=kind==='mono',six=['star','delta','starDelta','it'].includes(kind);
 const source=add(mono?'industrial_supply_1p':'industrial_mains','QNET',80,30),breaker=add('industrial_breaker','QF1',80,170),contactor=add(mono?'industrial_contactor_1p':'industrial_contactor','KM1',80,350),motor=add(mono?'industrial_motor_1p':six?'industrial_motor_6':'industrial_motor','M1',80,550);
 breaker.params.rated.value=10;motor.params.load.value=.3;
 c.instances.find(i=>i.type==='industrial_overload').params.rated.value=8;
 c.instances.find(i=>i.type==='industrial_overload').params.delay.value=20;
 if(six){motor.params.windingVoltage.value=kind==='delta'||kind==='starDelta'?400:230;}
 if(mono){wire(source,'L',breaker,'L1');wire(source,'N',breaker,'N');wire(breaker,'T1',contactor,'L1');wire(breaker,'TN',contactor,'N');wire(contactor,'T1',motor,'U1');wire(contactor,'TN',motor,'U2');wire(source,'PE',motor,'PE');}
 else{for(let n=1;n<=3;n++){wire(source,'L'+n,breaker,'L'+n);wire(breaker,'T'+n,contactor,'L'+n);wire(contactor,'T'+n,motor,(six?['U1','V1','W1']:['U','V','W'])[n-1]);}if(six&&kind!=='it')wire(source,'PE',motor,'PE');}
 if(kind==='star'||kind==='it'){wire(motor,'U2',motor,'V2');wire(motor,'V2',motor,'W2');}
 if(kind==='delta'){for(const[a,b]of[['U2','V1'],['V2','W1'],['W2','U1']])wire(motor,a,motor,b);}
 if(kind==='it'){source.params.system.value='IT';const ground=add('industrial_earth','RA1',290,650);wire(ground,'PE',motor,'PE');}
 if(kind==='starDelta'){
  const star=add('industrial_contactor','KM2',300,400),delta=add('industrial_contactor','KM3',470,400);star.params.interlock.value='KM3';delta.params.interlock.value='KM2';
  for(let n=1;n<=3;n++){wire(motor,['U2','V2','W2'][n-1],star,'L'+n);wire(motor,['U2','V2','W2'][n-1],delta,'L'+n);wire(delta,'T'+n,motor,['V1','W1','U1'][n-1]);}wire(star,'T1',star,'T2');wire(star,'T2',star,'T3');
  for(let n=0;n<2;n++){
   const x=920+n*210,enable=add('contact_no','KM1',x,90),timer=add(n?'industrial_contact_ton_no':'industrial_contact_ton_nc','KM1',x,190),interlock=add('contact_nc',n?'KM2':'KM3',x,300),coil=add('industrial_coil',n?'KM3':'KM2',x,410),power=add('rail_24v','',x,30),zero=add('rail_0v','',x,520);
   timer.params.delay.value=n?3.3:3;wire(power,'a',enable,'a');wire(enable,'b',timer,'a');wire(timer,'b',interlock,'a');wire(interlock,'b',coil,'a');wire(coil,'b',zero,'a');
  }
 }
 if(kind==='pump'){
  const pump=add('h_pump','P1',300,620),tank=add('h_tank','T1',300,830),relief=add('h_relief','DBV1',470,650),gauge=add('h_gauge','PG1',450,520);
  pump.params.flow.value=8;relief.params.setpoint.value=50;
  wire(motor,'shaft',pump,'shaft');wire(pump,'T',tank,'T');wire(pump,'P',relief,'P');wire(relief,'T',tank,'T');wire(pump,'P',gauge,'P');
 }
 if(kind==='compressor'){
  const comp=add('air_compressor','CP1',300,620),valve=add('v32_button','S_LUCHT',460,650),cylinder=add('cyl_single','A_LUCHT',470,470);
  wire(motor,'shaft',comp,'shaft');wire(comp,'1',valve,'1');wire(valve,'2',cylinder,'1');
 }
 if(kind==='thermal'||kind==='mono'){
  const load=add('industrial_load','LAST1',300,650);load.params.torque.value=kind==='thermal'?10:4;wire(motor,'shaft',load,'shaft');
 }
 if(kind==='thermal'){
  motor.params.thermalTime.value=4;
  const sensor=add('industrial_motor_temperature','BTH1',760,220),pt100=add('industrial_pt100','BT1',950,650);
  sensor.params.threshold.value=75;sensor.params.hysteresis.value=15;
  const stop=c.instances.find(i=>i.type==='btn_nc'),thermal=c.instances.find(i=>i.type==='industrial_overload'),oldWire=c.wireBetween({inst:stop.id,port:'b'},{inst:thermal.id,port:'a'});if(oldWire)c.removeWire(oldWire.id);
  wire(stop,'b',sensor,'a');wire(sensor,'b',thermal,'a');
  // PT100 is available for resistance inspection; users can add their own measuring bridge.
  pt100.params.motor.value='M1';
 }
 return c;
}
