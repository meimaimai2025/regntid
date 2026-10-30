const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {create,fit}=require('../dist/forecast-model.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync('dist/data.js','utf8'),context);
const rows=Array.from(context.window.RAIN_DATA,r=>({...r}));
const options={asOf:'2026-10-20'};
test('calendar and exact data periods, seasonal amount and frozen history',()=>{
 const f=create(rows).forecast(options);
 assert.equal(f.sourceStart,'2026-04');assert.equal(f.sourceEnd,'2026-09');
 assert.equal(f.cards[0].targetStart,'2026-11');assert.equal(f.cards[1].targetStart,'2027-02');
 assert.equal(create(rows).forecast({...options,alignment:'data'}).cards[1].targetStart,'2027-01');
 for(const c of f.cards){assert.ok(Math.abs(c.prediction.months.reduce((s,r)=>s+r.predicted,0)-c.prediction.mm)<1e-8);assert.ok(c.prediction.dry>=0&&c.prediction.dry<=1);for(const r of c.backtest.rows)assert.ok(r.trainingLastTarget<=r.end);}
 const withFuture=rows.concat([{month:'2026-10',mm:99999},{month:'2027-02',mm:99999}]);
 assert.deepEqual(create(withFuture).forecast(options),f);
});
test('missing inputs fail, scenarios preserve measurements and thresholds use all outcomes',()=>{
 assert.equal(create(rows.filter(r=>r.month!=='2026-06')).forecast(options).available,false);
 const actual=create(rows).forecast(options),f=create(rows).forecast({...options,scenario:.35});
 assert.equal(f.sourceAnomaly,actual.sourceAnomaly);assert.equal(f.usedAnomaly,.35);
 for(const c of f.cards){const t=c.threshold;assert.ok(Math.abs(t.years.reduce((s,r)=>s+r.outcome,0)/t.n-t.meanAnomaly)<1e-10);}
});
test('analogue model learns both directions without forcing reversal',()=>{
 const h=Array.from({length:100},(_,i)=>({end:i,x:(i-50)/100,y:-(i-50)/100}));
 assert.ok(fit(h,.4).anomaly<0);assert.ok(fit(h,-.4).anomaly>0);
 assert.ok(fit(h.map(r=>({...r,y:.2})),.4).anomaly>0);
 assert.equal(fit([],0),null);
});
