(function(root){
'use strict';
const idx=(y,m)=>y*12+m-1;
const key=i=>`${Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
function wilson(k,n){if(!n)return null;const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[c-h,c+h]}
function quantile(items,p){const sorted=[...items].sort((a,b)=>a.y-b.y);let total=0;for(const r of sorted){total+=r.w;if(total>=p)return r.y}return sorted.at(-1).y}
// Fixed design: 20 nearest six-month anomalies, smooth distance weights,
// and ten effective observations of shrinkage towards seasonal history.
// Do not optimize these constants against the displayed evaluation period.
function fit(history,x){
 if(history.length<20)return null;
 const nearest=[...history].sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x)).slice(0,20);
 const width=Math.max(.10,Math.abs(nearest.at(-1).x-x));
 const raw=nearest.map(r=>Math.exp(-.5*((r.x-x)/width)**2));
 const sum=raw.reduce((s,v)=>s+v,0),effective=sum*sum/raw.reduce((s,v)=>s+v*v,0),strength=effective/(effective+10);
 const weights=new Map(nearest.map((r,i)=>[r.end,strength*raw[i]/sum]));
 const distribution=history.map(r=>({...r,w:(weights.get(r.end)||0)+(1-strength)/history.length}));
 const anomaly=distribution.reduce((s,r)=>s+r.w*r.y,0),dry=distribution.reduce((s,r)=>s+(r.y<0?r.w:0),0);
 return {anomaly,dry,low:quantile(distribution,.10),high:quantile(distribution,.90),effective,strength,
  baselineAnomaly:mean(history.map(r=>r.y)),baselineDry:mean(history.map(r=>r.y<0?1:0)),
  nearest:nearest.map((r,i)=>({...r,weight:raw[i]/sum}))};
}
function create(rows){
 const data=new Map();for(const r of rows){if(!/^\d{4}-\d{2}$/.test(r.month)||!Number.isFinite(r.mm)||r.mm<0||r.complete===false)continue;const[y,m]=r.month.split('-').map(Number);if(m<1||m>12)continue;data.set(idx(y,m),r.mm)}
 const normalCache=new Map();
 function normal(end){const year=Math.floor((end-5)/12);if(normalCache.has(year))return normalCache.get(year);const ref=[];
  for(let m=1;m<=12;m++){const values=[];for(let y=year-30;y<year;y++){const i=idx(y,m);if(i>=idx(1896,1)&&data.has(i))values.push(data.get(i))}if(values.length!==30){normalCache.set(year,null);return null}ref.push(mean(values))}
  normalCache.set(year,ref);return ref;
 }
 function total(start,n,ref){let actual=0,baseline=0;for(let i=start;i<start+n;i++){if(!data.has(i))return null;actual+=data.get(i);baseline+=ref[i%12]}return {actual,normal:baseline,anomaly:actual/baseline-1}}
 function observation(end,lead){const ref=normal(end);if(!ref)return null;const input=total(end-5,6,ref),target=total(end+lead+1,3,ref);if(!input||!target)return null;return {end,start:end-5,targetStart:end+lead+1,targetEnd:end+lead+3,x:input.anomaly,y:target.anomaly,actual:target.actual,normal:target.normal,sourceActual:input.actual}}
 function history(end,lead){const out=[];for(let e=end-12;e>=idx(1926,6);e-=12){const row=observation(e,lead);if(row&&row.targetEnd<=end)out.push(row)}return out.reverse()}
 function backtest(samples){const results=[];for(const row of samples){if(Math.floor(row.end/12)<1983)continue;const train=samples.filter(r=>r.targetEnd<=row.end);const prediction=fit(train,row.x);if(!prediction||train.length<25)continue;const baseline=row.normal*(1+prediction.baselineAnomaly),predicted=row.normal*(1+prediction.anomaly);results.push({end:key(row.end),targetEnd:key(row.targetEnd),trainingLastTarget:key(Math.max(...train.map(r=>r.targetEnd))),actual:row.actual,predicted,baseline,normal:row.normal,dry:row.y<0?1:0,pDry:prediction.dry,baselineDry:prediction.baselineDry,low:row.normal*(1+prediction.low),high:row.normal*(1+prediction.high)})}
  if(!results.length)return {n:0,rows:[]};const mae=mean(results.map(r=>Math.abs(r.predicted-r.actual))),baselineMae=mean(results.map(r=>Math.abs(r.baseline-r.actual))),normalMae=mean(results.map(r=>Math.abs(r.normal-r.actual))),brier=mean(results.map(r=>(r.pDry-r.dry)**2)),baselineBrier=mean(results.map(r=>(r.baselineDry-r.dry)**2));
  return {n:results.length,first:results[0].end,last:results.at(-1).end,mae,baselineMae,normalMae,brier,baselineBrier,skill:1-mae/baselineMae,coverage:mean(results.map(r=>r.actual>=r.low&&r.actual<=r.high?1:0)),rows:results};
 }
 function forecast({asOf,alignment='calendar',scenario=null,threshold=.35}={}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf||''))throw Error('Date required');
  if(!['calendar','data'].includes(alignment)||!Number.isFinite(threshold)||threshold<0||threshold>1)throw Error('Invalid configuration');
  if(scenario!==null&&(!Number.isFinite(scenario)||scenario<-.95||scenario>2))throw Error('Invalid anomaly');
  const [y,m]=asOf.split('-').map(Number),issue=idx(y,m),known=[...data.keys()].filter(i=>i<issue),end=Math.max(...known);
  if(!known.length)return {available:false,reason:'Ingen komplette måneder før varslingsdatoen.'};
  const ref=normal(end),input=ref&&total(end-5,6,ref);if(!input)return {available:false,reason:'Seks sammenhengende måneder og 30 tidligere normalår kreves.'};
  const anchor=alignment==='calendar'?issue+1:end+1;
  const cards=[0,3].map(wait=>{
   const targetStart=anchor+wait,lead=targetStart-end-1,samples=history(end,lead),x=scenario??input.anomaly,prediction=fit(samples,x),base=[0,1,2].map(i=>ref[(targetStart+i)%12]),normalSum=base.reduce((s,v)=>s+v,0);
   const direction=x>=0?1:-1,extreme=samples.filter(r=>direction*r.x>=threshold),opposite=extreme.filter(r=>direction*r.y<0),rawInterval=wilson(opposite.length,extreme.length);
   return {wait,lead,targetStart:key(targetStart),targetEnd:key(targetStart+2),normal:normalSum,n:samples.length,
    prediction:prediction&&{...prediction,mm:normalSum*(1+prediction.anomaly),lowMm:normalSum*(1+prediction.low),highMm:normalSum*(1+prediction.high),months:base.map((n,i)=>({month:key(targetStart+i),normal:n,predicted:n*(1+prediction.anomaly)}))},
    threshold:{value:threshold,n:extreme.length,opposite:opposite.length,probability:extreme.length?opposite.length/extreme.length:null,interval:rawInterval,meanAnomaly:mean(extreme.map(r=>r.y)),years:extreme.map(r=>({start:key(r.start),end:key(r.end),targetStart:key(r.targetStart),targetEnd:key(r.targetEnd),input:r.x,outcome:r.y}))},
    backtest:backtest(samples)};
  });
  return {available:true,asOf,alignment,sourceStart:key(end-5),sourceEnd:key(end),sourceActual:input.actual,sourceNormal:input.normal,sourceAnomaly:input.anomaly,usedAnomaly:scenario??input.anomaly,scenario:scenario!==null,normalStart:Math.floor((end-5)/12)-30,normalEnd:Math.floor((end-5)/12)-1,missingMonths:issue-end-1,cards};
 }
 return {forecast,observation,history,normal};
}
const api={create,fit,wilson};if(typeof module!=='undefined')module.exports=api;root.RainForecast=api;
})(typeof window!=='undefined'?window:globalThis);
