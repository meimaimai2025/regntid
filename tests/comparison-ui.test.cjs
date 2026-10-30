const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../dist/comparison-model.js');
function setup(current='bergen',count=4){
 class Element{constructor(){this.children=[];this.value='';this.textContent='';this.innerHTML='';this.hidden=false;this.checked=false}append(...nodes){this.children.push(...nodes)}}
 const elements=new Map(),document={createElement:()=>new Element(),getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id)}};
 const ids=['bergen','oslo','stavanger','trondheim',...Array.from({length:Math.max(0,count-4)},(_,i)=>'city'+i)],RAIN_CITIES={},RAIN_CITY_DATA={};
 for(const id of ids){RAIN_CITIES[id]={id,name:id,station:'station-'+id,stationId:'SN'+id};RAIN_CITY_DATA[id]={monthly:[],daily:{station:'SN'+id+':0',last:id==='trondheim'?'2026-01-01':'2026-01-02',dailyTenths:[['2026-01-01',10],['2026-01-02',0]]}}}
 const requests=[],w={RAIN_CITIES,RAIN_CITY_DATA,RAIN_CITY:RAIN_CITIES[current],CityComparison:model};
 const context=vm.createContext({window:w,document,fetch:async url=>{requests.push(url);return {ok:false}},URLSearchParams,Date,Intl});
 vm.runInContext(fs.readFileSync('dist/comparison.js','utf8'),context);
 const choices=()=>elements.get('comparisonChoices').children;
 const toggle=id=>{const input=choices().find(c=>c.children[0].value===id).children[0];input.checked=!input.checked;input.onchange()};
 return {elements,requests,choices,toggle};
}
const tick=()=>new Promise(setImmediate);
test('defaults deduplicate chosen city and never auto-select all 100 available cities',async()=>{
 for(const city of ['bergen','oslo','stavanger','trondheim']){const s=setup(city,100);await tick();const checked=s.choices().filter(c=>c.children[0].checked).map(c=>c.children[0].value);assert.deepEqual(checked.sort(),[...new Set([city,'bergen','oslo','stavanger'])].sort());assert.equal(s.requests.length,checked.length);assert.equal(s.elements.get('comparisonBase').value,city);assert.ok(!s.elements.get('comparisonContent').innerHTML.includes('station-city0'))}
});
test('adding/removing cities updates table, date coverage and reference dropdown together',async()=>{
 const s=setup();await tick();const html=()=>s.elements.get('comparisonContent').innerHTML;
 assert.ok(!html().includes('station-trondheim'));assert.ok(html().includes('2026-01-02'));
 s.toggle('trondheim');await tick();assert.ok(html().includes('station-trondheim'));assert.ok(html().includes('januar–2026-01-01'));assert.equal(s.requests.length,4);
 s.toggle('trondheim');assert.ok(!html().includes('station-trondheim'));assert.ok(html().includes('januar–2026-01-02'));
 s.toggle('bergen');assert.equal(s.elements.get('comparisonBase').value,'oslo');assert.ok(!s.elements.get('comparisonBase').innerHTML.includes('value="bergen"'));assert.ok(!html().includes('station-bergen'));
 await s.elements.get('comparisonRefresh').onclick();assert.deepEqual(s.requests.slice(-2).sort(),['/api/recent-rain?city=oslo','/api/recent-rain?city=stavanger']);
});
test('no cities, one city and reset have clear states; reset returns to the current city',async()=>{
 const s=setup('oslo');await tick();for(const city of ['oslo','bergen','stavanger'])s.toggle(city);
 assert.ok(s.elements.get('comparisonContent').innerHTML.includes('Velg byer'));assert.equal(s.elements.get('comparisonRefresh').disabled,true);assert.equal(s.elements.get('comparisonBase').disabled,true);
 s.toggle('trondheim');assert.ok(s.elements.get('comparisonContent').innerHTML.includes('Én by valgt'));
 s.elements.get('comparisonReset').onclick();await tick();assert.equal(s.elements.get('comparisonBase').value,'oslo');assert.equal(s.choices().filter(c=>c.children[0].checked).length,3);
});
test('search filters checkboxes without changing the selection',async()=>{
 const s=setup('bergen',100);await tick();const search=s.elements.get('comparisonSearch');search.value='trondheim';search.oninput();assert.equal(s.choices().filter(c=>!c.hidden).length,1);assert.equal(s.choices().filter(c=>c.children[0].checked).length,3);search.value='unavailable';search.oninput();assert.equal(s.elements.get('comparisonNoMatches').hidden,false);
});
test('empty model result is explicit and excluded cities do not reduce valid days',()=>{
 assert.equal(model.compare([]).days,0);
 const data=(id,last)=>({id,monthly:[],daily:{last,dailyTenths:[['2026-01-01',0],['2026-01-02',10]]}});
 const all=[data('a','2026-01-02'),data('b','2026-01-02'),data('c','2026-01-01')];
 assert.equal(model.compare(model.selectedCities(all,['a','b','a'])).days,2);assert.equal(model.compare(all).days,1);
});
