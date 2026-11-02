import {CITY_STATIONS} from '../../src/frost.mjs';
import {recentRain} from '../../src/rain-cache.mjs';
export default async function(request){
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 try{
  const city=new URL(request.url).searchParams.get('city')||'bergen';
  if(!Object.hasOwn(CITY_STATIONS,city))return Response.json({error:'Ukjent by'},{status:400});
  let cache;try{cache=await globalThis.caches?.open('rain-hourly-v1')}catch{}
  const data=await recentRain({city,clientId:Netlify.env.get('FROST_CLIENT_ID'),origin:new URL(request.url).origin,cache});
  return new Response(request.method==='HEAD'?null:JSON.stringify(data),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Netlify-CDN-Cache-Control':'public, durable, max-age='+Math.max(1,Math.floor((Date.parse(data.fetchedAt)+3600000-Date.now())/1000)),'Netlify-Vary':'query=city'}});
 }catch{
  return Response.json({error:'Nye målinger kunne ikke hentes. Viser sist lagrede målinger.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
export const config={path:'/api/recent-rain'};
