import './build.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const port=Number(process.env.PORT||5173);
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+sep))throw Error();
  const data=await readFile(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log('Danhfolio on port '+port));
