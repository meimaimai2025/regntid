import {fetchRecent,CITY_STATIONS} from './frost.mjs';
export const RAIN_CACHE_MS=60*60*1000;
// Edge storage survives isolate restarts; memory also joins simultaneous requests.
export function createRainCache(load=fetchRecent){
 const memory=new Map(),pending=new Map();
 return async function recent({city,clientId,origin,cache,now=new Date(),fetcher=fetch}){
  const station=CITY_STATIONS[city];
  if(!station)throw Error('Unknown city');
  const key=new URL('/__rain-cache/v1/'+station+'/'+now.getUTCFullYear(),origin).href;
  const fresh=data=>data?.station===station+':0'&&Array.isArray(data.dailyTenths)&&Number.isFinite(Date.parse(data.fetchedAt))&&now-Date.parse(data.fetchedAt)>=0&&now-Date.parse(data.fetchedAt)<RAIN_CACHE_MS;
  if(fresh(memory.get(key)))return memory.get(key);
  if(pending.has(key))return pending.get(key);
  const job=(async()=>{
   if(cache){try{const hit=await cache.match(key);if(hit){const data=await hit.json();if(fresh(data)){memory.set(key,data);return data}}}catch{}}
   const data=await load(clientId,now,fetcher,city);
   memory.set(key,data);
   if(cache){try{await cache.put(key,new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=3600'}}))}catch{}}
   return data;
  })();
  pending.set(key,job);
  try{return await job}finally{pending.delete(key)}
 };
}
export const recentRain=createRainCache();
