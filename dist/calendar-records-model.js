(function(root){
'use strict';
const next=(d,n=1)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
function isoWeek(date){const d=new Date(date+'T00:00:00Z'),day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);const year=d.getUTCFullYear();const start=new Date(Date.UTC(year,0,1));return {year,week:Math.ceil((((d-start)/86400000)+1)/7),start:next(date,1-day),end:next(date,7-day)}}
const maximum=items=>{if(!items.length)return null;const value=Math.max(...items.map(r=>r.value));return {value,holders:items.filter(r=>r.value===value)}};
function createCalendarRecords(monthly,source){
 const year=+source.last.slice(0,4),last=source.last,daily=new Map(source.dailyTenths),first=source.first;
 const span=(start,end)=>{if(end>last)return null;let value=0;for(let d=start;d<=end;d=next(d)){const v=daily.get(d);if(v==null)return null;value+=v}return {start,end,value}};
 const assess=(type,key,current,record,extra={})=>({type,key,current,record,...extra,status:current===null?'unavailable':!record?'no-history':current.value>record.value?'broken':current.value===record.value?'tied':'below'});
 const previousDates=new Map(),currentDays=[];
 for(const [d,v]of source.dailyTenths){if(v===null)continue;const item={value:v,start:d,end:d,complete:true};if(+d.slice(0,4)<year){const key=d.slice(5),group=previousDates.get(key)??[];group.push(item);previousDates.set(key,group)}else if(+d.slice(0,4)===year&&d<=last)currentDays.push(item)}
 const days=[];
 for(let d='2000-01-01';d<='2000-12-31';d=next(d)){
  const key=d.slice(5),date=year+'-'+key,real=new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date,value=daily.get(date);
  days.push(assess('day',key,real&&date<=last&&value!=null?{value,start:date,end:date,complete:true}:null,maximum(previousDates.get(key)??[]),{existsThisYear:real}));
 }
 const months=[];
 for(let m=1;m<=12;m++){
  const key=String(m).padStart(2,'0'),start=year+'-'+key+'-01',end=new Date(Date.UTC(year,m,0)).toISOString().slice(0,10);
  const current=start<=last?span(start,end<last?end:last):null;if(current)current.complete=end<=last;
  const record=maximum(monthly.filter(r=>+r.month.slice(0,4)<year&&r.month.slice(5)===key).map(r=>({value:Math.round(r.mm*10),start:r.month+'-01',end:new Date(Date.UTC(+r.month.slice(0,4),m,0)).toISOString().slice(0,10),complete:true})));
  months.push(assess('month',key,current,record));
 }
 const groups=new Map();
 for(const [d,v]of source.dailyTenths){if(v===null)continue;const w=isoWeek(d),key=w.year+'-'+w.week;if(!groups.has(key))groups.set(key,w)}
 const priorWeeks=new Map();
 for(const w of groups.values()){if(w.year>=year)continue;const period=span(w.start,w.end);if(!period)continue;const list=priorWeeks.get(w.week)??[];list.push({...period,complete:true,isoYear:w.year});priorWeeks.set(w.week,list)}
 const weeks=[],totalWeeks=isoWeek(year+'-12-28').week;
 const jan4=isoWeek(year+'-01-04').start;
 for(let week=1;week<=totalWeeks;week++){
  const start=next(jan4,(week-1)*7),end=next(start,6),current=start<=last?span(start,end<last?end:last):null;
  if(current)current.complete=end<=last;
  weeks.push(assess('week',String(week),current,maximum(priorWeeks.get(week)??[]),{start,end}));
 }
 const rolling=[];
 for(const item of currentDays){const start=next(item.end,-6);if(start<year+'-01-01')continue;const p=span(start,item.end);if(p)rolling.push({...p,complete:true})}
 const leaders={day:maximum(currentDays),month:maximum(months.filter(r=>r.current).map(r=>({...r.current,key:r.key}))),week:maximum(weeks.filter(r=>r.current).map(r=>({...r.current,key:r.key}))),rolling:maximum(rolling)};
 const broken=[...days,...months,...weeks].filter(r=>r.status==='broken').sort((a,b)=>b.current.end.localeCompare(a.current.end)||b.current.value-a.current.value);
 const tied=[...days,...months,...weeks].filter(r=>r.status==='tied'&&r.current.value>0);
 return {year,last,first,days,months,weeks,leaders,broken,tied,totalWeeks};
}
root.CalendarRecordModel={createCalendarRecords,isoWeek,next,maximum};
if(typeof module!=='undefined')module.exports=root.CalendarRecordModel;
})(typeof window!=='undefined'?window:globalThis);
