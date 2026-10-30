import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import worker from '../dist/server/index.js';
import {fetchRecent} from '../src/frost.mjs';
const window={};
vm.runInNewContext(fs.readFileSync('dist/trondheim-data.js','utf8'),{window});
const data=window.TRONDHEIM_DATA;
test('Voll archive preserves real coverage and leaves incomplete normals unknown',()=>{
 assert.equal(data.daily.station,'SN68860:0');assert.equal(data.daily.first,'1923-01-01');
 assert.equal(data.monthly.filter(r=>r.month>='1991-01'&&r.month<='2020-12').length,247);
 assert.ok(!data.monthly.some(r=>r.month==='1992-01'));
 const w={TRONDHEIM_DATA:data};vm.runInNewContext(fs.readFileSync('dist/city-data.js','utf8'),{window:w,location:{search:'?city=trondheim'},URLSearchParams});assert.equal(w.RAIN_CITY.stationId,'SN68860');assert.equal(w.RECORD_DATA,data.daily);
});
test('Trondheim page and API are routed to Voll',async()=>{
 const html=await (await worker.fetch(new Request('https://example.test/?city=trondheim'),{},{})).text();
 assert.ok(html.includes('<title>Regnrytme · Trondheim</title>'));
 assert.ok(html.includes('<option value="trondheim" selected>Trondheim · Voll</option>'));
 assert.ok(html.includes('Historiske rekorder slått i 2026 · Trondheim–Voll'));
 await fetchRecent('test',new Date('2026-10-30T12:00:00Z'),async(url)=>{
 assert.equal(url.searchParams.get('sources'),'SN68860');return {ok:true,json:async()=>({data:[{sourceId:'SN68860:0',referenceTime:'2026-10-29T00:00:00Z',observations:[{elementId:'sum(precipitation_amount P1D)',timeResolution:'P1D',timeOffset:'PT6H',timeSeriesId:0,unit:'mm',value:3,qualityCode:0}]}]})};},'trondheim');
});
