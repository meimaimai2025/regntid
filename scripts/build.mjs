import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.csv':'text/csv; charset=utf-8'};
const assets={};
for(const name of fs.readdirSync(path.join(root,'dist'))){
 const filename=path.join(root,'dist',name);
 if(!fs.statSync(filename).isFile()||!types[path.extname(name)])continue;
 assets['/'+name]={type:types[path.extname(name)],body:fs.readFileSync(filename,'utf8')};
}
const server=path.join(root,'dist/server');fs.mkdirSync(server,{recursive:true});
fs.writeFileSync(path.join(server,'assets.mjs'),'export const assets='+JSON.stringify(assets)+';\n');
fs.copyFileSync(path.join(root,'src/frost.mjs'),path.join(server,'frost.mjs'));
fs.copyFileSync(path.join(root,'src/worker.mjs'),path.join(server,'index.js'));
console.log('Worker built with '+Object.keys(assets).length+' page assets.');
