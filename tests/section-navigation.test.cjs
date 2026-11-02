const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('section navigation supports direct links, nested anchors, mobile selection and browser history',()=>{
 const handlers={},attrs=new Map(),ids=['annual','comparison','seasons','records','forecast','lab','history','method'];
 const pages=ids.map(id=>({id,hidden:false,contains:target=>id==='records'&&target?.id==='dryRecords',querySelector:()=>null}));
 const nested={id:'dryRecords',scrollIntoView(){this.scrolled=true}},latest={},select={addEventListener:(event,fn)=>handlers.mobile=fn};
 const links=ids.map(id=>({getAttribute:()=> '#'+id,classList:{toggle(){}},setAttribute:(key,value)=>attrs.set(id,value),removeAttribute:()=>attrs.delete(id)}));
 const location={hash:'#comparison'},history={pushState:(_a,_b,hash)=>location.hash=hash},window={history,scrollTo(){},addEventListener:(event,fn)=>handlers[event]=fn};
 const document={querySelectorAll:()=>links,querySelector:hash=>pages.find(p=>'#'+p.id===hash),getElementById:id=>id==='latest'?latest:id==='sectionMenu'?select:id==='dryRecords'?nested:pages.find(p=>p.id===id),addEventListener:(event,fn)=>handlers[event]=fn};
 vm.runInNewContext(fs.readFileSync('dist/section-navigation.js','utf8'),{document,window,location,history:()=>{throw Error("Legacy chart function must not handle navigation")}});
 const visible=()=>pages.filter(p=>!p.hidden).map(p=>p.id);
 assert.deepEqual(visible(),['comparison']);assert.equal(latest.hidden,true);assert.equal(select.value,'comparison');
 select.value='annual';handlers.mobile();assert.deepEqual(visible(),['annual']);assert.equal(latest.hidden,false);assert.equal(location.hash,'#annual');
 location.hash='#dryRecords';handlers.hashchange();assert.deepEqual(visible(),['records']);assert.equal(select.value,'records');
 let prevented=false;handlers.click({target:{closest:()=>links[2]},button:0,preventDefault(){prevented=true}});assert.equal(prevented,true);assert.deepEqual(visible(),['seasons']);
 location.hash='#comparison';handlers.popstate();assert.deepEqual(visible(),['comparison']);assert.equal(attrs.get('comparison'),'page');assert.equal(attrs.has('seasons'),false);
 location.hash='#unknown';handlers.hashchange();assert.deepEqual(visible(),['annual']);
});

test("chart renderer does not shadow the browser history API",()=>{const app=fs.readFileSync("dist/app.js","utf8");assert.ok(!/function history\(/.test(app));assert.ok(app.includes("function renderHistory()"));});
