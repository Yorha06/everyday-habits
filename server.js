// Server statis tanpa dependensi. Jalankan: node server.js  (atau npm start) -> http://localhost:8080
const http=require('http'),fs=require('fs'),path=require('path');
const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.mp3':'audio/mpeg','.svg':'image/svg+xml','.png':'image/png'};
const PORT=process.env.PORT||8080;
http.createServer((req,res)=>{
  let p;try{p=decodeURIComponent(req.url.split('?')[0])}catch(e){return res.writeHead(400).end('Bad request')}
  if(p==='/admin'){res.writeHead(308,{Location:'/admin/'});return res.end()}
  let f=path.resolve(__dirname,'.'+p);
  if(f!==__dirname&&!f.startsWith(__dirname+path.sep))return res.writeHead(403).end();
  fs.stat(f,(statError,info)=>{
    if(!statError&&info.isDirectory())f=path.join(f,'index.html');
    fs.readFile(f,(e,d)=>e?res.writeHead(404).end('Not found'):(res.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'}),res.end(d)));
  });
}).listen(PORT,()=>console.log('Buka http://localhost:'+PORT));
