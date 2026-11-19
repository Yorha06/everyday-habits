(function(root){
  const STORAGE_KEY='eh_submission_outbox_v1';
  const ENDPOINT='/api/submit';

  function stable(value){
    if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;
    if(value&&typeof value=='object')return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  }
  function readOutbox(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      if(!Array.isArray(value))throw new Error('Format antrean submission tidak valid.');
      const safe=value.map(({fingerprint,...item})=>{const next={...item,participant_name:'Peserta anonim'};return{...next,fingerprint:stable({participant_name:next.participant_name,sessions:next.sessions})}});
      if(value.some(item=>item.participant_name!=='Peserta anonim'))localStorage.setItem(STORAGE_KEY,JSON.stringify(safe));
      return safe;
    }catch(error){
      console.error('Gagal membaca antrean submission:',error);
      throw new Error('Data submission lokal tidak dapat dibaca. Jangan hapus penyimpanan browser sebelum hasil berhasil dikirim.');
    }
  }
  function writeOutbox(items){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}
    catch(error){
      console.error('Gagal menyimpan antrean submission:',error);
      throw new Error('Hasil belum terkirim dan browser tidak dapat menyimpannya. Pastikan penyimpanan browser tersedia, lalu coba lagi.');
    }
  }
  function makeToken(){
    if(root.crypto?.randomUUID)return root.crypto.randomUUID();
    if(!root.crypto?.getRandomValues)throw new Error('Browser ini tidak mendukung token submission yang aman.');
    const bytes=root.crypto.getRandomValues(new Uint8Array(16));
    bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
    return`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  function enqueue(payload){
    payload={...payload,participant_name:'Peserta anonim'};
    const outbox=readOutbox(),token=payload.submission_token||makeToken();
    const fingerprint=stable({participant_name:payload.participant_name,sessions:payload.sessions});
    const existing=outbox.find(item=>item.submission_token===token);
    if(existing){
      if(existing.fingerprint!==fingerprint)throw new Error('Token submission ini sudah terhubung ke hasil berbeda. Hasil lokal tidak diubah.');
      return existing;
    }
    if(outbox.length>=10)throw new Error('Ada terlalu banyak hasil yang belum terkirim. Kirim hasil tertunda terlebih dahulu.');
    const item={...payload,submission_token:token,fingerprint,created_at:new Date().toISOString()};
    outbox.push(item);writeOutbox(outbox);
    return item;
  }
  function getPending(){
    return readOutbox().map(({fingerprint,...item})=>item);
  }
  async function send(token){
    const outbox=readOutbox(),item=outbox.find(entry=>entry.submission_token===token);
    if(!item)throw new Error('Submission tertunda tidak ditemukan. Hasil lokal tetap dipertahankan.');
    let response;
    try{
      response=await root.fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});
    }catch(error){
      console.error('Koneksi submission gagal:',error);
      throw new Error('Koneksi terputus. Hasil tersimpan di browser; coba kirim ulang saat internet tersedia.');
    }
    let result={};
    try{result=await response.json()}catch(error){console.error('Respons API submission tidak valid:',error)}
    if(!response.ok)throw new Error(result.error||'Server belum dapat menyimpan hasil. Hasil tetap tersimpan; silakan coba lagi.');
    if(!result.id||!result.participant_code)throw new Error('Server memberi konfirmasi yang tidak lengkap. Hasil tetap tersimpan; coba lagi.');
    writeOutbox(outbox.filter(entry=>entry.submission_token!==token));
    const{fingerprint,...payload}=item;
    return{...result,submission_token:token,participant_name:payload.participant_name};
  }
  async function submit(payload){
    const item=enqueue(payload);
    return send(item.submission_token);
  }
  root.EHSubmission={createToken:makeToken,getPending,queue:enqueue,submit,send};
})(window);
