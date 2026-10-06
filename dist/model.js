(function(root){
 'use strict';
 const MONTHS=['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des'];
 const presets={
  'summer-autumn':{start:6,length:6,gap:0,target:3,second:0,title:'Våt sommer og høst → tørr vinter',outcome:'av vintrene var tørrere enn normalt',first:'Sommer + høst',last:'Vinter'},
  'wet-through-winter':{start:6,length:6,second:3,gap:3,target:3,title:'Våt sommer, høst og vinter → tørr sommer',outcome:'av somrene var tørrere enn normalt',first:'Sommer + høst',last:'Neste sommer'},
  'winter-summer':{start:12,length:3,second:0,gap:3,target:3,title:'Våt vinter → tørr sommer',outcome:'av somrene var tørrere enn normalt',first:'Vinter',last:'Sommer'}
 };
 const index=(y,m)=>y*12+m-1;
 const date=i=>({year:Math.floor(i/12),month:i%12+1});
 const label=i=>{const d=date(i);return MONTHS[d.month-1]+' '+d.year};
 const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
 function wilson(k,n){if(!n)return [null,null];const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[c-h,c+h]}
 function createModel(rows){
  const data=new Map(rows.map(r=>[index(...r.month.split('-').map(Number)),r.mm]));
  function reference(year,type){const a=[];for(let m=1;m<=12;m++){let v=[];const low=type==='fixed'?1991:year-30,high=type==='fixed'?2020:year-1;for(let y=low;y<=high;y++){const i=index(y,m);if(i<index(1895,12))continue;if(data.has(i))v.push(data.get(i))}if(v.length<(type==='fixed'?30:20))return null;a.push(mean(v))}return a}
  function period(start,length,ref){let actual=0,normal=0;for(let i=start;i<start+length;i++){if(!data.has(i))return null;actual+=data.get(i);normal+=ref[i%12]}return {actual,normal,anomaly:100*(actual/normal-1),start,end:start+length-1}}
  function analyze(config){const c={...config};const eligible=[];for(let y=c.from;y<=2026;y++){const start=index(y,c.start),ref=reference(y,c.reference);if(!ref)continue;const first=period(start,c.length,ref),second=c.second?period(start+c.length,c.second,ref):null,targetStart=start+c.length+c.second+c.gap,target=period(targetStart,c.target,ref);if(!first||!target||(c.second&&!second))continue;const match=first.anomaly>c.threshold&&(!second||second.anomaly>c.threshold);const sequence=[];for(let i=start;i<targetStart+c.target;i++){if(!data.has(i)){sequence.length=0;break}sequence.push({label:label(i),month:i%12,value:100*(data.get(i)/ref[i%12]-1),index:i})}if(!sequence.length)continue;eligible.push({year:y,first,second,target,match,dry:target.anomaly<0,sequence})}
   const matches=eligible.filter(r=>r.match),dry=matches.filter(r=>r.dry).length,baseline=eligible.length?eligible.filter(r=>r.dry).length/eligible.length:null;
   return {config:c,eligible,matches,n:matches.length,dry,probability:matches.length?dry/matches.length:null,baseline,interval:wilson(dry,matches.length),meanOutcome:mean(matches.map(r=>r.target.anomaly)),sequence:matches.length?matches[0].sequence.map((r,i)=>({...r,label:MONTHS[r.month],value:mean(matches.map(m=>m.sequence[i].value))})):[],splits:[['Før 1991',matches.filter(r=>r.year<1991)],['Fra 1991',matches.filter(r=>r.year>=1991)]].map(([name,rs])=>({name,n:rs.length,p:rs.length?rs.filter(r=>r.dry).length/rs.length:null}))}
  }
  function history(){const ref=reference(2021,'fixed'),out=[];for(const [i]of data){const p=period(i-11,12,ref);if(p)out.push({index:i,value:p.anomaly,label:label(i)})}return out}
  const rainDays=new Map(rows.map(r=>[index(...r.month.split('-').map(Number)),r.rainDays??null]));
  function annual(year,month=0){
   const ref=reference(2021,'fixed');
   const months=Array.from({length:12},(_,i)=>({month:i+1,actual:data.get(index(year,i+1))??null,rainDays:rainDays.get(index(year,i+1))??null,normal:ref[i]}));
   const selected=months.filter(m=>(!month||m.month===month)&&m.actual!==null);
   const actual=selected.length?selected.reduce((s,m)=>s+m.actual,0):null;
   const normal=selected.length?selected.reduce((s,m)=>s+m.normal,0):null;
   const rainy=selected.length&&selected.every(m=>m.rainDays!==null)?selected.reduce((s,m)=>s+m.rainDays,0):null;
   return {year,month,months,rainDays:rainy,availableMonths:selected.map(m=>m.month),count:selected.length,actual,normal,
    difference:actual===null?null:actual-normal,percent:actual===null?null:100*(actual/normal-1),complete:selected.length===(month?1:12)};
  }
  function rollingAverage(year,month,window){
   if(![10,30].includes(window))throw Error('Window must be 10 or 30 years');
   const a=annual(year,month),start=year-window,end=year-1;
   if(!a.count)return {start,end,count:0,average:null,difference:null,percent:null};
   const totals=[];
   for(let y=start;y<=end;y++){
    const values=a.availableMonths.map(m=>data.get(index(y,m)));
    if(values.every(v=>v!==undefined))totals.push(values.reduce((s,v)=>s+v,0));
   }
   const average=totals.length===window?mean(totals):null;
   return {start,end,count:totals.length,average,difference:average===null?null:a.actual-average,
    percent:average===null||average===0?null:100*(a.actual/average-1)};
  }
  return {analyze,history,reference,period,data,annual,rollingAverage};
 }
 root.RainModel={createModel,presets,MONTHS,label,index,date,wilson};
 if(typeof module!=='undefined')module.exports=root.RainModel;
})(typeof window!=='undefined'?window:globalThis);
