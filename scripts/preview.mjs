import http from 'node:http';
import worker from '../dist/server/index.js';
http.createServer(async(req,res)=>{
 const response=await worker.fetch(new Request('http://127.0.0.1:8767'+req.url,{method:req.method}),{FROST_CLIENT_ID:process.env.FROST_CLIENT_ID},{waitUntil:p=>p.catch(()=>{})});
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}).listen(Number((process.argv.includes('--port')?process.argv[process.argv.indexOf('--port')+1]:null)||process.env.PORT||8767),process.argv.includes('--host')?process.argv[process.argv.indexOf('--host')+1]:'127.0.0.1',()=>console.log('Preview ready'));
