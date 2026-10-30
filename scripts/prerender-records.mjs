import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
for(const city of ['bergen','oslo','stavanger']){
const elements=new Map();
const document={getElementById(id){
 if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:id==='calendarType'?'day':'',hidden:false,querySelectorAll:()=>[]});
 return elements.get(id);
}};
const window={RAIN_CITY:{station:{oslo:'Oslo–Blindern',stavanger:'Sviland (Sandnes)',bergen:'Bergen Florida'}[city]},addEventListener(){}};
const context=vm.createContext({window,document,Date,Intl});
for(const file of ['data.js','records-data.js',...(city!=='bergen'?[city+'-data.js']:[]),'calendar-records-model.js','calendar-records.js','dry-records-model.js','dry-records.js','recent-days.js']){
 vm.runInContext(fs.readFileSync(path.join(root,'dist',file),'utf8'),context);
 if(file===city+'-data.js'){const data=window[city.toUpperCase()+'_DATA'];window.RAIN_DATA=data.monthly;window.RECORD_DATA=data.daily;}
}
const filename=path.join(root,'dist/index.html');
let html=fs.readFileSync(filename,'utf8');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const [id,property] of [['yearLeaders','innerHTML'],['yearSpotlight','textContent'],['yearBrokenRows','innerHTML'],['yearBrokenCount','textContent'],['yearLeadersTitle','textContent'],['yearBrokenTitle','textContent'],['dryRecordsContent','innerHTML'],['recentDaysCards','innerHTML'],['recentDaysStatus','textContent']]){
 const start=`<!--snapshot:${id}-->`,end=`<!--/snapshot:${id}-->`;
 const value=property==='innerHTML'?elements.get(id)[property]:escape(elements.get(id)[property]);
 if(html.includes(start)){
  const a=html.indexOf(start)+start.length,b=html.indexOf(end,a);
  html=html.slice(0,a)+value+html.slice(b);
 }else{
  const pattern=new RegExp(`(<([a-z0-9]+)[^>]*id="${id}"[^>]*>)[\\s\\S]*?(</\\2>)`);
  if(!pattern.test(html))throw new Error('Missing record section: '+id);
  html=html.replace(pattern,(_m,open,_tag,close)=>open+start+value+end+close);
 }
}
if(city!=='bergen')html=html.replace('<title>Regnrytme · Bergen</title>','<title>Regnrytme · '+({oslo:'Oslo',stavanger:'Stavanger'}[city])+'</title>').replace('<option value="'+city+'">','<option value="'+city+'" selected>');
fs.writeFileSync(city!=='bergen'?path.join(root,'dist',city+'.html'):filename,html);
console.log('Saved visible record snapshot: '+document.getElementById('yearBrokenCount').textContent);

}
