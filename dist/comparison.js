(()=>{
const $=id=>document.getElementById(id),model=window.CityComparison;
const cities=Object.values(window.RAIN_CITIES).filter(c=>window.RAIN_CITY_DATA[c.id]?.daily).map(c=>({...c,station:c.station+' · '+c.stationId,...window.RAIN_CITY_DATA[c.id]}));
let selected=model.defaultSelection(cities,window.RAIN_CITY.id),baseId=window.RAIN_CITY.id;
const pending=new Map(),state=new Map(),fmt=n=>Number.isFinite(n)?n.toLocaleString('nb-NO',{maximumFractionDigits:1}):'—';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const chosen=()=>model.selectedCities(cities,selected);
const choiceNodes=cities.map(c=>{
 const label=document.createElement('label');label.className='comparison-choice';
 const input=document.createElement('input');input.type='checkbox';input.value=c.id;
 const text=document.createElement('span');text.textContent=c.name+(c.id===window.RAIN_CITY.id?' · valgt by':'');
 const station=document.createElement('small');station.textContent=c.station;text.append(station);label.append(input,text);$('comparisonChoices').append(label);
 input.onchange=()=>{selected=input.checked?[...selected,c.id]:selected.filter(id=>id!==c.id);render();if(input.checked)refresh([c],false)};
 return {c,input,label};
});
function filterChoices(){const query=$('comparisonSearch').value.trim().toLocaleLowerCase('nb-NO');let count=0;for(const {c,label} of choiceNodes){label.hidden=!(c.name+' '+c.station).toLocaleLowerCase('nb-NO').includes(query);if(!label.hidden)count++}$('comparisonNoMatches').hidden=count>0}
function render(){
 const active=chosen();if(!active.some(c=>c.id===baseId))baseId=active[0]?.id||'';
 for(const {c,input} of choiceNodes)input.checked=selected.includes(c.id);
 $('comparisonSelectionCount').textContent=active.length+' av '+cities.length+' byer valgt. Bare disse byene brukes i tabellene og datagrunnlaget.';
 $('comparisonBase').innerHTML=active.map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join('');$('comparisonBase').value=baseId;$('comparisonBase').disabled=!active.length;
 const loading=active.filter(c=>pending.has(c.id)),failed=active.filter(c=>state.get(c.id)==='failed');
 $('comparisonRefresh').disabled=!active.length||loading.length>0;
 $('comparisonStatus').textContent=!active.length?'':(loading.length?'Henter MET Frost for '+loading.map(c=>c.name).join(', ')+' … ':failed.length?'Kunne ikke oppdatere '+failed.map(c=>c.name).join(', ')+'. Lagrede målinger beholdes. ':active.every(c=>state.get(c.id)==='ok')?'Oppdatert fra MET Frost. ':'Viser lagrede målinger. ')+'Siste måledato: '+active.map(c=>c.name+' '+c.daily.last).join(' · ');
 if(!active.length){$('comparisonContent').innerHTML='<div class="panel comparison-empty"><h3>Velg byer for å sammenligne</h3><p>Kryss av minst to byer, eller bruk «Tilbakestill til standardvalg».</p></div>';return}
 const r=model.compare(active),base=r.cities.find(c=>c.id===baseId);
 const rows=(group,items)=>items.map(([key,label,unit])=>{const b=base[group][key];return '<tr><th scope="row">'+label+'</th>'+r.cities.map(c=>{const v=c[group][key],delta=v-b;return '<td><strong>'+fmt(v)+(Number.isFinite(v)?' '+unit:'')+'</strong><small>'+(c.id===base.id?'Referanse':Number.isFinite(v)&&Number.isFinite(b)?(delta>0?'+':'')+fmt(delta)+' '+unit+' mot '+escape(base.name):'Utilstrekkelige data')+'</small></td>'}).join('')+'</tr>'}).join('');
 const table=(group,items)=>'<div class="table-wrap" tabindex="0" role="region" aria-label="'+(group==='current'?'Målinger i 2026':'Normalår')+' for valgte byer"><table><thead><tr><th scope="col">Mål</th>'+r.cities.map(c=>'<th scope="col">'+escape(c.name)+'<small>'+escape(c.station)+'</small></th>').join('')+'</tr></thead><tbody>'+rows(group,items)+'</tbody></table></div>';
 $('comparisonContent').innerHTML=(active.length===1?'<p class="small muted">Én by valgt. Kryss av en by til for å se forskjellene.</p>':'')+'<section class="panel"><p class="eyebrow">SAMME MÅLEDATOER · VALGTE BYER</p><h3>2026 · hittil i år</h3><p class="small muted">1. januar–'+r.end+' · '+r.days+' av '+r.expected+' datoer har målinger i alle valgte byer.'+(r.days<r.expected?' Ufullstendig dekning – tallene gjelder bare de felles målte døgnene.':' Full dekning i sammenligningsperioden.')+'</p>'+table('current',[['wet','Regndager','dager'],['dry','Tørre dager (under 1 mm)','dager'],['mm','Samlet nedbør','mm'],['zero','Helt nedbørfrie dager','dager'],['heavy','Kraftige nedbørdøgn (minst 20 mm)','dager'],['max','Våteste døgn','mm']])+'</section><section class="panel"><p class="eyebrow">ET NORMALÅR</p><h3>Årssnitt · 1991–2020</h3>'+table('normal',[['mm','Normalnedbør per år','mm'],['wet','Snitt regndager per år','dager'],['dry','Snitt tørre dager per år','dager'],['zero','Snitt helt nedbørfrie dager','dager'],['heavy','Snitt kraftige nedbørdøgn','dager']])+'<p class="small muted">Nedbør: alle 30 år kreves. Døgnsnitt: '+r.years.length+' felles komplette år'+(r.years.length?' ('+r.years.join(', ')+')':' – utilstrekkelige data')+'. År med manglende døgn utelates for de valgte byene. Perioden og snittene kan endres når du legger til eller fjerner en by.</p></section>';
}
function refreshCity(c,force){
 if(pending.has(c.id))return pending.get(c.id);
 if(!force&&state.has(c.id))return Promise.resolve();
 const task=(async()=>{
  try{const response=await fetch('/api/recent-rain?city='+encodeURIComponent(c.id),{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();if(data.station!==c.daily.station||!data.dailyTenths?.length||data.last<c.daily.last)throw Error();const map=new Map(c.daily.dailyTenths.filter(([d])=>d<data.first));for(const row of data.dailyTenths)map.set(...row);c.daily={...c.daily,...data,dailyTenths:[...map].sort((a,b)=>a[0].localeCompare(b[0]))};state.set(c.id,'ok')}
  catch{state.set(c.id,'failed')}
  finally{pending.delete(c.id);render()}
 })();pending.set(c.id,task);return task;
}
async function refresh(list=chosen(),force=true){const jobs=list.map(c=>refreshCity(c,force));render();await Promise.all(jobs)}
$('comparisonBase').onchange=()=>{baseId=$('comparisonBase').value;render()};
$('comparisonSearch').oninput=filterChoices;
$('comparisonRefresh').onclick=()=>refresh();
$('comparisonReset').onclick=()=>{selected=model.defaultSelection(cities,window.RAIN_CITY.id);baseId=window.RAIN_CITY.id;$('comparisonSearch').value='';filterChoices();render();refresh(chosen(),false)};
render();refresh(chosen(),false);
})();
