export const STATION='SN50540:0';
export const ELEMENT='sum(precipitation_amount P1D)';
export const nextDate=(d,n=1)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function parseFrost(payload,now=new Date()){
 if(!Array.isArray(payload.data)||payload.nextLink)throw new Error('Incomplete Frost response');
 const values=new Map();
 for(const row of payload.data){
  if(row.sourceId!==STATION)continue;
  const date=row.referenceTime?.slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date??''))continue;
  if(Date.parse(date+'T06:00:00Z')>now.getTime())continue;
  const candidates=row.observations.filter(o=>o.elementId===ELEMENT&&o.timeResolution==='P1D'&&o.timeOffset==='PT6H'&&o.timeSeriesId===0&&o.unit==='mm');
  for(const o of candidates){
   const valid=Number.isFinite(o.value)&&Number.isInteger(o.qualityCode)&&o.qualityCode>=0&&o.qualityCode<=4&&o.value>=-1;
   const value=valid?Math.round(Math.max(0,o.value)*10):null;
   if(values.has(date)&&values.get(date)!==value)throw new Error('Conflicting daily measurements');
   values.set(date,value);
  }
 }
 const valid=[...values].filter(([,v])=>v!==null).sort();
 if(!valid.length)throw new Error('No approved measurements');
 const first=valid[0][0],last=valid.at(-1)[0],dailyTenths=[];
 for(let d=first;d<=last;d=nextDate(d))dailyTenths.push([d,values.get(d)??null]);
 return {first,last,dailyTenths,source:'https://frost.met.no/',station:STATION,timeOffset:'PT6H',fetchedAt:now.toISOString(),checkedOn:now.toISOString().slice(0,10)};
}
export async function fetchRecent(clientId,now=new Date(),fetcher=fetch){
 if(!clientId)throw new Error('Frost is not configured');
 const year=now.getUTCFullYear();
 const url=new URL('https://frost.met.no/observations/v0.jsonld');
 for(const [k,v]of Object.entries({sources:'SN50540',referencetime:`${year}-01-01/${nextDate(now.toISOString().slice(0,10))}`,elements:ELEMENT,timeoffsets:'PT6H',levels:'default',qualities:'0,1,2,3,4'}))url.searchParams.set(k,v);
 const response=await fetcher(url,{headers:{Authorization:'Basic '+btoa(clientId+':'),'User-Agent':'Regnrytme Bergen (weather observations)'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Frost is temporarily unavailable');
 const parsed=parseFrost(await response.json(),now);
 const map=new Map(parsed.dailyTenths),start=`${year}-01-01`;
 parsed.dailyTenths=[];
 for(let d=start;d<=parsed.last;d=nextDate(d))parsed.dailyTenths.push([d,map.get(d)??null]);
 parsed.first=start;
 return parsed;
}
