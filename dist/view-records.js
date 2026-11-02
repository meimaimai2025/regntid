window.Regntid.register("records",function(window,document){
'use strict';
(()=>{
 let model=window.RecordModel.createRecords(window.RAIN_DATA,window.RECORD_DATA); const months=['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
 const el=id=>document.getElementById(id),date=d=>new Date(d+'T00:00:00Z').toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
 const num=(n,unit)=>n===null?'—':(unit==='mm'?n/10:n).toLocaleString('nb-NO',{maximumFractionDigits:unit==='mm'?1:0});
 const value=(n,unit)=>num(n,unit)+(n===null?'':' '+unit);
 const holder=(r,c)=>c.id==='month'?months[c.month-1]+' '+r.start.slice(0,4):['year','wetDays'].includes(c.id)?r.start.slice(0,4):r.start===r.end?date(r.start):date(r.start)+' – '+date(r.end);
 const period=c=>c.id==='month'?months[c.month-1]+' '+model.year: c.period.includes(' / ')?c.period.split(' / ').map(date).join(' – '):date(c.period);
 function card(c){
  const available=c.current!==null&&c.record!==null,rec=c.record?.value??null,ratio=available?Math.min(100,100*c.current/rec):0;
  const ahead=available&&c.current>rec,tied=available&&c.current===rec;
  const gap=available?Math.max(0,rec-c.current):null,beat=available?Math.max(0,rec+1-c.current):null;
  const status=!available?'Mangler målinger':ahead?'Ny rekord i serien':tied?'Rekorden er tangert':c.id==='month'&&c.complete?'Måneden er avsluttet':'Rekorden å slå';
  const labels=c.record?.holders.map(r=>holder(r,c))??[];
  let extra='';
  if(c.id==='year'&&model.pace.record&&model.pace.current!==null){const p=model.pace;extra=`<p class="record-pace">Ved samme dato: ${value(p.current,'mm')} i år. Høyest ved samme dato: ${value(p.record.value,'mm')} i ${p.record.holders.map(h=>h.start.slice(0,4)).join(', ')}.</p>`}
  if(c.id==='wetDays'&&beat!==null){const remaining=Math.round((Date.parse(model.year+'-12-31T00:00:00Z')-Date.parse(model.last+'T00:00:00Z'))/86400000);extra=`<p class="record-pace">${remaining} kalenderdager gjenstår etter siste måling.${beat>remaining?' Årsrekorden kan ikke slås i år, selv om alle resterende dager får regn.':''}</p>`}
  const icon={month:'01',day:'02',year:'03',streak:'04',week:'05',wetDays:'06',dry:'07'}[c.id];
  return `<article class="record-card ${c.id==='dry'?'record-dry':''} ${ahead?'record-winner':''}" aria-labelledby="record-${c.id}-title"><div class="record-card-top"><span class="record-index">${icon}</span><span class="record-badge">${status}</span></div><h3 id="record-${c.id}-title">${c.title}${c.id==='month'?' · '+months[c.month-1]:''}</h3><div class="record-current">${value(c.current,c.unit)}</div><p class="record-period">${period(c)}</p><div class="record-meter" role="progressbar" aria-label="${c.title}: andel av historisk rekord" aria-valuemin="0" aria-valuemax="100" ${available?`aria-valuenow="${Math.round(ratio)}"`:'aria-valuetext="Mangler målinger"'}><span style="width:${ratio}%"></span></div><div class="record-target"><span>Historisk rekord</span><strong>${value(rec,c.unit)}</strong></div><p class="record-holder">${labels[0]??'Ingen komplett historisk periode'}${labels.length>1?' · delt rekord':''}</p>${labels.length>1?`<details class="record-ties"><summary>Se alle ${labels.length} rekordperioder</summary><p>${labels.join('<br>')}</p></details>`:''}<div class="record-gap">${!available?'Avstand kan ikke beregnes':ahead?'Rekorden er slått med '+value(c.current-rec,c.unit):tied?'Lik rekord – '+value(beat,c.unit)+' til ny rekord':value(gap,c.unit)+' unna tangering'}<span>${available&&!ahead&&!tied?c.id==='month'&&c.complete?'Avsluttet måned – tallet kan ikke øke.':value(beat,c.unit)+' mer for å slå rekorden.':''}</span></div><p class="record-note">${c.note.replace(/\d{4}-\d{2}-\d{2}/g,date)}</p>${extra}<p class="record-coverage">${c.coverage.replace(/\d{4}-\d{2}-\d{2}/g,date)}</p></article>`;
 }
 function render(){const chosen=+el('recordMonth').value,cards=model.cards.map(c=>c.id==='month'?model.monthCard(chosen):c);el('recordCards').innerHTML=cards.map(card).join('');
  const candidates=cards.filter(c=>c.current!==null&&c.record&&c.current>0&&c.current<c.record.value&&!(c.id==='month'&&c.complete)&&!(c.id==='wetDays'&&c.record.value+1-c.current>Math.round((Date.parse(model.year+'-12-31T00:00:00Z')-Date.parse(model.last+'T00:00:00Z'))/86400000)));candidates.sort((a,b)=>b.current/b.record.value-a.current/a.record.value);
  el('recordHighlight').textContent=candidates.length?`${candidates[0].title}: ${Math.round(candidates[0].current/candidates[0].record.value*100)} % av rekordtallet er nådd. Avstand til tangering: ${value(candidates[0].record.value-candidates[0].current,candidates[0].unit)}. Dette er fremdrift, ikke en prognose.`:'Rekordjakten starter med neste måling.';
 }
 function freshness(){
 const recent=model.source.dailyTenths.slice(-7);
 el('recentRainRows').innerHTML=recent.map(([d,v])=>`<tr><td>${date(d)}</td><td>${value(v,'mm')}</td><td>${v===null?'Mangler måling':v>=10?'Ja':'Nei'}</td></tr>`).join('');
 el('recordUpdated').textContent='Siste måledøgn: '+date(model.last)+' · MET Frost · Slutter kl. 06 UTC';
 el('recordFreshness').textContent='Målt nedbør, ikke værvarsel. Datoen gjelder døgnets slutt kl. 06 UTC (kl. 08 ved sommertid, kl. 07 ved vintertid). Måned og år inkluderer alle tilgjengelige måledøgn. Nye målinger hentes ved åpning.';
 }
 window.addEventListener('frost-updated',()=>{model=window.RecordModel.createRecords(window.RAIN_DATA,window.RECORD_DATA);freshness();render()});
 freshness();
 months.forEach((m,i)=>el('recordMonth').add(new Option(m[0].toUpperCase()+m.slice(1),i+1)));el('recordMonth').value=model.currentMonth;el('recordMonth').onchange=render;
 render();
})();

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
  $('yearBrokenTitle').textContent='Historiske rekorder slått i '+data.year+' · '+(window.RAIN_CITY?.seriesName||window.RAIN_CITY?.station||'Bergen Florida');
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

'use strict';
(()=>{
 const $=id=>document.getElementById(id),names=['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
 let type='month',key=null,expanded=false,model;
 const mm=v=>v==null?'—':(v/10).toLocaleString('nb-NO',{maximumFractionDigits:1})+' mm';
 const date=d=>new Date(d+'T00:00:00Z').toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
 const period=p=>p.start===p.end?date(p.end):date(p.start)+' – '+date(p.end);
 const label=r=>r.type==='day'?Number(r.key.slice(3))+'. '+names[+r.key.slice(0,2)-1]:r.type==='month'?names[+r.key-1]:'Uke '+r.key;
 const kind=r=>r.type==='day'?'Døgn':r.type==='month'?'Måned':'Kalenderuke';
 const holders=record=>record?.holders??[];
 const history=record=>holders(record).length?period(record.holders[0])+(record.holders.length>1?' · delt av '+record.holders.length+' perioder':''):'Ingen komplett historikk';
 const allHolders=record=>holders(record).length>1?`<details><summary>${record.holders.length>100?'Se de første 100 av '+record.holders.length+' perioder':'Se alle '+record.holders.length+' periodene'}</summary><p>${record.holders.slice(0,100).map(period).join('<br>')}</p></details>`:'';
 const status=r=>r.status==='pending'?'Pågående – ikke kåret':r.status==='broken'?'Ny tørrekord':r.status==='tied'?'Tangert tørrekord':r.status==='unavailable'?'Ikke målt / mangler data':r.status==='no-history'?'Ingen tidligere rekord':'Over tørrekorden';
 const leader=(r,title,unit='mm')=>`<article class="year-leader dry-leader"><p class="eyebrow">${title}</p><strong>${r?unit==='mm'?mm(r.value):r.value+' dager':'—'}</strong><p>${r?period(r.holders[0])+(r.holders.length>1?' · '+r.holders.length+' perioder deler plassen':''):'Ingen komplett periode'}</p>${allHolders(r)}</article>`;
 const recordCard=(title,current,record,note,unit='mm')=>`<article class="record-card record-dry"><h3>${title}</h3><div class="record-current">${current==null?'—':unit==='mm'?mm(current):current+' dager'}</div><div class="record-target"><span>Historisk rekord før ${model.year}</span><strong>${record?unit==='mm'?mm(record.value):record.value+' dager':'—'}</strong></div><p class="record-holder">${history(record)}</p>${allHolders(record)}<p class="record-note">${note}</p></article>`;
 function render(){
  model=window.DryRecordModel.createDryRecords(window.RAIN_DATA,window.RECORD_DATA);
  const list=model[type==='day'?'days':type==='month'?'months':'weeks'];
  if(!list.some(r=>r.key===key))key=type==='day'?model.last.slice(5):type==='month'?(model.leaders.month?.holders[0]?.key??model.last.slice(5,7)):String(window.CalendarRecordModel.isoWeek(model.last).week);
  const chosen=list.find(r=>r.key===key)??list[0];
  const annual=model.annual,current=annual.current?.value??null,annualRecord=annual.record;
  let annualNote='Årets nedbør til '+date(model.last)+'. ';
  if(current!=null&&annualRecord){annualNote+=annual.complete?(current<annualRecord.value?'Ny årsrekord: '+mm(annualRecord.value-current)+' tørrere enn tidligere rekord.':current===annualRecord.value?'Årsrekorden er tangert.':mm(current-annualRecord.value)+' over tørreste komplette år.'):(current>annualRecord.value?mm(current-annualRecord.value)+' over tørreste komplette år; årsrekorden kan ikke slås med de målte tallene.':mm(annualRecord.value-current)+' igjen til grensen for tørreste komplette år. Året må avsluttes før en årsrekord kan kåres.')}
  const pace=annual.pace;
  if(current!=null&&pace)annualNote+=' Tørrest ved samme dato: '+mm(pace.value)+' i '+pace.holders.map(p=>p.start.slice(0,4)).join(', ')+'. I år: '+mm(Math.abs(current-pace.value))+(current<pace.value?' mindre':current>pace.value?' mer':' i forskjell')+'.';
  const streak=model.streak,streakNote=streak.current?`${streak.current.value?'Pågående rekke: '+period(streak.current):'Siste døgn hadde minst 1 mm.'} ${streak.record?Math.max(0,streak.record.value-streak.current.value)+' dager unna tangering.':''} Under 1 mm kan inkludere litt regn.`:'Rekkens lengde er ukjent fordi en måling mangler.';
  const wet=model.wetDays,wetNote='Regndag = minst 1 mm. Årets antall til '+date(model.last)+'. Rekorden gjelder et komplett år og kåres først etter årets slutt.'+(wet.pace?' Tørrest ved samme dato: '+wet.pace.value+' regndager i '+wet.pace.holders.map(p=>p.start.slice(0,4)).join(', ')+'.':'');
  const gap=chosen.current&&chosen.record?chosen.current.value-chosen.record.value:null;
  const verdict=chosen.status==='pending'?'Perioden pågår. Foreløpig verdi sammenlignes med en hel historisk periode; ingen tørrekord kåres ennå.':gap==null?'Avstand kan ikke beregnes':gap<0?mm(-gap)+' tørrere enn tidligere rekord':gap===0?'Lik den tidligere tørrekorden':mm(gap)+' over tørrekorden. En avsluttet måling kan ikke bli tørrere.';
  const broken=[...model.broken];
  if(streak.broken)broken.push({type:'streak',key:'streak',current:streak.leader.holders[0],record:streak.record});
  if(annual.complete&&annual.current&&annualRecord&&current<annualRecord.value)broken.push({type:'year',key:'year',current:annual.current,record:annualRecord});
  if(annual.complete&&wet.current!=null&&wet.record&&wet.current<wet.record.value)broken.push({type:'wetDays',key:'wetDays',current:{...annual.current,value:wet.current},record:wet.record});
  broken.sort((a,b)=>b.current.end.localeCompare(a.current.end));
  const visible=expanded?broken:broken.slice(0,12);
  const title=r=>r.type==='streak'?'Lengste rekke under 1 mm':r.type==='year'?'Tørreste år':r.type==='wetDays'?'Færrest regndager i året':kind(r)+' · '+label(r);
  const metric=(r,value)=>['streak','wetDays'].includes(r.type)?value+' dager':mm(value);
  $('dryRecordsContent').innerHTML=`<div class="chart-heading"><h3>Årets tørreste · ${model.year}</h3><span class="small muted">Til ${date(model.last)} · avsluttede perioder</span></div><div class="year-leaders">${leader(model.leaders.day,'Tørreste måledøgn i år')}${leader(model.leaders.month,'Tørreste komplette måned i år')}${leader(model.leaders.week,'Tørreste komplette kalenderuke i år')}${leader(model.leaders.rolling,'Tørreste 7 døgn i år')}${leader(streak.leader,'Lengste rekke under 1 mm i år','dager')}</div><p class="small muted">0 mm er minst mulig nedbør. Mange dager og perioder kan derfor dele tørrekorden. Pågående måneder og uker deltar først når de er avsluttet. ISO-uker går mandag–søndag; en sjudøgnsperiode kan begynne hvilken som helst dag. En regnfattig rekke som starter i desember kan fortsette inn i årets oversikt.</p><div class="record-grid">${recordCard('Tørreste år · '+model.year+' hittil',current,annualRecord,annualNote)}${recordCard('Tørreste døgn · siste måling',model.latestDay.current,model.latestDay.record,date(model.last)+'. 0 mm er nedre grense; en rekord på 0 mm kan bare tangeres.')}${recordCard('Tørreste 7 døgn · siste periode',model.latestRolling.current?.value??null,model.latestRolling.record,(model.latestRolling.current?period(model.latestRolling.current)+'. ':'')+(model.latestRolling.current&&model.latestRolling.record?mm(Math.max(0,model.latestRolling.current.value-model.latestRolling.record.value))+' over tørrekorden. ':'')+'Rullerende syv gyldige døgn. Rekord på 0 mm kan bare tangeres.')}${recordCard('Færrest regndager i året',wet.current,wet.record,wetNote,'dager')}${recordCard('Dager på rad under 1 mm',streak.current?.value??null,streak.record,streakNote,'dager')}</div><section class="panel calendar-section dry-calendar"><p class="eyebrow">TØRREKORD FOR HVER PERIODE</p><h3>Tørreste dato, måned og uke</h3><div class="calendar-controls"><label>Type tørrekord<select id="dryCalendarType"><option value="day" ${type==='day'?'selected':''}>Kalenderdato</option><option value="month" ${type==='month'?'selected':''}>Måned</option><option value="week" ${type==='week'?'selected':''}>Kalenderuke</option></select></label><label>Periode<select id="dryCalendarPeriod">${list.map(r=>`<option value="${r.key}" ${r.key===key?'selected':''}>${label(r)}</option>`).join('')}</select></label></div><div class="calendar-comparison"><div><p class="eyebrow">${kind(chosen)} · ${label(chosen)}</p><h3>${status(chosen)}</h3><div class="calendar-figures"><div><span>${model.year}${chosen.current&&!chosen.current.complete?' hittil':''}</span><strong>${mm(chosen.current?.value??null)}</strong></div><div><span>Tørrekord før ${model.year}</span><strong>${mm(chosen.record?.value??null)}</strong></div></div><p class="small muted">${history(chosen.record)}</p>${allHolders(chosen.record)}</div><div class="calendar-verdict">${verdict}<p>${chosen.current?period(chosen.current):'Ingen komplett måling'}</p></div></div><details><summary>Se alle ${list.length} ${type==='day'?'kalenderdatoer (inkl. 29. februar)':type==='month'?'månedsrekorder':'ukerekorder'}</summary><div class="table-wrap"><table><thead><tr><th>Periode</th><th>I år</th><th>Tidligere tørrekord</th><th>Rekorden ble satt</th><th>Status</th></tr></thead><tbody>${list.map(r=>`<tr><td>${label(r)}</td><td>${mm(r.current?.value??null)}${r.current&&!r.current.complete?' · hittil':''}</td><td>${mm(r.record?.value??null)}</td><td>${history(r.record)}</td><td>${status(r)}</td></tr>`).join('')}</tbody></table></div></details></section><section class="panel year-achievements"><p class="eyebrow">ÅRETS TØRRE REKORDBOK</p><h3>Tørrekorder slått i ${model.year}</h3><p class="small muted">${broken.length?broken.length+' nye tørrekorder':'Ingen nye tørrekorder i de tilgjengelige målingene.'} · ${model.tied.length} kalenderperioder har tangert en tørrekord.</p><p class="small muted">Kun strengt lavere nedbør teller som ny tørrekord; 0 mm kan tangeres, men ikke slås. For rekker under 1 mm teller flere dager. Måned, uke og år må være ferdig målt. Manglende målinger blir aldri satt til null. Måneds- og årsrekorder bruker den valgte byens månedsserie; døgn, uker, regndager og rekker bruker byens tilgjengelige døgnserie.</p>${visible.length?`<div class="table-wrap"><table><thead><tr><th>Ny rekord</th><th>I år</th><th>Tidligere rekord</th><th>Forbedring</th></tr></thead><tbody id="dryBrokenRows">${visible.map(r=>`<tr><td><strong>${title(r)}</strong><div class="small muted">${period(r.current)}</div></td><td>${metric(r,r.current.value)}</td><td>${metric(r,r.record.value)}<div class="small muted">${history(r.record)}</div></td><td>${metric(r,Math.abs(r.record.value-r.current.value))}</td></tr>`).join('')}</tbody></table></div>`:''}${broken.length>12?`<button id="dryBrokenMore" class="text-button" type="button">${expanded?'Vis de 12 nyeste':'Vis alle '+broken.length+' tørrekorder'}</button>`:''}</section>`;
  $('dryCalendarType').onchange=()=>{type=$('dryCalendarType').value;key=null;render()};
  $('dryCalendarPeriod').onchange=()=>{key=$('dryCalendarPeriod').value;render()};
  if(broken.length>12)$('dryBrokenMore').onclick=()=>{expanded=!expanded;render()};
 }
 window.addEventListener('frost-updated',render);render();
})();

});
