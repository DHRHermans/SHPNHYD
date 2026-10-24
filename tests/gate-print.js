import assert from 'node:assert/strict';
import { printDocument, ladderPrintSVG } from '../src/print.js';
import { buildPdfFromShapes } from '../src/export.js';

export const tests = [
  { name: 'Afdruk: elk blad bevat het SH-logo, titel en paginanummer; titels zijn veilig tekst', fn() {
    const html=printDocument('Les <script>alert(1)</script>',[{label:'Schema',svg:'<svg></svg>'},{label:'Ladder',svg:'<svg></svg>'}],new Date('2026-10-24T10:00:00Z'));
    assert.equal((html.match(/aria-label="SH-logo"/g)||[]).length,2);
    assert(html.includes('Blad 1 van 2'));assert(html.includes('Blad 2 van 2'));
    assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));
    assert(html.includes('A4 landscape'));
  } },
  { name: 'Ladderafdruk: volledige brede en parallelle netwerken, contacttypen en timerwaarden', fn() {
    const contacts=Array.from({length:12},(_,n)=>({tag:`S${n}`,nc:n===4}));
    const svg=ladderPrintSVG({coil:'Y1',kind:'ton',delay:2.5,branches:[contacts,[{tag:'M_hold',nc:false}]]});
    const width=Number(svg.match(/viewBox="0 0 (\d+)/)[1]);assert(width>1600);
    for(const contact of contacts)assert(svg.includes(`>${contact.tag}</text>`));
    assert(svg.includes('M_hold'));assert(svg.includes('2.5 s'));assert(svg.includes('TON'));
  } },
  { name: 'PDF-export: SH-logo staat op tekening én onderdelenblad', fn() {
    const bytes=buildPdfFromShapes([],{x:0,y:0,w:10,h:10},{title:'Les',partsRows:[{count:1,tags:['M1'],spec:'',faults:0,domain:3,def:{name:'Motor',group:'Elektrisch'}}]});
    const text=new TextDecoder('latin1').decode(bytes);
    assert.equal((text.match(/\(SH\) Tj/g)||[]).length,2);
    assert(text.includes('SH TechniekLab'));
  } },
];
