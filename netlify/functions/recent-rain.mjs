import {fetchRecent} from '../../src/frost.mjs';
export default async function(request){
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 try{
  const city=new URL(request.url).searchParams.get('city')||'bergen';
  if(!['bergen','oslo','stavanger','trondheim'].includes(city))return Response.json({error:'Ukjent by'},{status:400});
  const data=await fetchRecent(Netlify.env.get('FROST_CLIENT_ID'),new Date(),fetch,city);
  return new Response(request.method==='HEAD'?null:JSON.stringify(data),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
 }catch{
  return Response.json({error:'Nye målinger kunne ikke hentes. Viser sist lagrede målinger.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
export const config={path:'/api/recent-rain'};
