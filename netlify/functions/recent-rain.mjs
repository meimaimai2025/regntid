import {fetchRecent} from '../../src/frost.mjs';
export default async function(request){
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 try{
  const data=await fetchRecent(Netlify.env.get('FROST_CLIENT_ID'));
  return new Response(request.method==='HEAD'?null:JSON.stringify(data),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
 }catch{
  return Response.json({error:'Nye målinger kunne ikke hentes. Viser sist lagrede målinger.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
export const config={path:'/api/recent-rain'};
