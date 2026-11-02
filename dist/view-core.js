window.Regntid.register("core",function(window,document){
(()=>{
const city=window.RAIN_CITY,$=id=>document.getElementById(id),other=city.id!=='bergen',uiName=city.displayName||city.name;
$('rainCity').querySelector('[value=bergen]').textContent='Bergen · Florida';
$('rainCity').querySelector('[value=oslo]').textContent='Oslo · Blindern';
$('rainCity').value=city.id;
$('rainCity').onchange=()=>{if(window.Regntid){window.Regntid.switchCity($('rainCity').value);return;}const url=new URL(location.href);if($('rainCity').value==='bergen')url.searchParams.delete('city');else url.searchParams.set('city',$('rainCity').value);location.href=url.href};
const month=k=>new Intl.DateTimeFormat('nb-NO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(k+'-15T12:00:00Z'));
function labels(){
 const first=window.RAIN_DATA[0].month,last=window.RAIN_DATA.at(-1).month;
 document.title='Regntid · '+uiName;
 $('cityStation').textContent=city.station+' · '+city.stationId+' · Månedsdata '+month(first)+'–'+month(last)+'. '+(city.compositeNote?city.compositeNote:other?'Én stasjon. Historikk fra NOAA GHCN-Daily; nye døgn hentes fra MET Frost.':'Historisk Bergen-serie; nyere målinger fra Florida.');
 document.querySelector('header>span').textContent=uiName.toUpperCase()+' / HISTORISKE MØNSTRE';
 document.querySelector('.place').textContent=uiName;
 const aside=document.querySelectorAll('.aside-bottom p');aside[0].textContent=city.coordinates;aside[1].textContent='Nedbørhistorikk fra '+first.slice(0,4)+'. Hva kommer etter regnet?';
 document.querySelector('.annual-freshness').textContent='Siste komplette måned: '+month(last)+'. Årsoversikten bruker bare komplette måneder; siste døgn vises separat.';
 document.querySelector('#history h2').textContent='Våte og tørre perioder, '+first.slice(0,4)+'–'+last.slice(0,4);
 document.querySelector('footer span').textContent=city.name+' · Månedsdata til '+month(last);
 for(const el of document.querySelectorAll('#annual>.annual-top .eyebrow,#seasons>.eyebrow,#records>.records-heading .eyebrow'))el.textContent=uiName.toUpperCase()+' · '+el.textContent.split(' · ').slice(1).join(' · ');
 document.querySelector('#latest .eyebrow').textContent=city.station.toUpperCase()+' · MET FROST';
 const note=document.querySelector('#annual .annual-heading-note + .annual-heading-note');if(note)note.textContent='Nedbørsdag = minst 1 mm per døgn, inkludert snø som vannekvivalent. Telles bare i måneder med komplette, godkjente døgnmålinger for valgt by. — betyr manglende data.';
 if(other){
  document.querySelector('meta[name="description"]').content='Nedbør, årstider, rekorder og prognoser for '+city.station;
  document.querySelector('#seasons>#seasonRecords+p').textContent='Rekorder for '+(city.seriesName||city.station)+' fra '+city.firstYear+'. Bare komplette måneder og årstider inngår.';
  document.querySelector('#history>p:last-child').textContent=city.compositeNote||(city.station+' ('+city.stationId+' / NOAA '+city.archive+'). Manglende eller forkastede døgn settes ikke til null.');
  document.querySelector('.annual-year-table>p:last-child').textContent='10- og 30-årssnitt krever alle tidligere år for de samme månedene. Fast normal 1991–2020 er beregnet fra måleserien.'+(city.compositeNote?' '+city.compositeNote:'');
  document.querySelector('#dryRecords>.eyebrow').textContent=uiName.toUpperCase()+' · TØRREKORDJAKTEN';
  document.querySelector('#recentRainHeading').textContent='Siste syv måledøgn · '+city.station;
 }
}
if(other){$('method').innerHTML=`<p class="eyebrow">${uiName.toUpperCase()} · DATA OG METODE</p><h2>Én stasjon: ${city.station}</h2><p>${city.stationId} · ${city.coordinates}. Serien begynner i ${city.firstYear}; den er ikke slått sammen med andre stasjoner.</p><p>Historiske døgn fra <a href="https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/${city.archive}.dly">NOAA GHCN-Daily, ${city.archive}</a>. Bare PRCP med tomt kvalitetsflagg brukes. Nye døgn hentes fra <a href="https://frost.met.no/">MET Frost</a>, hovedsensor, kl. 06 UTC og kvalitetskode 0–4. Siste lagrede døgn: ${city.snapshot}. Måneder krever alle døgn; hull fylles ikke med null.</p><p>En full normal krever 360 komplette måneder; valgt serie har ${window.RAIN_DATA.filter(r=>r.month>='1991-01'&&r.month<='2020-12').length}. Manglende normal vises som —. ${city.id==='trondheim'?'Voll-arkivet har hull, særlig i 1990-årene. Ingen andre stasjoner er brukt til å fylle hullene. ':''}${city.id==='stavanger'?'Sviland ligger i Sandnes og representerer Stavanger-området, ikke Stavanger sentrum.':''} Normalperioden er 1991–2020, beregnet her og ikke bekreftet som offisiell MET-normal. 10- og 30-årssnitt krever komplette tidligere år.</p><p>Nedbørsdag = minst 1 mm. Rekorder gjelder denne stasjonens tilgjengelige målinger. Kildene kan revideres og ha ulike tidskonvensjoner. Prognosen er eksperimentell og bruker bare valgt by.</p>`}

if(city.compositeNote){$('method').innerHTML=`<p class="eyebrow">${uiName.toUpperCase()} · DATA OG METODE</p><h2>En sammensatt måleserie for ${city.name}</h2><p>${city.compositeNote}</p><p>Normalperioden 1991–2020 har alle 10 958 døgn og 360 komplette måneder. Verdiene er beregnet direkte fra målte døgnverdier, uten å estimere eller nullfylle manglende dager. Serien er ikke homogenisert for forskjeller mellom målestedene. Stasjonsbyttene kan påvirke trender og rekorder.</p><p>Historikk: <a href="https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/${city.archive}.dly">${city.station} · NOAA ${city.archive}</a>${(city.additionalSources||[]).map(s=>' og <a href="'+(s.url||'https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/'+s.archive+'.dly')+'">'+s.name+(s.archive?' · NOAA '+s.archive:'')+'</a>').join('')}. CSV-eksporten viser kilden for hver måned. Nye målinger hentes fra <a href="https://frost.met.no/">MET Frost, ${city.station} ${city.stationId}</a>, med døgnslutt kl. 06 UTC og kvalitetskode 0–4.</p><p>Nedbørsdag er minst 1 mm, inkludert snø som vannekvivalent. Nedbørsdager, tørre dager og nedbørnormal bygger på samme sammensatte serie. Normalår i bysammenligningen bruker de felles komplette årene for de valgte byene. Prognoser er eksperimentelle.</p>`}
if(city.id==='tromso')$('method').innerHTML+='<p>Det manglende NOAA-døgnet 12. november 2007 er hentet fra MET Frost på samme stasjon (SN90450), med samme døgnslutt kl. 06 UTC. Ingen andre målesteder er brukt.</p>';
if(city.id==='bodo')$('method').innerHTML+='<p>Vi bruker historikk fra 1954 og ferske målinger fra Bodø VI ved flyplassen. Ett manglende døgn er hentet fra MET på samme stasjon, 303 døgn fra Bodø–Skivika, 208 fra Valljord og ett fra Glomfjord. Normalsammenligningen 1991–2020 er fortsatt basert bare på Bodø VI. Eldre arkivverdier før 1954 er utelatt.</p>';
window.addEventListener('frost-updated',labels);labels();
})();

'use strict';
(()=>{
 const date=d=>new Date(d+'T00:00:00Z').toLocaleDateString('nb-NO',{day:'2-digit',month:'long',timeZone:'UTC'});
 function render(){
  const data=window.RECORD_DATA,values=new Map(data.dailyTenths),cards=[];
  for(let i=0;i<3;i++){
   const d=new Date(Date.parse(data.last+'T00:00:00Z')-i*86400000).toISOString().slice(0,10),v=values.get(d);
   cards.push(`<article class="recent-day"><h3>${date(d)}</h3><strong>${v==null?'—':(v/10).toLocaleString('nb-NO',{maximumFractionDigits:1})+' mm'}</strong><p>${v==null?'Måling mangler':v>=10?'Nedbørsdag':'Under 1 mm'}</p></article>`);
  }
  document.getElementById('recentDaysCards').innerHTML=cards.join('');
  document.getElementById('recentDaysStatus').textContent='Lagrede målinger til '+date(data.last)+' '+data.last.slice(0,4)+'. Sjekker nye målinger når siden åpnes.';
 }
 window.addEventListener('frost-updated',render);render();
})();

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
   if(valid)out.push({month:key,mm:mm/10,rainDays:wet,source:'MET_Frost_'+(window.RAIN_CITY?.stationId||'SN50540')});
  }
  return out.sort((a,b)=>a.month.localeCompare(b.month));
 }
 window.applyFrostRecent=data=>{
  if(data.station!==(window.RAIN_CITY?.stationId||'SN50540')+':0')throw Error('Wrong station');
  const previous=window.RECORD_DATA;if(data.last<previous.last)throw Error('Older response');const map=new Map(previous.dailyTenths.filter(([d])=>d<data.first));
  for(const [d,v]of data.dailyTenths)map.set(d,v);
  window.RECORD_DATA={...previous,...data,first:previous.first,dailyTenths:[...map].sort((a,b)=>a[0].localeCompare(b[0]))};
  window.RAIN_DATA=monthlyFromDaily(window.RAIN_DATA,window.RECORD_DATA);
  if(window.RAIN_CITY_DATA)window.RAIN_CITY_DATA[cityId]={monthly:window.RAIN_DATA,daily:window.RECORD_DATA};
  window.dispatchEvent(new CustomEvent('frost-updated'));
 };
 const status=document.getElementById('frostStatus'),recentStatus=document.getElementById('recentDaysStatus');
 const cityId=window.RAIN_CITY?.id||'bergen';
 let loading=false;
 const setStatus=text=>{status.textContent=text;recentStatus.textContent=text};
 async function update(){
  if(loading)return;loading=true;
  setStatus('Henter siste tilgjengelige målinger …');
  try{const response=window.Regntid?{ok:true,json:()=>window.Regntid.getRecent(cityId)}:await fetch('/api/recent-rain?city='+encodeURIComponent(cityId),{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();if(!data.dailyTenths?.length||!data.last)throw Error();if((window.regntidActive&&!window.regntidActive())||(window.RAIN_CITY?.id||'bergen')!==cityId)return;window.applyFrostRecent(data);setStatus('Tilkoblet MET Frost · Sist hentet '+new Date(data.fetchedAt).toLocaleString('nb-NO',{timeZone:'Europe/Oslo'})+' · Målinger gjenbrukes i opptil én time før neste MET-henting.')}
  catch{setStatus('Nye målinger kunne ikke hentes akkurat nå. Viser lagrede målinger til '+window.RECORD_DATA.last+'. Prøv «Hent siste målinger» igjen.')}finally{loading=false}
 }
 document.getElementById('frostRefresh').onclick=update;document.getElementById('recentDaysRefresh').onclick=update;
 window.addEventListener('pageshow',event=>{if(event.persisted)update()});update();
})();

});
