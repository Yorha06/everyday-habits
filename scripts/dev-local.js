const fs=require('node:fs');
const path=require('node:path');
const{spawn}=require('node:child_process');

const envFile=path.resolve(__dirname,'..','.env.local');
const required=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];

function loadLocalEnvironment(){
  if(!fs.existsSync(envFile))throw new Error('.env.local tidak ditemukan di root project.');
  const parsed={};
  for(const line of fs.readFileSync(envFile,'utf8').split(/\r?\n/)){
    const match=line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if(!match||!required.includes(match[1]))continue;
    let value=match[2];
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'"))){
      value=value.slice(1,-1);
    }else{
      value=value.replace(/\s+#.*$/,'').trim();
    }
    if(value)parsed[match[1]]=value;
  }
  const missing=required.filter(name=>!parsed[name]);
  if(missing.length)throw new Error(`Variabel wajib belum diisi di .env.local: ${missing.join(', ')}`);
  Object.assign(process.env,parsed);
}

try{
  loadLocalEnvironment();
}catch(error){
  console.error(error.message);
  process.exit(1);
}

const command=process.platform==='win32'?(process.env.ComSpec||'cmd.exe'):'vercel';
const args=process.platform==='win32'
  ?['/d','/c','vercel.cmd dev --local --listen 127.0.0.1:3000']
  :['dev','--local','--listen','127.0.0.1:3000'];
const child=spawn(command,args,{env:process.env,stdio:'inherit'});
child.on('error',error=>{
  console.error(`Gagal menjalankan Vercel CLI: ${error.message}`);
  process.exitCode=1;
});
child.on('exit',(code,signal)=>{
  if(signal)console.error(`Vercel CLI berhenti karena signal ${signal}.`);
  process.exitCode=code||0;
});
