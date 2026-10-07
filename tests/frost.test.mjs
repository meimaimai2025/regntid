import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseFrost,fetchRecent} from '../src/frost.mjs';
const row=(date,value,extra={})=>({sourceId:'SN50540:0',referenceTime:date+'T00:00:00.000Z',observations:[{elementId:'sum(precipitation_amount P1D)',value,unit:'mm',timeResolution:'P1D',timeOffset:'PT6H',timeSeriesId:0,qualityCode:0,...extra}]});
const now=new Date('2026-10-07T17:28:05Z');
const parsed=parseFrost({data:[row('2026-10-01',0),row('2026-10-03',9.9),row('2026-10-04',12,{qualityCode:7}),row('2026-10-05',-1),row('2026-10-06',1,{timeOffset:'PT0H'}),row('2026-10-07',13.2),row('2026-10-08',99)]},now);
assert.equal(parsed.last,'2026-10-07');assert.equal(parsed.dailyTenths[1][1],null);assert.equal(parsed.dailyTenths[2][1],99);assert.equal(parsed.dailyTenths[3][1],null);assert.equal(parsed.dailyTenths[4][1],0);assert.equal(parsed.dailyTenths[5][1],null);assert.equal(parsed.dailyTenths[6][1],132);
assert.throws(()=>parseFrost({data:[row('2026-10-01',1),row('2026-10-01',2)]},now),/Conflicting/);
assert.throws(()=>parseFrost({data:[],nextLink:'next'},now),/Incomplete/);
const recent=await fetchRecent('test-credential',now,async(url,options)=>{
 assert.equal(url.hostname,'frost.met.no');assert.ok(!url.href.includes('test-credential'));assert.equal(options.headers.Authorization,'Basic '+btoa('test-credential:'));
 return {ok:true,json:async()=>({data:[row('2026-10-07',13.2)]})};
});assert.equal(recent.first,'2026-01-01');assert.equal(recent.dailyTenths[0][1],null);
const snapshot=JSON.parse(fs.readFileSync(new URL('../dist/records-data.js',import.meta.url),'utf8').slice('window.RECORD_DATA='.length,-2));assert.equal(snapshot.source,'https://frost.met.no/');assert.equal(snapshot.last,'2026-10-07');
console.log('Passed Frost parsing: missing days, quality filters, trace values, sensor/offset selection, future dates, duplicates, auth and complete-year coverage.');
