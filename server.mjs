import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm','.woff2':'font/woff2','.txt':'text/plain'};
http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)&&file!==root)throw Error();const target=(await stat(file)).isDirectory()?path.join(file,'index.html'):file;res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(target));}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
