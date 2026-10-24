import assert from 'node:assert/strict';
import {Circuit} from '../src/circuit.js';
import {Grafcet} from '../src/grafcet.js';
import {Simulation} from '../src/engine.js';
import {Recorder,drawDiagram} from '../src/diagram.js';
export const tests=[
 {name:'Import: ongeldige componentcoördinaten worden geweigerd',fn(){assert.throws(()=>Circuit.fromJSON({instances:[{id:'a',type:'btn_no',x:'" onload="bad',y:0}],wires:[]}),/componentpositie/);}},
 {name:'Import: numerieke componentinstellingen mogen geen markup bevatten',fn(){assert.throws(()=>Circuit.fromJSON({instances:[{id:'a',type:'supply',x:0,y:0,params:{pressure:'<img src=x>'}}],wires:[]}),/numerieke/);}},
 {name:'Import: GRAFCET-posities moeten eindige getallen zijn',fn(){assert.throws(()=>Grafcet.fromJSON({steps:[{id:'a',name:'0',initial:true,x:'bad',y:0}],transitions:[]}),/GRAFCET-positie/);}},
 {name:'Meetdiagram toont geïmporteerde aanduidingen als tekst, niet als HTML',fn(){const c=new Circuit();const coil=c.add('relay_coil',0,0);coil.params.tag.value='<img src=x onerror="bad">';const sim=new Simulation(c),rec=new Recorder();rec.sync(c);rec.sample(sim);for(let n=0;n<10;n++)sim.step(.001);rec.sample(sim);const svg={setAttribute(){},innerHTML:''};drawDiagram(svg,rec,{width:800,height:300});assert(!svg.innerHTML.includes('<img'));assert(svg.innerHTML.includes('&lt;img'));}},
];
