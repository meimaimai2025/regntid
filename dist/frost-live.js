'use strict';
(()=>{
 const next=d=>new Date(Date.parse(d+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 function monthlyFromDaily(rows,data){
  const year=data.last.slice(0,4),map=new Map(data.dailyTenths),out=rows.filter(r=>!r.month.startsWith(year+'-'));
  for(let m=1;m<=12;m++){
   const key=year+'-'+String(m).padStart(2,'0'),end=new Date(Date.UTC(+year,m,0)).toISOString().slice(0,10);
   if(end>data.last)continue;
   let mm=0,wet=0,valid=true;
   for(let d=key+'-01';d<=end;d=next(d)){const v=map.get(d);if(v==null){valid=false;break}mm+=v;wet+=v>=10?1:0}
   if(valid)out.push({month:key,mm:mm/10,rainDays:wet,source:'MET_Frost_SN50540'});
  }
  return out.sort((a,b)=>a.month.localeCompare(b.month));
 }
 window.applyFrostRecent=data=>{
  const previous=window.RECORD_DATA;if(data.last<previous.last)throw Error('Older response');const map=new Map(previous.dailyTenths.filter(([d])=>d<data.first));
  for(const [d,v]of data.dailyTenths)map.set(d,v);
  window.RECORD_DATA={...previous,...data,first:previous.first,dailyTenths:[...map].sort((a,b)=>a[0].localeCompare(b[0]))};
  window.RAIN_DATA=monthlyFromDaily(window.RAIN_DATA,window.RECORD_DATA);
  window.dispatchEvent(new CustomEvent('frost-updated'));
 };
 const status=document.getElementById('frostStatus'),recentStatus=document.getElementById('recentDaysStatus');
 let loading=false;
 const setStatus=text=>{status.textContent=text;recentStatus.textContent=text};
 async function update(){
  if(loading)return;loading=true;
  setStatus('Henter ferske målinger fra Meteorologisk institutt …');
  try{const response=await fetch('/api/recent-rain',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();if(!data.dailyTenths?.length||!data.last)throw Error();window.applyFrostRecent(data);setStatus('Tilkoblet MET Frost · Sist hentet '+new Date(data.fetchedAt).toLocaleString('nb-NO',{timeZone:'Europe/Oslo'})+' · Nye målinger hentes hver gang siden åpnes.')}
  catch{setStatus('Nye målinger kunne ikke hentes akkurat nå. Viser lagrede Frost-målinger til '+window.RECORD_DATA.last+'. Prøv «Hent siste målinger» igjen.')}finally{loading=false}
 }
 document.getElementById('frostRefresh').onclick=update;document.getElementById('recentDaysRefresh').onclick=update;
 window.addEventListener('pageshow',event=>{if(event.persisted)update()});update();
})();
