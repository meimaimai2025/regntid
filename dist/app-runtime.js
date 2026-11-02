(()=>{
 'use strict';
 const VERSION='2',HOUR=3600000;
 const scripts=new Map(),factories=new Map(),initialized=new Set(),scopes=[];
 const archives=window.RAIN_CITY_DATA={},recent=new Map(),pendingRecent=new Map();
 const pageIds=['annual','comparison','seasons','records','forecast','lab','history','method'];
 const models={annual:['model.js'],comparison:['comparison-model.js'],seasons:['seasons-model.js'],records:['records-model.js','calendar-records-model.js','dry-records-model.js'],forecast:['forecast-model.js'],lab:['model.js'],history:['model.js'],method:[],core:[]};
 const template=document.querySelector('main').innerHTML;
 let cityId=null,section='annual',generation=0,navGeneration=0,citySequence=0;
 function script(file){
  if(scripts.has(file))return scripts.get(file);
  const task=new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=file+'?runtime='+VERSION;el.onload=resolve;el.onerror=()=>{el.remove();scripts.delete(file);reject(Error('Kunne ikke laste '+file))};document.head.append(el)});
  scripts.set(file,task);return task;
 }
 async function loadCity(id){
  if(!Object.hasOwn(window.RAIN_CITIES,id))throw Error('Ukjent by');
  if(!archives[id]){await script(id+'-data.js');const data=window[id.toUpperCase()+'_DATA'];if(!data?.daily||!data?.monthly)throw Error('Historikk mangler');archives[id]=data}
  return archives[id];
 }
 const fresh=data=>data&&Date.now()-Date.parse(data.fetchedAt)>=0&&Date.now()-Date.parse(data.fetchedAt)<HOUR;
 async function getRecent(id){
  if(!Object.hasOwn(window.RAIN_CITIES,id))throw Error('Ukjent by');
  let data=recent.get(id);
  if(!fresh(data)){try{data=JSON.parse(sessionStorage.getItem('regntid-recent-v1-'+id));if(fresh(data)&&data.station===window.RAIN_CITIES[id].stationId+':0')recent.set(id,data);else data=null}catch{data=null}}
  if(fresh(data))return data;
  if(pendingRecent.has(id))return pendingRecent.get(id);
  const job=(async()=>{const r=await fetch('/api/recent-rain?city='+encodeURIComponent(id),{cache:'no-store'});if(!r.ok)throw Error('MET utilgjengelig');const data=await r.json();if(data.station!==window.RAIN_CITIES[id].stationId+':0'||!data.dailyTenths?.length)throw Error('Ugyldig måling');recent.set(id,data);try{sessionStorage.setItem('regntid-recent-v1-'+id,JSON.stringify(data))}catch{}return data})();
  pendingRecent.set(id,job);try{return await job}finally{pendingRecent.delete(id)}
 }
 function scope(name){
  const ownGeneration=generation,removers=[],deferred=new Map();
  const active=()=>generation===ownGeneration;
  function listen(target,type,fn,options){
   const handler=event=>{if(!active())return;if(name!=='core'&&section!==name){deferred.set(fn,event);return}fn(event)};
   target.addEventListener(type,handler,options);removers.push(()=>target.removeEventListener(type,handler,options));
  }
  const scopedWindow=new Proxy(window,{get:(target,key)=>key==='regntidActive'?active:key==='addEventListener'?((...args)=>listen(window,...args)):typeof target[key]==='function'&&['dispatchEvent','removeEventListener'].includes(key)?target[key].bind(target):target[key],set:(target,key,value)=>{if(active())target[key]=value;return true}});
  const scopedDocument=new Proxy(document,{get:(target,key)=>key==='addEventListener'?((...args)=>listen(document,...args)):typeof target[key]==='function'?target[key].bind(target):Reflect.get(target,key,target),set:(target,key,value)=>Reflect.set(target,key,value,target)});
  const item={name,dispose:()=>removers.forEach(fn=>fn()),resume(){for(const [fn,event]of deferred)fn(event);deferred.clear()}};scopes.push(item);
  return [scopedWindow,scopedDocument];
 }
 async function init(name,expected=generation){
  if(initialized.has(name))return;
  await Promise.all((models[name]||[]).map(script));await script('view-'+name+'.js');
  if(generation!==expected||initialized.has(name)||(name!=='core'&&section!==name))return;
  const factory=factories.get(name);if(!factory)throw Error('Visning mangler');
  factory(...scope(name));initialized.add(name);
 }
 function status(text){let el=document.getElementById('appLoadStatus');if(!el){el=document.createElement('p');el.id='appLoadStatus';el.className='small muted';el.setAttribute('role','status');document.querySelector('.city-picker').append(el)}el.textContent=text;el.hidden=!text}
 function resolveSection(){let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)))}catch{}return pageIds.find(id=>{const p=document.getElementById(id);return p&&(p===target||p.contains(target))})||'annual'}
 async function showSection(scroll=false){
  const nav=++navGeneration,expected=generation;section=resolveSection();const wanted=section;
  for(const id of pageIds)document.getElementById(id).hidden=id!==wanted;
  document.getElementById('latest').hidden=wanted!=='annual';
  for(const a of document.querySelectorAll('aside nav a')){const active=a.getAttribute('href')==='#'+wanted;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  document.getElementById('sectionMenu').value=wanted;
  status('Laster visning …');
  try{await init(wanted,expected);if(nav!==navGeneration||expected!==generation)return;scopes.filter(s=>s.name===wanted).forEach(s=>s.resume());status('');if(scroll){window.scrollTo({top:0,behavior:'instant'});const h=document.getElementById(wanted).querySelector('h1,h2');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}}}
  catch(error){console.error('View initialization failed',error);if(nav===navGeneration)status('Visningen kunne ikke lastes. Velg den på nytt for å prøve igjen.')}
 }
 async function switchCity(id,push=true){
  if(!Object.hasOwn(window.RAIN_CITIES,id))id='bergen';
  if(id===cityId){++citySequence;await showSection();return}
  const expected=++citySequence;status('Laster '+window.RAIN_CITIES[id].name+' …');
  try{
   const data=await loadCity(id);if(expected!==citySequence)return;
   ++generation;const mounted=generation;
   scopes.splice(0).forEach(s=>s.dispose());initialized.clear();cityId=id;
   window.RAIN_CITY=window.RAIN_CITIES[id];window.RAIN_DATA=data.monthly;window.RECORD_DATA=data.daily;
   document.querySelector('main').innerHTML=template;
   for(const key of pageIds)document.getElementById(key).hidden=true;document.getElementById('latest').hidden=true;
   document.getElementById('sectionMenu').onchange=event=>{window.history.pushState(null,'','#'+event.target.value);showSection(true)};
   if(push){const url=new URL(location.href);if(id==='bergen')url.searchParams.delete('city');else url.searchParams.set('city',id);window.history.pushState(null,'',url)}
   await init('core',mounted);if(expected!==citySequence)return;await showSection();
  }catch(error){console.error('City initialization failed',error);if(expected===citySequence){status('Kunne ikke laste byen. Velg byen på nytt for å prøve igjen.');const select=document.getElementById('rainCity');if(select)select.onchange=()=>switchCity(select.value)}}
 }
 for(const id of pageIds)document.getElementById(id).hidden=true;document.getElementById('latest').hidden=true;
 window.Regntid={register:(name,factory)=>factories.set(name,factory),loadCity,getRecent,switchCity};
 document.addEventListener('click',event=>{
  const a=event.target.closest('a[href^="#"]');if(!a||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const hash=a.getAttribute('href');let target;try{target=document.getElementById(decodeURIComponent(hash.slice(1)))}catch{}
  if(!pageIds.some(id=>{const p=document.getElementById(id);return p&&(p===target||p.contains(target))}))return;
  event.preventDefault();if(location.hash!==hash)window.history.pushState(null,'',hash);
  showSection(true).then(()=>{if(!a.closest('nav')&&target&&target.id!==section&&target.isConnected)target.scrollIntoView({block:'start'})});
 });
 const restore=()=>switchCity(new URLSearchParams(location.search).get('city')||'bergen',false);
 window.addEventListener('popstate',restore);window.addEventListener('hashchange',()=>showSection());
 restore();
})();
