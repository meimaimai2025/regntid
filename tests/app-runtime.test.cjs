const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(setImmediate);
async function ready(){for(let i=0;i<12;i++)await tick()}
function setup(){
 const listeners={},nodes=new Map(),requested=[],initCounts={},captured=[],storage=new Map(),delayed=new Map();let context,fetches=0;
 class Element{constructor(id){this.id=id;this.hidden=false;this.value='';this.textContent='';this.innerHTML='';this.classList={toggle(){}}}append(el){if(el.id)nodes.set(el.id,el)}setAttribute(){}removeAttribute(){}querySelector(){return null}contains(el){return this===el}focus(){}remove(){}}
 for(const id of ['main','city-picker','latest','annual','comparison','seasons','records','forecast','lab','history','method','sectionMenu','rainCity'])nodes.set(id,new Element(id));
 nodes.get('main').innerHTML='<h3><!--snapshot:yearBrokenTitle-->OLD CITY RECORD<!--/snapshot:yearBrokenTitle--></h3>';
 const location={href:'https://example.test/',search:'',hash:''};
 function move(value){const u=new URL(value,location.href);Object.assign(location,{href:u.href,search:u.search,hash:u.hash})}
 const history={pushState:(_a,_b,value)=>move(value)};
 const document={getElementById:id=>nodes.get(id)||null,querySelector:s=>s==='main'?nodes.get('main'):s==='.city-picker'?nodes.get('city-picker'):null,querySelectorAll:()=>[],createElement:()=>new Element(),addEventListener(){},removeEventListener(){},head:{append(el){const file=el.src.split('?')[0];requested.push(file);const run=()=>{if(file.endsWith('-data.js')){const id=file.slice(0,-8);window[id.toUpperCase()+'_DATA']={monthly:[],daily:{station:window.RAIN_CITIES[id].stationId+':0',last:'2026-11-01',dailyTenths:[]}}}else if(file.startsWith('view-')){const name=file.slice(5,-3);window.Regntid.register(name,(w,d)=>{initCounts[name]=(initCounts[name]||0)+1;captured.push({name,w,d});w.addEventListener('frost-updated',()=>{initCounts[name+'Events']=(initCounts[name+'Events']||0)+1})})}el.onload()};if(delayed.has(file))delayed.set(file,run);else queueMicrotask(run)}}};
 const window={RAIN_CITIES:{bergen:{id:'bergen',name:'Bergen',stationId:'SN50540'},oslo:{id:'oslo',name:'Oslo',stationId:'SN18700'},hamar:{id:'hamar',name:'Hamar',stationId:'SN12550'}},history,scrollTo(){},addEventListener(type,fn){(listeners[type]||=[]).push(fn)},removeEventListener(type,fn){listeners[type]=(listeners[type]||[]).filter(f=>f!==fn)}};
 const fetch=async url=>{fetches++;const id=new URL(url,location.href).searchParams.get('city');await tick();return {ok:true,json:async()=>({station:window.RAIN_CITIES[id].stationId+':0',fetchedAt:new Date().toISOString(),dailyTenths:[['2026-11-01',0]]})}};
 context=vm.createContext({window,document,location,history,URL,URLSearchParams,Date,Map,Set,Proxy,Reflect,Promise,console,fetch,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
 vm.runInContext(fs.readFileSync('dist/app-runtime.js','utf8'),context);
 const fire=type=>{for(const fn of [...listeners[type]||[]])fn({type})};
 return {window,requested,initCounts,delayed,captured,nodes,location,move,fire,get fetches(){return fetches},storage};
}
test('initial city and active view only; city revisit uses loaded archives without navigation',async()=>{
 const s=setup();await ready();assert.equal(s.window.RAIN_CITY.id,'bergen');assert.deepEqual(s.requested.filter(f=>f.endsWith('-data.js')),['bergen-data.js']);assert.equal(s.initCounts.annual,1);assert.equal(s.initCounts.forecast,undefined);
 await s.window.Regntid.switchCity('oslo');assert.equal(s.window.RAIN_CITY.id,'oslo');assert.equal(s.location.search,'?city=oslo');
 await s.window.Regntid.switchCity('bergen');assert.equal(s.window.RAIN_CITY.id,'bergen');assert.equal(s.requested.filter(f=>f==='bergen-data.js').length,1);assert.ok(!s.requested.includes('hamar-data.js'));
 s.move('#forecast');s.fire('hashchange');await ready();assert.equal(s.initCounts.forecast,1);assert.ok(s.requested.includes('forecast-model.js'));assert.equal(s.initCounts.records,undefined);
});
test('late city archive cannot replace newer selection; disposed listeners stay inactive',async()=>{
 const s=setup();await ready();const old=s.captured.find(c=>c.name==='annual');
 s.delayed.set('oslo-data.js',null);const oslo=s.window.Regntid.switchCity('oslo');await tick();await s.window.Regntid.switchCity('hamar');s.delayed.get('oslo-data.js')();await oslo;assert.equal(s.window.RAIN_CITY.id,'hamar');assert.equal(old.w.regntidActive(),false);
 const before=s.initCounts.annualEvents||0;s.fire('frost-updated');assert.equal(s.initCounts.annualEvents,before+1);
});
test('returning to mounted city cancels a pending city switch',async()=>{
 const s=setup();await ready();s.delayed.set('oslo-data.js',null);const pending=s.window.Regntid.switchCity('oslo');await tick();await s.window.Regntid.switchCity('bergen');s.delayed.get('oslo-data.js')();await pending;assert.equal(s.window.RAIN_CITY.id,'bergen');assert.equal(s.captured[0].w.regntidActive(),true);
});
test('hidden views defer updates; browser MET cache coalesces and survives city swaps',async()=>{
 const s=setup();await ready();s.move('#forecast');s.fire('hashchange');await ready();s.fire('frost-updated');assert.equal(s.initCounts.annualEvents,undefined);assert.equal(s.initCounts.forecastEvents,1);
 s.move('#annual');s.fire('hashchange');await ready();assert.equal(s.initCounts.annualEvents,1);
 const [a,b]=await Promise.all([s.window.Regntid.getRecent('bergen'),s.window.Regntid.getRecent('bergen')]);assert.equal(s.fetches,1);assert.equal(a,b);await s.window.Regntid.switchCity('oslo');await s.window.Regntid.getRecent('bergen');assert.equal(s.fetches,1);assert.ok(s.storage.has('regntid-recent-v1-bergen'));
});
test('generated Bergen archive runs independently and initial HTML has no eager city scripts',()=>{
 const window={RAIN_DATA:'unchanged',RECORD_DATA:'unchanged'};vm.runInNewContext(fs.readFileSync('dist/bergen-data.js','utf8'),{window});assert.ok(window.BERGEN_DATA.daily.dailyTenths.length>10000);assert.equal(window.RAIN_DATA,'unchanged');assert.equal(window.RECORD_DATA,'unchanged');
 const html=fs.readFileSync('dist/index.html','utf8'),scripts=[...html.matchAll(/<script[^>]*src="([^"?]+)/g)].map(m=>m[1]);assert.deepEqual(scripts,['city-registry.js','app-runtime.js']);
});
test('records stay hidden during city and view loading, then belong to the selected city',async()=>{
 const s=setup();await ready();s.move('#records');s.fire('hashchange');await ready();assert.equal(s.nodes.get('records').hidden,false);
 const first=s.captured.filter(c=>c.name==='records').at(-1);s.delayed.set('oslo-data.js',null);
 const pending=s.window.Regntid.switchCity('oslo');await tick();assert.equal(s.nodes.get('records').hidden,true);
 s.delayed.get('oslo-data.js')();await pending;assert.equal(s.nodes.get('records').hidden,false);assert.equal(s.window.RAIN_CITY.id,'oslo');assert.equal(first.w.regntidActive(),false);assert.equal(s.initCounts.records,2);
 await s.window.Regntid.switchCity('bergen');assert.equal(s.initCounts.records,3);assert.equal(s.window.RECORD_DATA.station,'SN50540:0');
});
test('a delayed records view cannot reveal stale records during a city switch',async()=>{
 const s=setup();await ready();s.delayed.set('view-records.js',null);s.move('#records');s.fire('hashchange');await ready();assert.equal(s.nodes.get('records').hidden,false);
 s.delayed.set('oslo-data.js',null);const pending=s.window.Regntid.switchCity('oslo');await tick();s.delayed.get('view-records.js')();await ready();assert.equal(s.nodes.get('records').hidden,true);
 s.delayed.get('oslo-data.js')();await pending;assert.equal(s.nodes.get('records').hidden,false);assert.equal(s.window.RAIN_CITY.id,'oslo');
});

test('city template drops old server-rendered record snapshots',async()=>{const s=setup();await ready();await s.window.Regntid.switchCity('oslo');assert.ok(!s.nodes.get('main').innerHTML.includes('OLD CITY RECORD'));});
