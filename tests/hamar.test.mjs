import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import worker from '../dist/server/index.js';
import {fetchRecent} from '../src/frost.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),comparison=require('../dist/comparison-model.js');
const window={};
for(const file of ['data','records-data','oslo-data','stavanger-data','trondheim-data','kristiansand-data','tromso-data','bodo-data','hamar-data'])vm.runInNewContext(fs.readFileSync('dist/'+file+'.js','utf8'),{window});
const data=window.HAMAR_DATA,map=new Map(data.daily.dailyTenths);
test('Hamar area has complete normal and recent years, using only 24 documented Vea days',()=>{
 assert.equal(data.daily.station,'SN12550:0');assert.equal(data.daily.first,'1957-01-01');assert.equal(data.daily.supplements.length,24);
 for(const r of data.daily.supplements){assert.equal(r.archive,'NOE00133398');assert.equal(r.qualityFlag,' ');assert.equal(map.get(r.date),r.tenths);assert.ok(r.date>='1991-01-01'&&r.date<='2020-12-31')}
 const normal=data.daily.dailyTenths.filter(([d])=>d>='1991-01-01'&&d<='2020-12-31');assert.equal(normal.length,10958);assert.ok(normal.every(([,v])=>Number.isFinite(v)));
 const normalMonths=data.monthly.filter(r=>r.month>='1991-01'&&r.month<='2020-12');assert.equal(normalMonths.length,360);assert.ok(Math.abs(normalMonths.reduce((s,r)=>s+r.mm,0)/30-603.6633333333334)<1e-8);
 for(let y=2016;y<=2025;y++){const months=data.monthly.filter(r=>r.month.startsWith(y+'-'));assert.equal(months.length,12);assert.ok(months.every(r=>r.source==='NOAA_GHCND_NOE00109984'))}
 for(const r of data.monthly){const [y,m]=r.month.split('-').map(Number),days=new Date(Date.UTC(y,m,0)).getUTCDate(),values=Array.from({length:days},(_,i)=>map.get(r.month+'-'+String(i+1).padStart(2,'0')));assert.ok(values.every(v=>v!==null));assert.ok(Math.abs(values.reduce((s,v)=>s+v,0)/10-r.mm)<1e-8);assert.equal(r.rainDays,values.filter(v=>v>=10).length)}
});
test('Hamar page, registry, comparison defaults and live API consistently use Kise',async()=>{
 vm.runInNewContext(fs.readFileSync('dist/city-data.js','utf8'),{window,location:{search:'?city=hamar'},URLSearchParams});
 assert.equal(window.RAIN_CITY.name,'Hamar-området');assert.equal(window.RAIN_CITY.stationId,'SN12550');assert.equal(window.RECORD_DATA,data.daily);assert.equal(window.RAIN_CITIES.hamar.additionalSources[0].name,'Vea');
 assert.deepEqual(comparison.defaultSelection(Object.values(window.RAIN_CITIES),'hamar'),['hamar','oslo','bergen','stavanger']);
 const html=await (await worker.fetch(new Request('https://example.test/?city=hamar'),{},{})).text();assert.ok(html.includes('<title>Regntid · Hamar-området</title>'));assert.ok(html.includes('<option value="hamar" selected>'));assert.ok(html.includes('Hamar-området* (Kise, supplert med Vea)'));assert.ok(html.indexOf('hamar-data.js')<html.indexOf('city-data.js'));
 await fetchRecent('test',new Date('2026-11-02T12:00:00Z'),async url=>{assert.equal(url.searchParams.get('sources'),'SN12550');return {ok:true,json:async()=>({data:[{sourceId:'SN12550:0',referenceTime:'2026-11-01T00:00:00Z',observations:[{elementId:'sum(precipitation_amount P1D)',value:1.2,timeResolution:'P1D',timeOffset:'PT6H',timeSeriesId:0,unit:'mm',qualityCode:0}]}]})}},'hamar');
});
