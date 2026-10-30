import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
const rows=html=>html.match(/<!--snapshot:yearBrokenRows-->([\s\S]*?)<!--\/snapshot:yearBrokenRows-->/)[1];
test('initial HTML has the selected city records, including switching back',async()=>{
 for(const city of ['oslo','bergen','oslo','bergen']){
  const response=await worker.fetch(new Request('https://example.test/?city='+city),{},{});const html=await response.text();
  const r=rows(html);assert.ok(r.includes(city==='oslo'?'24,9 mm':'89,1 mm'));assert.ok(!r.includes(city==='oslo'?'89,1 mm':'24,9 mm'));
  assert.ok(html.includes('Historiske rekorder slått i 2026 · '+(city==='oslo'?'Oslo–Blindern':'Bergen Florida')));
  assert.ok(html.includes('>Bergen · Florida</option>'));assert.ok(html.includes('>Oslo · Blindern</option>'));
 }
});
test('Stavanger has its own initial records and named station',async()=>{const html=await (await worker.fetch(new Request('https://example.test/?city=stavanger'),{},{})).text();assert.ok(html.includes('Historiske rekorder slått i 2026 · Sviland (Sandnes)'));assert.ok(html.includes('<option value="stavanger" selected>Stavanger-området · Sviland</option>'));const oslo=await (await worker.fetch(new Request('https://example.test/?city=oslo'),{},{})).text();assert.notEqual(rows(html),rows(oslo));});
