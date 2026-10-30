(()=>{
const city=window.RAIN_CITY,$=id=>document.getElementById(id),other=city.id!=='bergen';
$('rainCity').querySelector('[value=bergen]').textContent='Bergen · Florida';
$('rainCity').querySelector('[value=oslo]').textContent='Oslo · Blindern';
$('rainCity').value=city.id;
$('rainCity').onchange=()=>{const url=new URL(location.href);if($('rainCity').value==='bergen')url.searchParams.delete('city');else url.searchParams.set('city',$('rainCity').value);location.href=url.href};
const month=k=>new Intl.DateTimeFormat('nb-NO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(k+'-15T12:00:00Z'));
function labels(){
 const first=window.RAIN_DATA[0].month,last=window.RAIN_DATA.at(-1).month;
 document.title='Regnrytme · '+city.name;
 $('cityStation').textContent=city.station+' · '+city.stationId+' · Månedsdata '+month(first)+'–'+month(last)+'. '+(other?'Én stasjon. Historikk fra NOAA GHCN-Daily; nye døgn hentes fra MET Frost.':'Historisk Bergen-serie; nyere målinger fra Florida.');
 document.querySelector('header>span').textContent=city.name.toUpperCase()+' / HISTORISKE MØNSTRE';
 document.querySelector('.place').textContent=city.name;
 const aside=document.querySelectorAll('.aside-bottom p');aside[0].textContent=city.coordinates;aside[1].textContent='Nedbørhistorikk fra '+first.slice(0,4)+'. Hva kommer etter regnet?';
 const download=document.querySelector('header a');download.href=city.id+'_monthly.csv';
 document.querySelector('.annual-freshness').textContent='Siste komplette måned: '+month(last)+'. Årsoversikten bruker bare komplette måneder; siste døgn vises separat.';
 document.querySelector('#history h2').textContent='Våte og tørre perioder, '+first.slice(0,4)+'–'+last.slice(0,4);
 document.querySelector('footer span').textContent=city.name+' · Månedsdata til '+month(last);
 for(const el of document.querySelectorAll('#annual>.annual-top .eyebrow,#seasons>.eyebrow,#records>.records-heading .eyebrow'))el.textContent=city.name.toUpperCase()+' · '+el.textContent.split(' · ').slice(1).join(' · ');
 document.querySelector('#latest .eyebrow').textContent=city.station.toUpperCase()+' · MET FROST';
 const note=document.querySelector('#annual .annual-heading-note + .annual-heading-note');if(note)note.textContent='Regndag = minst 1 mm per døgn, inkludert snø som vannekvivalent. Telles bare i måneder med komplette, godkjente døgnmålinger for valgt by. — betyr manglende data.';
 if(other){
  document.querySelector('meta[name="description"]').content='Nedbør, årstider, rekorder og prognoser for '+city.station;
  document.querySelector('#seasons>#seasonRecords+p').textContent='Rekorder for '+city.station+' fra '+city.firstYear+'. Bare komplette måneder og årstider inngår.';
  document.querySelector('#history>p:last-child').textContent=city.station+' ('+city.stationId+' / NOAA '+city.archive+'). Manglende eller forkastede døgn settes ikke til null.';
  document.querySelector('.annual-year-table>p:last-child').textContent='10- og 30-årssnitt krever alle tidligere år for de samme månedene. Fast normal 1991–2020 er beregnet fra stasjonens tilgjengelige målinger.';
  document.querySelector('#dryRecords>.eyebrow').textContent=city.name.toUpperCase()+' · TØRREKORDJAKTEN';
  document.querySelector('#recentRainHeading').textContent='Siste syv måledøgn · '+city.station;
 }
}
if(other){$('method').innerHTML=`<p class="eyebrow">${city.name.toUpperCase()} · DATA OG METODE</p><h2>Én stasjon: ${city.station}</h2><p>${city.stationId} · ${city.coordinates}. Serien begynner i ${city.firstYear}; den er ikke slått sammen med andre stasjoner.</p><p>Historiske døgn fra <a href="https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/${city.archive}.dly">NOAA GHCN-Daily, ${city.archive}</a>. Bare PRCP med tomt kvalitetsflagg brukes. Nye døgn hentes fra <a href="https://frost.met.no/">MET Frost</a>, hovedsensor, kl. 06 UTC og kvalitetskode 0–4. Siste lagrede døgn: ${city.snapshot}. Måneder krever alle døgn; hull fylles ikke med null.</p><p>En full normal krever 360 komplette måneder; valgt serie har ${window.RAIN_DATA.filter(r=>r.month>='1991-01'&&r.month<='2020-12').length}. Manglende normal vises som —. ${city.id==='trondheim'?'Voll-arkivet har hull, særlig i 1990-årene. Ingen andre stasjoner er brukt til å fylle hullene. ':''}${city.id==='stavanger'?'Sviland ligger i Sandnes og representerer Stavanger-området, ikke Stavanger sentrum.':''} Normalperioden er 1991–2020, beregnet her og ikke bekreftet som offisiell MET-normal. 10- og 30-årssnitt krever komplette tidligere år.</p><p>Regndag = minst 1 mm. Rekorder gjelder denne stasjonens tilgjengelige målinger. Kildene kan revideres og ha ulike tidskonvensjoner. Prognosen er eksperimentell og bruker bare valgt by.</p>`}

window.addEventListener('frost-updated',labels);labels();
})();
