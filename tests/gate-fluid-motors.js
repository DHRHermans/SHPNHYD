import assert from 'node:assert/strict';
import {Circuit,EXAMPLES} from '../src/circuit.js';
import {Simulation} from '../src/engine.js';
import {resolveDrive} from '../src/motor-mechanics.js';
import {isVisualActuator,actuatorState} from '../src/actuator-view.js';
import {componentFlows} from '../src/flow-view.js';
const run=(s,t)=>{for(let n=0;n<Math.round(t*1000);n++)s.step(.001);};
const setup=oil=>{const c=EXAMPLES[oil?'hydraulicMotor':'airMotor'].build(),m=c.instances.find(i=>i.type===(oil?'h_motor':'air_motor')),load=c.instances.find(i=>i.type==='industrial_load'),sim=new Simulation(c);return{c,m,load,sim};};
export const tests=[
{name:'Luchtmotor en hydromotor verbruiken echt debiet en leveren beweging aan een aslast',fn(){for(const oil of [false,true]){const r=setup(oil);run(r.sim,1);assert(r.m.sim.rpm>100);assert(r.m.sim.q>0);assert(r.m.sim.pressureA>r.m.sim.pressureB);assert.equal(resolveDrive(r.load,r.c).motor,r.m);assert(isVisualActuator(r.m));assert(actuatorState(r.m,r.sim).motor);assert(componentFlows(r.sim).get(r.m.id+':A')>0);assert.equal(r.sim.diagnostics.failures,0);}}},
{name:'A/B omkeren keert de draairichting van beide fluïdische motoren om',fn(){for(const oil of [false,true]){const r=setup(oil);for(const w of r.c.wires){for(const end of [w.from,w.to])if(end.inst===r.m.id&&['A','B'].includes(end.port))end.port=end.port==='A'?'B':'A';}r.sim.rebuild();run(r.sim,1);assert(r.m.sim.rpm< -100);assert(r.m.sim.q<0);assert.equal(r.sim.diagnostics.failures,0);}}},
{name:'Te grote aslast blokkeert luchtmotor en hydromotor; ontlasten geeft beweging terug',fn(){for(const oil of [false,true]){const r=setup(oil);r.load.params.torque.value=500;run(r.sim,1);assert(Math.abs(r.m.sim.rpm)<1);r.load.sim.pressed=false;run(r.sim,1);assert(r.m.sim.rpm>100);assert.equal(r.sim.diagnostics.failures,0);}}},
{name:'Mechanische blokkering houdt rotor stil en JSON behoudt medium, aslijn en slagvolume',fn(){for(const oil of [false,true]){const r=setup(oil);r.m.faults.seized=true;run(r.sim,.3);assert.equal(r.m.sim.rpm,0);const copy=Circuit.fromJSON(r.c.toJSON()),m=copy.instances.find(i=>i.type===r.m.type);assert.equal(m.params.displacement.value,r.m.params.displacement.value);assert(copy.wires.some(w=>w.kind==='mechanical'));}}},
];
