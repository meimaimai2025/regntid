import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import worker from '../dist/server/index.js';
import {fetchRecent} from '../src/frost.mjs';
const window={};
vm.runInNewContext(fs.readFileSync('dist/trondheim-data.js','utf8'),{window});
const data=window.TRONDHEIM_DATA;
test('Trondheim composite has complete normal coverage and documented station periods',()=>{
 assert.equal(data.daily.station,'SN68860:0');assert.equal(data.daily.first,'1923-01-01');
 assert.equal(data.monthly.filter(r=>r.month>='1991-01'&&r.month<='2020-12').length,360);
 assert.ok(data.monthly.some(r=>r.month==='1992-01'&&r.source==='NOAA_GHCND_NOE00134634'));
 assert.equal(data.monthly.find(r=>r.month==='2002-01').source,'NOAA_GHCND_NOE00111040');
 assert.equal(data.daily.sourcePeriods[1].fromDate,'1991-01-01');
 assert.equal(data.daily.sourcePeriods[1].toDate,'2001-12-31');
 const normal=data.daily.dailyTenths.filter(([d])=>d>='1991-01-01'&&d<='2020-12-31');assert.equal(normal.length,10958);assert.ok(normal.every(([,v])=>Number.isFinite(v)));
 assert.ok(Math.abs(data.monthly.filter(r=>r.month>='1991-01'&&r.month<='2020-12').reduce((s,r)=>s+r.mm,0)/30-875.4566666667)<1e-6);
 const w={TRONDHEIM_DATA:data};vm.runInNewContext(fs.readFileSync('dist/city-data.js','utf8'),{window:w,location:{search:'?city=trondheim'},URLSearchParams});assert.equal(w.RAIN_CITY.stationId,'SN68860');assert.equal(w.RECORD_DATA,data.daily);
});
test('Trondheim page and API are routed to Voll',async()=>{
 const html=await (await worker.fetch(new Request('https://example.test/?city=trondheim'),{},{})).text();
 assert.ok(html.includes('<title>Regnrytme · Trondheim</title>'));
 assert.ok(html.includes('<option value="trondheim" selected>Trondheim* · Voll</option>'));
 assert.ok(html.includes('Historiske rekorder slått i 2026 · Trondheim* (sammensatt serie)'));
 await fetchRecent('test',new Date('2026-10-30T12:00:00Z'),async(url)=>{
 assert.equal(url.searchParams.get('sources'),'SN68860');return {ok:true,json:async()=>({data:[{sourceId:'SN68860:0',referenceTime:'2026-10-29T00:00:00Z',observations:[{elementId:'sum(precipitation_amount P1D)',timeResolution:'P1D',timeOffset:'PT6H',timeSeriesId:0,unit:'mm',value:3,qualityCode:0}]}]})};},'trondheim');
});
test('composite monthly sums and rain days agree with the underlying daily measurements',()=>{
 const monthly=data.monthly;
 assert.ok(monthly.filter(r=>r.month>='1991-01'&&r.month<='2001-12').every(r=>r.source==='NOAA_GHCND_NOE00134634'));
 assert.ok(monthly.filter(r=>r.month<'1991-01'||r.month>'2001-12').every(r=>r.source==='NOAA_GHCND_NOE00111040'));
 const map=new Map(data.daily.dailyTenths);
 for(const r of monthly){const [y,m]=r.month.split('-').map(Number),days=new Date(Date.UTC(y,m,0)).getUTCDate();const values=Array.from({length:days},(_,i)=>map.get(r.month+'-'+String(i+1).padStart(2,'0')));assert.ok(values.every(v=>v!==null&&v!==undefined));assert.ok(Math.abs(values.reduce((s,v)=>s+v,0)/10-r.mm)<1e-8);assert.equal(values.filter(v=>v>=10).length,r.rainDays)}
});
