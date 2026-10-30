import { assets } from './assets.mjs';
import { fetchRecent } from './frost.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  if(url.pathname==='/api/recent-rain'){
   try{
    const city=url.searchParams.get('city')||'bergen';
    if(!['bergen','oslo','stavanger'].includes(city))return json({error:'Ukjent by'},400);
    const data=await fetchRecent(env.FROST_CLIENT_ID,new Date(),fetch,city);
    return json(data);
   }catch{return json({error:'Nye målinger kunne ikke hentes. Viser sist lagrede målinger.'},503)}
  }
  const path=['/','/index.html'].includes(url.pathname)?(['oslo','stavanger'].includes(url.searchParams.get('city'))?'/'+url.searchParams.get('city')+'.html':'/index.html'):url.pathname;
  const asset=assets[path];
  if(!asset)return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
 }
};
