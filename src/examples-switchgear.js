export function switchgearExample(Circuit,oil=false,timing=false){
 const c=new Circuit(),add=(type,x,y)=>c.add(type,x,y),wire=(a,p,b,q)=>c.connect({inst:a.id,port:p},{inst:b.id,port:q});
 const plus=add('rail_24v',370,30),zero=add('rail_0v',370,410),lamp=add('lamp',370,310);
 if(timing){const button=add('switch_toggle',370,100),timer=add('timer_blink',370,200),contact=add('contact_no',560,180),p2=add('rail_24v',560,30);timer.params.tag.value=contact.params.tag.value='KT1';wire(plus,'a',button,'11');wire(button,'14',timer,'a');wire(timer,'b',zero,'a');wire(p2,'a',contact,'a');wire(contact,'b',lamp,'a');wire(lamp,'b',zero,'a');}
 else{const sensor=add(oil?'h_pressostat':'air_pressostat',180,180);wire(plus,'a',sensor,'11');wire(sensor,'14',lamp,'a');wire(lamp,'b',zero,'a');if(oil){const pump=add('h_pump',20,180),tank=add('h_tank',20,400),relief=add('h_relief',180,350);relief.params.setpoint.value=60;wire(pump,'T',tank,'T');wire(pump,'P',sensor,'P');wire(pump,'P',relief,'P');wire(relief,'T',tank,'T');}else{const supply=add('supply',20,180);wire(supply,'1',sensor,'P');}}
 return c;
}
export function fluidMotorExample(Circuit,oil){
 const c=new Circuit(),a=c.add(oil?'h_pump':'supply',30,80),b=c.add(oil?'h_tank':'silencer',30,380),m=c.add(oil?'h_motor':'air_motor',260,150),load=c.add('industrial_load',470,150),wire=(x,p,y,q)=>c.connect({inst:x.id,port:p},{inst:y.id,port:q});load.params.torque.value=oil?3:1;wire(a,oil?'P':'1',m,'A');wire(m,'B',b,oil?'T':'1');wire(m,'shaft',load,'shaft');if(oil){wire(a,'T',b,'T');const relief=c.add('h_relief',160,300);relief.params.setpoint.value=100;wire(a,'P',relief,'P');wire(relief,'T',b,'T');}return c;
}
