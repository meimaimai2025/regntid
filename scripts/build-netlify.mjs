import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const publish=path.join(root,'.netlify/publish');
fs.mkdirSync(publish,{recursive:true});
for(const name of fs.readdirSync(path.join(root,'dist'))){
 const file=path.join(root,'dist',name);
 if(fs.statSync(file).isFile()&&/\.(html|js|css|csv)$/.test(name))fs.copyFileSync(file,path.join(publish,name));
}
console.log('Netlify static assets ready.');
