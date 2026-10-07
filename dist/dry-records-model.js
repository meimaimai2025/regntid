(function(root){
'use strict';
function createDryRecords(monthly,source){
 const {minimum,maximum,next}=root.CalendarRecordModel;
 const calendar=root.CalendarRecordModel.createCalendarRecords(monthly,source,'dry');
 const {year,last,first}=calendar,daily=new Map(source.dailyTenths);
 const span=(start,end)=>{
  if(end>last)return null;
  let value=0,wet=0;
  for(let d=start;d<=end;d=next(d)){const v=daily.get(d);if(v==null)return null;value+=v;wet+=v>=10?1:0}
  return {start,end,value,wet,complete:true};
 };
 const annuals=[],priorPace=[],priorWet=[];
 for(const y of [...new Set(monthly.map(r=>+r.month.slice(0,4)))].filter(y=>y<year)){
  const rows=monthly.filter(r=>+r.month.slice(0,4)===y);
  if(rows.length===12&&rows.every(r=>Number.isFinite(r.mm)))annuals.push({start:y+'-01-01',end:y+'-12-31',value:rows.reduce((s,r)=>s+Math.round(r.mm*10),0),complete:true});
 }
 for(let y=+first.slice(0,4);y<year;y++){
  const end=y+last.slice(4);
  if(new Date(end+'T00:00:00Z').toISOString().slice(0,10)!==end)continue;
  const p=span(y+'-01-01',end);if(p)priorPace.push(p);
  const full=span(y+'-01-01',y+'-12-31');if(full)priorWet.push({...full,value:full.wet});
 }
 const current=span(year+'-01-01',last);
 const previousDays=source.dailyTenths.filter(([d,v])=>d<year+'-01-01'&&v!==null).map(([d,value])=>({start:d,end:d,value,complete:true}));
 const previousRolling=[];
 for(const d of previousDays){const p=span(next(d.end,-6),d.end);if(p)previousRolling.push(p)}
 const streaks=[];let run=0,start=null,previous=null;
 for(const [d,v]of source.dailyTenths){
  if(d>last)break;
  if(previous&&next(previous)!==d){run=0;start=null}
  if(v!==null&&v<10){if(!run)start=d;run++;streaks.push({start,end:d,value:run,complete:true})}else{run=0;start=null}
  previous=d;
 }
 let ongoing=0,ongoingStart=last,known=true;
 for(let d=last;d>=first;d=next(d,-1)){const v=daily.get(d);if(v==null){known=false;break}if(v>=10)break;ongoing++;ongoingStart=d}
 // Compare the longest run ending this year with runs completed before this year.
 const before=streaks.filter(s=>s.end<year+'-01-01'),thisYear=streaks.filter(s=>s.end>=year+'-01-01');
 const record=maximum(before),leader=maximum(thisYear);
 const streakBroken=record&&leader&&leader.value>record.value;
 return {...calendar,latestDay:{current:daily.get(last)??null,record:minimum(previousDays)},latestRolling:{current:span(next(last,-6),last),record:minimum(previousRolling)},annual:{current,record:minimum(annuals),pace:minimum(priorPace),complete:last===year+'-12-31'},wetDays:{current:current?.wet??null,record:minimum(priorWet),pace:minimum(priorPace.map(p=>({...p,value:p.wet})))},streak:{current:known?{value:ongoing,start:ongoingStart,end:last}:null,record,leader,broken:streakBroken}};
}
root.DryRecordModel={createDryRecords};
if(typeof module!=='undefined')module.exports=root.DryRecordModel;
})(typeof window!=='undefined'?window:globalThis);
