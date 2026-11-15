const crypto=require('node:crypto');
const{BANK}=require('../questions.js');
const Scoring=require('../js/scoring.js');

const MAX_BODY_BYTES=64*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_SPECS=[
  {session_key:'practice',session_number:1,questions:BANK.filter(question=>question.type!='pair')},
  {session_key:'assessment',session_number:2,questions:BANK.filter(question=>question.type=='pair')}
];

class ValidationError extends Error{
  constructor(message){super(message);this.name='ValidationError';this.statusCode=400}
}

function isRecord(value){
  return value!==null&&typeof value=='object'&&!Array.isArray(value);
}
function requireRecord(value,message){
  if(!isRecord(value))throw new ValidationError(message);
}
function requireText(value,label,maxLength){
  if(typeof value!='string'||![...value].length||[...value].length>maxLength||/[\u0000-\u001f\u007f]/.test(value)){
    throw new ValidationError(`${label} tidak valid.`);
  }
  return value;
}
function validateWords(text,allowed,label){
  requireText(text,label,500);
  const words=text.trim().split(/\s+/);
  if(words.length>allowed.length)throw new ValidationError(`${label} berisi terlalu banyak kata.`);
  const remaining=new Map();
  allowed.forEach(word=>remaining.set(Scoring.normalize(word), (remaining.get(Scoring.normalize(word))||0)+1));
  for(const word of words){
    const normalized=Scoring.normalize(word),count=remaining.get(normalized)||0;
    if(!normalized||!count)throw new ValidationError(`${label} berisi kata yang tidak tersedia.`);
    remaining.set(normalized,count-1);
  }
}
function validateAnswer(question,answer){
  requireRecord(answer,`Jawaban ${question.n} tidak valid.`);
  if(question.type=='mcq'){
    if(typeof answer.selected!='string'||!question.o.includes(answer.selected))throw new ValidationError(`Pilihan jawaban ${question.n} tidak valid.`);
  }else if(question.type=='fill'){
    requireText(answer.text,`Jawaban ${question.n}`,100);
  }else if(question.type=='order'){
    if(!Array.isArray(answer.words)||!answer.words.length)throw new ValidationError(`Susunan kata ${question.n} tidak valid.`);
    validateWords(answer.words.join(' '),question.w,`Susunan kata ${question.n}`);
  }else if(question.type=='match'){
    if(!Array.isArray(answer.matches)||answer.matches.length!==question.p.length||answer.matches.some(value=>typeof value!='string'||!question.p.some(pair=>pair[1]===value))){
      throw new ValidationError(`Pasangan jawaban ${question.n} tidak valid.`);
    }
  }else if(question.type=='speak'){
    requireText(answer.transcript,`Transkrip ${question.n}`,200);
    if(!Array.isArray(answer.alternatives)||answer.alternatives.length<1||answer.alternatives.length>3){
      throw new ValidationError(`Pilihan transkrip ${question.n} tidak valid.`);
    }
    answer.alternatives.forEach(value=>requireText(value,`Transkrip ${question.n}`,200));
    if(answer.alternatives[0]!==answer.transcript)throw new ValidationError(`Transkrip ${question.n} tidak cocok dengan jawaban utama.`);
  }else if(question.type=='pair'){
    validateWords(answer.question,question.qw,`Pertanyaan ${question.n}`);
    validateWords(answer.answer,question.aw,`Jawaban ${question.n}`);
  }else{
    throw new ValidationError(`Jenis soal ${question.n} tidak didukung.`);
  }
}
function questionAnswers(session,spec){
  if(!Array.isArray(session.answers)||session.answers.length!==spec.questions.length){
    throw new ValidationError(`Sesi ${spec.session_key} belum lengkap.`);
  }
  const byKey=new Map();
  for(const entry of session.answers){
    requireRecord(entry,'Format jawaban tidak valid.');
    if(typeof entry.question_key!='string'||byKey.has(entry.question_key))throw new ValidationError('Ada identitas soal yang kosong atau duplikat.');
    byKey.set(entry.question_key,entry);
  }
  const validated=[];
  for(const baseQuestion of spec.questions){
    const candidates=[baseQuestion,baseQuestion.fb].filter(Boolean);
    const selected=candidates.filter(question=>byKey.has(question.n));
    if(selected.length!==1)throw new ValidationError(`Semua soal wajib pada sesi ${spec.session_key} harus dijawab tepat satu kali.`);
    const question=selected[0],entry=byKey.get(question.n);
    validateAnswer(question,entry.answer);
    validated.push({question,answer:entry.answer});
  }
  return validated;
}
function validateSubmission(body){
  requireRecord(body,'Format submission tidak valid.');
  if(typeof body.submission_token!='string'||!UUID.test(body.submission_token))throw new ValidationError('Token submission tidak valid.');
  if(typeof body.participant_name!='string')throw new ValidationError('Nama peserta wajib diisi.');
  const participantName=body.participant_name.trim();
  if(!participantName||[...participantName].length>20||/[\u0000-\u001f\u007f]/.test(participantName))throw new ValidationError('Nama peserta wajib diisi dan maksimal 20 karakter.');
  if(!Array.isArray(body.sessions)||body.sessions.length!==SESSION_SPECS.length)throw new ValidationError('Semua sesi wajib harus disertakan.');
  const submittedByKey=new Map();
  body.sessions.forEach(session=>{
    requireRecord(session,'Format sesi tidak valid.');
    if(submittedByKey.has(session.session_key))throw new ValidationError('Sesi duplikat tidak diizinkan.');
    submittedByKey.set(session.session_key,session);
  });

  const storedSessions=[];
  for(const spec of SESSION_SPECS){
    const session=submittedByKey.get(spec.session_key);
    if(!session||session.session_number!==spec.session_number)throw new ValidationError(`Sesi ${spec.session_key} wajib disertakan.`);
    const answers=questionAnswers(session,spec);
    let totalScore=0;
    const byLevel={};
    const details=answers.map(({question,answer})=>{
      const grade=Scoring.gradeAnswer(question,answer),maxPoints=grade.maxPoints;
      totalScore+=grade.points;
      if(spec.session_key=='practice'){
        const levelName={1:'pagi',2:'siang',3:'malam'}[question.t];
        byLevel[levelName]??={score:0,max_score:0};
        byLevel[levelName].score+=grade.points;
        byLevel[levelName].max_score+=maxPoints;
      }
      return{
        question_key:question.n,
        question_type:question.type,
        level:question.t,
        prompt:question.type=='pair'?question.qi:question.q,
        answer,
        correct:grade.ok,
        score:grade.points,
        max_score:maxPoints
      };
    });
    const levelScores=spec.session_key=='practice'?byLevel:{pairs:details.map(detail=>({question_key:detail.question_key,score:detail.score,max_score:detail.max_score}))};
    storedSessions.push({session_key:spec.session_key,session_number:spec.session_number,total_score:totalScore,level_scores:levelScores,answer_details:details});
  }
  const practiceScore=storedSessions.find(session=>session.session_key=='practice').total_score;
  const assessmentScore=storedSessions.find(session=>session.session_key=='assessment').total_score;
  const totalScore=(practiceScore+assessmentScore)/2;
  const canonical={participant_name:participantName,sessions:storedSessions.map(session=>({session_key:session.session_key,session_number:session.session_number,answers:session.answer_details.map(detail=>({question_key:detail.question_key,answer:detail.answer}))}))};
  const requestHash=crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  return{token:body.submission_token,participantName,totalScore,sessions:storedSessions,requestHash};
}

function getBody(req){
  const length=Number(req.headers?.['content-length']||0);
  if(length>MAX_BODY_BYTES)throw new ValidationError('Ukuran submission melebihi batas.');
  if(isRecord(req.body)){
    if(Buffer.byteLength(JSON.stringify(req.body),'utf8')>MAX_BODY_BYTES)throw new ValidationError('Ukuran submission melebihi batas.');
    return req.body;
  }
  if(typeof req.body=='string'){
    if(Buffer.byteLength(req.body,'utf8')>MAX_BODY_BYTES)throw new ValidationError('Ukuran submission melebihi batas.');
    try{return JSON.parse(req.body)}catch(error){throw new ValidationError('JSON submission tidak valid.')}
  }
  if(Buffer.isBuffer(req.body)){
    if(req.body.length>MAX_BODY_BYTES)throw new ValidationError('Ukuran submission melebihi batas.');
    try{return JSON.parse(req.body.toString('utf8'))}catch(error){throw new ValidationError('JSON submission tidak valid.')}
  }
  throw new ValidationError('Body submission tidak valid.');
}
async function saveSubmission(data){
  const url=process.env.SUPABASE_URL,serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!serviceKey)throw Object.assign(new Error('Konfigurasi Supabase server belum lengkap.'),{statusCode:503});
  let endpoint;
  try{
    const parsed=new URL(url);
    if(parsed.protocol!='https:'&&parsed.hostname!='localhost')throw new Error('URL Supabase harus menggunakan HTTPS.');
    endpoint=`${url.replace(/\/+$/,'')}/rest/v1/rpc/submit_submission`;
  }catch(error){
    throw Object.assign(new Error('SUPABASE_URL tidak valid.'),{statusCode:503});
  }
  let response;
  try{
    response=await fetch(endpoint,{
      method:'POST',
      headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        p_submission_token:data.token,
        p_request_hash:data.requestHash,
        p_participant_name:data.participantName,
        p_total_score:data.totalScore,
        p_sessions:data.sessions
      })
    });
  }catch(error){
    console.error('Supabase RPC request failed:',error);
    throw Object.assign(new Error('Database tidak dapat dihubungi. Silakan coba lagi.'),{statusCode:502});
  }
  let result;
  try{result=await response.json()}catch(error){result=null}
  if(!response.ok){
    if(response.status>=500)console.error('Supabase RPC failed:',response.status,result);
    const duplicate=JSON.stringify(result||{}).includes('different payload');
    throw Object.assign(new Error(duplicate?'Token submission sudah digunakan untuk hasil berbeda.':'Penyimpanan gagal. Silakan coba lagi.'),{statusCode:duplicate?409:502});
  }
  return result;
}
async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'Metode tidak diizinkan.'});
  }
  try{
    const data=validateSubmission(getBody(req));
    const receipt=await saveSubmission(data);
    if(!receipt||!receipt.id||!receipt.participant_code)throw Object.assign(new Error('Database memberi konfirmasi yang tidak lengkap.'),{statusCode:502});
    return res.status(200).json(receipt);
  }catch(error){
    if(error instanceof ValidationError)return res.status(400).json({error:error.message});
    console.error('Submission endpoint error:',error);
    return res.status(error.statusCode||500).json({error:error.message||'Submission gagal.'});
  }
}
handler.validateSubmission=validateSubmission;
handler.MAX_BODY_BYTES=MAX_BODY_BYTES;
module.exports=handler;
