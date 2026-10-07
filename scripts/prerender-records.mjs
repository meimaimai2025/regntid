import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const elements=new Map();
const document={getElementById(id){
 if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:id==='calendarType'?'day':'',hidden:false,querySelectorAll:()=>[]});
 return elements.get(id);
}};
const window={addEventListener(){}};
const context=vm.createContext({window,document,Date,Intl});
for(const file of ['data.js','records-data.js','calendar-records-model.js','calendar-records.js']){
 vm.runInContext(fs.readFileSync(path.join(root,'dist',file),'utf8'),context);
}
const filename=path.join(root,'dist/index.html');
let html=fs.readFileSync(filename,'utf8');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const [id,property] of [['yearLeaders','innerHTML'],['yearSpotlight','textContent'],['yearBrokenRows','innerHTML'],['yearBrokenCount','textContent'],['yearLeadersTitle','textContent'],['yearBrokenTitle','textContent']]){
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
fs.writeFileSync(filename,html);
console.log('Saved visible record snapshot: '+document.getElementById('yearBrokenCount').textContent);
