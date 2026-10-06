(function(root){
'use strict';
const next=(date,n=1)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const maxRecord=items=>{if(!items.length)return null;const value=Math.max(...items.map(x=>x.value));return {value,holders:items.filter(x=>x.value===value)}};
function createRecords(monthly,source){
 const last=source.last,year=+last.slice(0,4),currentMonth=+last.slice(5,7),daily=new Map(source.dailyTenths),rows=monthly.map(r=>({...r,value:Math.round(r.mm*10)}));
 const span=(start,end)=>{let value=0,wet=0;for(let d=start;d<=end;d=next(d)){const v=daily.get(d);if(v==null)return null;value+=v;wet+=v>=10?1:0}return {value,wet,start,end}};
 const mk=(id,current,record,opts)=>({id,current,record,step:opts.unit==='mm'?1:1,...opts});
 function monthCard(month=currentMonth){
  const key=`${year}-${String(month).padStart(2,'0')}`,complete=rows.find(r=>r.month===key),partial=month===currentMonth?span(key+'-01',last):null;
  const current=complete?complete.value:partial?.value??null;
  const record=maxRecord(rows.filter(r=>+r.month.slice(0,4)<year&&+r.month.slice(5,7)===month).map(r=>({value:r.value,start:r.month+'-01',end:r.month})));
  return mk('month',current,record,{unit:'mm',title:'Våteste måned',month,period:complete?key:partial?key+'-01 / '+last:key,complete:!!complete,coverage:'Månedsserie 1890–'+(year-1),note:month>currentMonth?'Måneden er ikke målt ennå.':complete?'Ferdig måned i '+year+'.':'Måneden så langt; målinger til '+last+'.'});
 }
 const annuals=[];
 for(const y of [...new Set(rows.map(r=>+r.month.slice(0,4)))].filter(y=>y<year)){
  const a=rows.filter(r=>+r.month.slice(0,4)===y);if(a.length===12)annuals.push({value:a.reduce((s,r)=>s+r.value,0),start:y+'-01-01',end:y+'-12-31'});
 }
 let ytd=0,yearValid=true;
 for(let m=1;m<=currentMonth;m++){
  const key=`${year}-${String(m).padStart(2,'0')}`,r=rows.find(r=>r.month===key);
  if(m===currentMonth){const p=span(key+'-01',last);if(p)ytd+=p.value;else yearValid=false}
  else if(r)ytd+=r.value;else yearValid=false;
 }
 const yearDaily=span(year+'-01-01',last),previousDays=source.dailyTenths.filter(([d,v])=>d<last&&v!==null);
 const annualCard=mk('year',yearValid?ytd:null,maxRecord(annuals),{unit:'mm',title:'Våteste år',period:year+'-01-01 / '+last,coverage:'Komplette år 1890–'+(year-1),note:'Hele årsrekorden mot årets nedbør så langt.'});
 const dayCard=mk('day',daily.get(last)??null,maxRecord(previousDays.map(([d,v])=>({value:v,start:d,end:d}))),{unit:'mm',title:'Våteste døgn',period:last,coverage:'Døgnserie fra '+source.first,note:'Siste målte døgn. Et døgn starter på null; gårsdagens regn tas ikke med.'});
 function streak(wet){
  const qualifies=v=>v!==null&&(wet?v>=10:v<10);
  let current=0,start=last,unknown=false;
  for(let d=last;d>=source.first;d=next(d,-1)){const v=daily.get(d);if(v==null){unknown=true;break}if(!qualifies(v))break;current++;start=d}
  const history=[];let run=0,begin=null,prev=null;
  for(const [d,v]of source.dailyTenths){if(d>=(current?start:last))break;if(prev&&next(prev)!==d){run=0;begin=null}if(qualifies(v)){if(!run)begin=d;run++;history.push({value:run,start:begin,end:d})}else{run=0;begin=null}prev=d}
  return mk(wet?'streak':'dry',unknown?null:current,maxRecord(history),{unit:'dager',title:wet?'Regndager på rad':'Dager på rad under 1 mm',period:current?start+' / '+last:last,coverage:'Døgnserie fra '+source.first,note:unknown?'Rekkens lengde er ukjent fordi en døgnmåling mangler.':current?'Pågående rekke ved siste måling.':wet?'Regnrekken er brutt. En ny rekke starter ved neste døgn med minst 1 mm.':'Siste døgn hadde minst 1 mm. En ny tørr rekke må starte på nytt.'});
 }
 const windows=[];
 for(const [d,v]of source.dailyTenths){if(v===null||d>=last)continue;const p=span(next(d,-6),d);if(p)windows.push(p)}
 const week=span(next(last,-6),last);
 const weekCard=mk('week',week?.value??null,maxRecord(windows),{unit:'mm',title:'Våteste 7 døgn',period:next(last,-6)+' / '+last,coverage:'Døgnserie fra '+source.first,note:'De siste syv døgnene. Når et nytt døgn kommer inn, faller det eldste ut.'});
 const wetYears=[];
 for(let y=+source.first.slice(0,4);y<year;y++){const p=span(y+'-01-01',y+'-12-31');if(p)wetYears.push({...p,value:p.wet})}
 const wetCard=mk('wetDays',yearDaily?.wet??null,maxRecord(wetYears),{unit:'dager',title:'Flest regndager i året',period:year+'-01-01 / '+last,coverage:'Komplette døgnår '+(wetYears[0]?.start.slice(0,4)??'—')+'–'+(year-1),note:'Minst 1 mm per døgn. Årets antall mot et helt rekordår.'});
 const pace=[];
 for(let y=+source.first.slice(0,4);y<year;y++){const p=span(y+'-01-01',y+last.slice(4));if(p)pace.push(p)}
 const paceRecord=maxRecord(pace);
 return {last,year,currentMonth,source,monthCard,cards:[monthCard(),dayCard,annualCard,streak(true),weekCard,wetCard,streak(false)],pace:{current:yearDaily?.value??null,record:paceRecord},next};
}
root.RecordModel={createRecords,next,maxRecord};
if(typeof module!=='undefined')module.exports=root.RecordModel;
})(typeof window!=='undefined'?window:globalThis);
