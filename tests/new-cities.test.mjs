import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import worker from '../dist/server/index.js';
import {CITY_STATIONS,fetchRecent} from '../src/frost.mjs';
const require=createRequire(import.meta.url),{createModel}=require('../dist/model.js'),comparison=require('../dist/comparison-model.js');
const expected={kristiansand:{station:'SN39040',first:'1946-01-01',name:'Kristiansand',supplements:74,normal:1385.7666666667},tromso:{station:'SN90450',first:'1920-07-01',name:'Tromsø',supplements:1,normal:1090.6033333333},bodo:{station:'SN82290',first:'1954-01-01',name:'Bodø',supplements:304,normal:1116.9933333333}};
const w={};for(const file of ['data','records-data','oslo-data','stavanger-data','trondheim-data','kristiansand-data','tromso-data','bodo-data'])vm.runInNewContext(fs.readFileSync('dist/'+file+'.js','utf8'),{window:w});
for(const [city,e]of Object.entries(expected)){
 const data=w[city.toUpperCase()+'_DATA'];
 test(city+': complete daily normal, consistent monthly sums and station-specific provenance',()=>{
  assert.equal(data.daily.station,e.station+':0');assert.equal(data.daily.first,e.first);assert.equal(data.daily.supplements.length,e.supplements);
  const normal=data.daily.dailyTenths.filter(([d])=>d>='1991-01-01'&&d<='2020-12-31');assert.equal(normal.length,10958);assert.ok(normal.every(([,v])=>Number.isFinite(v)&&v>=0));
  const months=data.monthly.filter(r=>r.month>='1991-01'&&r.month<='2020-12');assert.equal(months.length,360);assert.ok(Math.abs(months.reduce((s,r)=>s+r.mm,0)/30-e.normal)<1e-6);
  const map=new Map(data.daily.dailyTenths);
  for(const r of months){const [y,m]=r.month.split('-').map(Number),ds=new Date(Date.UTC(y,m,0)).getUTCDate(),values=Array.from({length:ds},(_,i)=>map.get(r.month+'-'+String(i+1).padStart(2,'0')));assert.ok(Math.abs(values.reduce((s,v)=>s+v,0)/10-r.mm)<1e-8);assert.equal(r.rainDays,values.filter(v=>v>=10).length)}
  assert.ok(createModel(data.monthly).annual(2025).normal>0);
  if(city==='kristiansand'){assert.ok(data.daily.supplements.every(r=>r.archive==='NOE00100570'&&r.date>='1991-01-01'&&r.date<='2020-12-31'));assert.equal(data.daily.composite,true)}
  if(city==='tromso')assert.equal(data.daily.supplements[0].date,'2007-11-12');
 });
 test(city+': page selection, comparison defaults and current-year API use the right city',async()=>{
  const window={...w};vm.runInNewContext(fs.readFileSync('dist/city-data.js','utf8'),{window,location:{search:'?city='+city},URLSearchParams});
  assert.equal(window.RAIN_CITY.stationId,e.station);assert.equal(window.RECORD_DATA.station,e.station+':0');assert.equal(window.RAIN_CITY_DATA.bergen.daily.station,'SN50540:0');
  const cities=Object.values(window.RAIN_CITIES);assert.equal(cities.length,7);assert.deepEqual(comparison.defaultSelection(cities,city),[city,'oslo','bergen','stavanger']);assert.equal(CITY_STATIONS[city],e.station);
  const html=await (await worker.fetch(new Request('https://example.test/?city='+city),{},{})).text();assert.ok(html.includes('<title>Regnrytme · '+e.name+'</title>'));assert.ok(html.includes('<option value="'+city+'" selected>'));assert.ok(html.includes('Historiske rekorder slått i 2026 · '+(city==='kristiansand'?'Kristiansand* (Kjevik, supplert med Mestad)':city==='bodo'?'Bodø* (VI, supplert med Skivika)':'Tromsø')));
  let requested=false;await fetchRecent('test',new Date('2026-10-30T12:00:00Z'),async url=>{assert.equal(url.searchParams.get('sources'),e.station);requested=true;return {ok:true,json:async()=>({data:[{sourceId:e.station+':0',referenceTime:'2026-10-29T00:00:00Z',observations:[{elementId:'sum(precipitation_amount P1D)',timeResolution:'P1D',timeOffset:'PT6H',timeSeriesId:0,unit:'mm',value:2,qualityCode:0}]}]})}},city);assert.equal(requested,true);
 });
}
test('temporary import endpoint is removed and invalid city is rejected',async()=>{assert.equal((await worker.fetch(new Request('https://example.test/api/import-audit'),{},{})).status,404);assert.equal((await worker.fetch(new Request('https://example.test/api/recent-rain?city=unknown'),{},{})).status,400)});
