'use strict';
(()=>{
 const $=id=>document.getElementById(id),names=['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
 let data,expanded=false;
 const mm=n=>n===null?'—':(n/10).toLocaleString('nb-NO',{maximumFractionDigits:1})+' mm';
 const date=d=>new Date(d+'T00:00:00Z').toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
 const label=r=>r.type==='day'?Number(r.key.slice(3))+'. '+names[+r.key.slice(0,2)-1]:r.type==='month'?names[+r.key-1]:'uke '+r.key;
 const kind=r=>r.type==='day'?'Døgn':r.type==='month'?'Måned':'Kalenderuke';
 const period=p=>p.start===p.end?date(p.start):date(p.start)+' – '+date(p.end);
 const history=r=>r.record?r.record.holders.map(p=>r.type==='day'?date(p.end):r.type==='month'?names[+r.key-1]+' '+p.start.slice(0,4):period(p)).join(' · '):'Ingen komplett historikk';
 const status=r=>r.status==='broken'?'Ny rekord'+(!r.current.complete?' · pågående':''):r.status==='tied'?'Tangert rekord':r.status==='no-history'?'Ingen tidligere rekord':r.status==='unavailable'?r.existsThisYear===false?'Ikke skuddår':'Ikke målt / mangler data':'Under rekorden';
 function leader(type,title){const r=data.leaders[type];return `<article class="year-leader"><p class="eyebrow">${title}</p><strong>${mm(r?.value??null)}</strong><p>${r?r.holders.map(p=>type==='month'?names[+p.key-1]+' '+data.year+(p.complete?'':' · hittil'):type==='week'?'Uke '+p.key+' · '+period(p)+(p.complete?'':' · pågående'):period(p)).join('<br>'):'Ingen komplett måling'}</p></article>`}
 function rows(type){return data[type==='day'?'days':type==='month'?'months':'weeks']}
 function options(preferred){const type=$('calendarType').value,list=rows(type);$('calendarPeriod').innerHTML=list.map(r=>`<option value="${r.key}">${label(r)}</option>`).join('');$('calendarPeriod').value=list.some(r=>r.key===preferred)?preferred:type==='day'?data.last.slice(5):type==='month'?data.last.slice(5,7):String(window.CalendarRecordModel.isoWeek(data.last).week)}
 function selected(){const type=$('calendarType').value,list=rows(type),r=list.find(r=>r.key===$('calendarPeriod').value)??list[0];
  const gap=r.current&&r.record?r.record.value-r.current.value:null;
  $('calendarComparison').innerHTML=`<div><p class="eyebrow">${kind(r)} · ${label(r)}</p><h3>${status(r)}</h3><div class="calendar-figures"><div><span>${data.year}${r.current&&!r.current.complete?' hittil':''}</span><strong>${mm(r.current?.value??null)}</strong></div><div><span>Rekord før ${data.year}</span><strong>${mm(r.record?.value??null)}</strong></div></div><p class="small muted">${history(r)}</p></div><div class="calendar-verdict">${gap===null?'Avstand kan ikke beregnes':gap<0?mm(-gap)+' over tidligere rekord':gap===0?'Lik den tidligere rekorden':mm(gap)+' unna tangering'}<p>${r.current?period(r.current):'Ingen måling i '+data.year}${r.current&&!r.current.complete?'. Perioden er ikke avsluttet.':''}</p></div>`;
  $('calendarTableRows').innerHTML=list.map(x=>`<tr class="${x.status==='broken'?'calendar-broken':''}"><td><button data-key="${x.key}" type="button">${label(x)}</button></td><td>${mm(x.current?.value??null)}${x.current&&!x.current.complete?' <span class="small muted">hittil</span>':''}</td><td>${mm(x.record?.value??null)}</td><td>${history(x)}</td><td>${status(x)}</td></tr>`).join('');
  $('calendarTableRows').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('calendarPeriod').value=b.dataset.key;selected();$('calendarComparison').scrollIntoView({behavior:'smooth',block:'center'})});
  $('calendarTableSummary').textContent='Se alle '+list.length+' '+(type==='day'?'kalenderdatoer (inkl. 29. februar)':type==='month'?'månedsrekorder':'ukerekorder');
 }
 function achievements(){const list=data.broken,visible=expanded?list:list.slice(0,12);
  $('yearBrokenTitle').textContent='Historiske rekorder slått i '+data.year;
  $('yearBrokenCount').textContent=list.length?list.length+' rekorder slått · '+data.tied.length+' våte rekorder tangert':'Ingen historiske rekorder er slått i årets tilgjengelige målinger.';
  $('yearBrokenRows').innerHTML=visible.map(r=>`<tr><td><strong>${kind(r)} · ${label(r)}</strong><div class="small muted">${period(r.current)}${r.current.complete?'':' · pågående'}</div></td><td><strong>${mm(r.current.value)}</strong></td><td>${mm(r.record.value)}<div class="small muted">${history(r)}</div></td><td class="positive">+${mm(r.current.value-r.record.value)}</td></tr>`).join('');
  $('yearBrokenTable').hidden=!list.length;$('yearBrokenMore').hidden=list.length<=12;$('yearBrokenMore').textContent=expanded?'Vis de 12 nyeste':'Vis alle '+list.length+' rekorder';
 }
 function refresh(){const chosen=$('calendarPeriod').value;data=window.CalendarRecordModel.createCalendarRecords(window.RAIN_DATA,window.RECORD_DATA);
  $('yearLeadersTitle').textContent='Årets våteste · '+data.year;
  $('yearLeaders').innerHTML=leader('day','Våteste måledøgn i år')+leader('month','Våteste måned i år')+leader('week','Våteste kalenderuke i år')+leader('rolling','Våteste 7 døgn i år');
  const oct5=data.days.find(r=>r.key==='10-05');
  if(oct5.current){const best=data.leaders.day?.holders.some(h=>h.end===oct5.current.end);$('yearSpotlight').textContent='5. oktober '+data.year+': '+mm(oct5.current.value)+'. '+(oct5.status==='broken'?'Våteste 5. oktober i døgnserien fra '+data.first.slice(0,4)+', '+mm(oct5.current.value-oct5.record.value)+' over tidligere rekord. ':oct5.status==='tied'?'Tangert rekord for 5. oktober. ':'Tidligere rekord for 5. oktober: '+mm(oct5.record?.value??null)+'. ')+(best?'Også våteste måledøgn hittil i år.':'Årets våteste måledøgn: '+mm(data.leaders.day?.value??null)+'.');$('yearSpotlight').hidden=false}else{$('yearSpotlight').hidden=true}
  options(chosen);selected();achievements();
 }
 $('calendarType').onchange=()=>{options();selected()};$('calendarPeriod').onchange=selected;$('yearBrokenMore').onclick=()=>{expanded=!expanded;achievements()};
 window.addEventListener('frost-updated',refresh);refresh();
})();
