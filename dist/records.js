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
