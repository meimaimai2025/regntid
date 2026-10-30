import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import worker from '../dist/server/index.js';
const require=createRequire(import.meta.url),{createModel}=require('../dist/model.js');
const w={};vm.runInNewContext(fs.readFileSync('dist/bodo-data.js','utf8'),{window:w});const data=w.BODO_DATA,map=new Map(data.daily.dailyTenths);
test('Bodø MET patch has measured provenance and never changes existing valid days',()=>{
 assert.equal(data.daily.supplements.length,304);
 assert.equal(data.daily.supplements.filter(r=>r.station==='SN82290:0').length,1);
 assert.equal(data.daily.supplements.filter(r=>r.station==='SN82310:0').length,303);
 for(const r of data.daily.supplements){assert.ok(r.date>='2022-01-01'&&r.date<='2023-12-31');assert.equal(r.timeOffset,'PT6H');assert.ok(Number.isInteger(r.qualityCode)&&r.qualityCode>=0&&r.qualityCode<=4);assert.equal(map.get(r.date),r.tenths);assert.ok(r.source.startsWith('https://frost.met.no/'))}
 assert.equal(map.get('2022-01-01'),1);assert.equal(map.get('2022-01-02'),10);assert.equal(map.get('2022-01-03'),0);assert.equal(map.get('2022-01-04'),0);
});
test('Bodø 2023 is complete; unresolved 2022 gap stays unknown and prevents a false 10-year mean',()=>{
 const missing=data.daily.dailyTenths.filter(([d,v])=>d>='2022-01-01'&&d<='2023-12-31'&&v===null);
 assert.equal(missing.length,208);assert.equal(missing[0][0],'2022-01-05');assert.equal(missing.at(-1)[0],'2022-07-31');
 const model=createModel(data.monthly);assert.equal(model.annual(2023).count,12);assert.equal(model.annual(2022).count,5);const rolling=model.rollingAverage(2026,0,10);assert.equal(rolling.count,9);assert.equal(rolling.average,null);
 assert.ok(Math.abs(model.reference(2021,'fixed').reduce((a,b)=>a+b,0)-1116.9933333333)<1e-6);
 const csv=fs.readFileSync('dist/bodo_monthly.csv','utf8');assert.ok(csv.includes('MET_Frost_SN82310_daily_P1D_PT6H'));
});
test('Bodø has a visible station-change note and the import route is removed',async()=>{
 const window={BODO_DATA:data};vm.runInNewContext(fs.readFileSync('dist/city-data.js','utf8'),{window,location:{search:'?city=bodo'},URLSearchParams});assert.equal(window.RAIN_CITY.displayName,'Bodø*');assert.ok(window.RAIN_CITY.compositeNote.includes('208 døgn'));assert.ok(window.RAIN_CITY.compositeNote.includes('Skivika'));
 assert.equal((await worker.fetch(new Request('https://example.test/api/import-bodo'),{},{})).status,404);
});
