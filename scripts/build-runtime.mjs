import fs from 'node:fs';
import path from 'node:path';
const dist=path.resolve(import.meta.dirname,'../dist');
const read=name=>fs.readFileSync(path.join(dist,name),'utf8');
const write=(name,text)=>fs.writeFileSync(path.join(dist,name),text);
const citySource=read('city-data.js');
write('city-registry.js',citySource.slice(0,citySource.indexOf('window.RAIN_CITIES=cities;'))+'window.RAIN_CITIES=cities;\n})();\n');
write('bergen-data.js','((target)=>{const window={};\n'+read('data.js')+'\n'+read('records-data.js')+'\ntarget.BERGEN_DATA={monthly:window.RAIN_DATA,daily:window.RECORD_DATA};})(window);\n');
const groups={core:['city-ui.js','recent-days.js','frost-live.js'],annual:['annual.js'],comparison:['comparison.js'],seasons:['seasons.js'],records:['records.js','calendar-records.js','dry-records.js'],forecast:['forecast.js'],lab:['app.js'],method:[]};
for(const [name,files]of Object.entries(groups)){
 let code=files.map(read).join('\n');
 if(name==='lab')code=code.replace('choose(state.preset);renderHistory();','choose(state.preset);');
 write('view-'+name+'.js','window.Regntid.register('+JSON.stringify(name)+',function(window,document){\n'+code+'\n});\n');
}
const history=read('app.js').split('\n').find(l=>l.startsWith('function renderHistory(){'));
write('view-history.js',`window.Regntid.register('history',function(window,document){const $=id=>document.getElementById(id),M=window.RainModel;let model=M.createModel(window.RAIN_DATA);const anomaly=x=>(x>=0?'+':'−')+Math.abs(x).toFixed(0)+' %';${history}\nrenderHistory();window.addEventListener('frost-updated',()=>{model=M.createModel(window.RAIN_DATA);renderHistory()});});\n`);
let html=read('index.html');
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
html=html.replace('</head>','<script src="city-registry.js?v=1" defer></script><script src="app-runtime.js?v=1" defer></script></head>');
write('index.html',html);
