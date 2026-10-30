(function(root){
'use strict';
const definitions={spring:{name:'Vår',months:[3,4,5]},summer:{name:'Sommer',months:[6,7,8]},autumn:{name:'Høst',months:[9,10,11]},winter:{name:'Vinter',months:[12,1,2]}};
const key=(y,m)=>`${y}-${String(m).padStart(2,'0')}`;
function create(rows,asOf){
 const cutoff=asOf.slice(0,7),data=new Map(rows.filter(r=>r.month<cutoff&&r.complete!==false&&Number.isFinite(r.mm)&&r.mm>=0).map(r=>[r.month,r.mm]));
 const normals=Array.from({length:12},(_,i)=>{const a=Array.from({length:30},(_,j)=>data.get(key(1991+j,i+1)));return a.every(Number.isFinite)?a.reduce((s,n)=>s+n,0)/30:null});
 const first=Math.min(...[...data.keys()].map(k=>Number(k.slice(0,4)))),last=Number(asOf.slice(0,4));
 function season(year,type){const def=definitions[type];const months=def.months.map(m=>{const month=key(type==='winter'&&m===12?year-1:year,m);return {month,mm:data.get(month)??null,normal:normals[m-1]}});const available=months.filter(r=>r.mm!==null),complete=available.length===3;
 const normal=months.every(r=>r.normal!==null)?months.reduce((s,r)=>s+r.normal,0):null,actual=available.length?available.reduce((s,r)=>s+r.mm,0):null;
 return {year,type,months,complete,count:available.length,actual,normal,percent:complete&&normal>0?100*(actual/normal-1):null,label:type==='winter'?`${year-1}–${year}`:String(year),provisional:months.some(r=>r.month<'1896-01')};}
 function all(type){return Array.from({length:last-first+1},(_,i)=>season(last-i,type))}
 function ranked(type){return all(type).filter(r=>r.complete&&!r.provisional).sort((a,b)=>b.actual-a.actual||b.year-a.year)}
 function records(){const months=[...data].filter(([m])=>m>='1896-01').map(([month,mm])=>({month,mm})).sort((a,b)=>b.mm-a.mm);const max=months[0]?.mm;return {month:months.filter(r=>Math.abs(r.mm-max)<1e-8),seasons:Object.fromEntries(Object.keys(definitions).map(type=>{const list=ranked(type),max=list[0]?.actual;return[type,list.filter(r=>Math.abs(r.actual-max)<1e-8)]}))}}
 return {season,all,ranked,records,first,last};
}
const api={create,definitions};if(typeof module!=='undefined')module.exports=api;root.RainSeasons=api;
})(typeof window!=='undefined'?window:globalThis);
