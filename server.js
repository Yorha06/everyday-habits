// Server statis tanpa dependensi. Jalankan: node server.js  (atau npm start) -> http://localhost:8080
const http=require('http'),fs=require('fs'),path=require('path');
const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.svg':'image/svg+xml','.png':'image/png'};
const PORT=process.env.PORT||8080;
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
  const f=path.join(__dirname,path.normalize(p));
  if(!f.startsWith(__dirname))return res.writeHead(403).end();
  fs.readFile(f,(e,d)=>e?res.writeHead(404).end('Not found'):(res.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'}),res.end(d)));
}).listen(PORT,()=>console.log('Buka http://localhost:'+PORT));
