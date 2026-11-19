const test=require('node:test');
const assert=require('node:assert/strict');
const{BANK}=require('../questions.js');
const submitHandler=require('../api/submit.js');

const TOKEN='19a6f53e-91bf-49d5-98be-c55d09c52d0f';
function answerFor(question){
  if(question.type=='mcq')return{selected:question.o[question.a]};
  if(question.type=='fill')return{text:question.a[0]};
  if(question.type=='order')return{words:question.a.split(' ')};
  if(question.type=='match')return{matches:question.p.map(pair=>pair[1])};
  if(question.type=='speak')return{transcript:question.target,alternatives:[question.target]};
  if(question.type=='pair')return{question:question.eq,answer:`${question.ea} ${question.f}`};
  throw new Error(`Unknown type ${question.type}`);
}
function makePayload(){
  return{
    submission_token:TOKEN,
    participant_name:'Elang Cerdas',
    total_score:-100,
    sessions:[
      {session_key:'practice',session_number:1,total_score:0,answers:BANK.filter(question=>question.type!='pair').map(question=>({question_key:question.n,answer:answerFor(question)}))},
      {session_key:'assessment',session_number:2,total_score:0,answers:BANK.filter(question=>question.type=='pair').map(question=>({question_key:question.n,answer:answerFor(question)}))}
    ]
  };
}

test('server recomputes both phase scores and permits duplicate participant names',()=>{
  const first=submitHandler.validateSubmission(makePayload());
  const second=submitHandler.validateSubmission({...makePayload(),submission_token:'2182f4d0-7992-45ef-b096-f8f02ea28723'});
  assert.equal(first.participantName,'Peserta anonim');
  assert.equal(first.totalScore,100);
  assert.equal(first.sessions[0].total_score,100);
  assert.equal(first.sessions[1].total_score,100);
  assert.equal(second.participantName,first.participantName);
  assert.equal(first.sessions[0].level_scores.pagi.max_score,40);
  assert.equal(first.sessions[0].level_scores.siang.max_score,30);
  assert.equal(first.sessions[0].level_scores.malam.max_score,30);
});

test('server awards only the points earned from submitted answers',()=>{
  const payload=makePayload();
  payload.sessions[0].answers[0].answer.selected='Jam berapa';
  const result=submitHandler.validateSubmission(payload);
  assert.equal(result.sessions[0].total_score,90);
  assert.equal(result.totalScore,95);
});

test('server rejects missing or duplicate required questions',()=>{
  const missing=makePayload();
  missing.sessions[0].answers.pop();
  assert.throws(()=>submitHandler.validateSubmission(missing),/belum lengkap/);
  const duplicate=makePayload();
  duplicate.sessions[0].answers[1].question_key=duplicate.sessions[0].answers[0].question_key;
  assert.throws(()=>submitHandler.validateSubmission(duplicate),/duplikat/);
});

test('server rejects missing sessions and answer words not offered to the participant',()=>{
  const missingSession=makePayload();
  missingSession.sessions.pop();
  assert.throws(()=>submitHandler.validateSubmission(missingSession),/Semua sesi wajib/);
  const invalidAnswer=makePayload();
  const pair=invalidAnswer.sessions[1].answers[0];
  pair.answer.question='How often do you hack';
  assert.throws(()=>submitHandler.validateSubmission(invalidAnswer),/kata yang tidak tersedia/);
});

test('server forces anonymous identity and rejects malformed answer types',()=>{
  const suppliedName=makePayload();
  suppliedName.participant_name='Nama yang diisi dari browser';
  assert.equal(submitHandler.validateSubmission(suppliedName).participantName,'Peserta anonim');
  const invalidChoice=makePayload();
  invalidChoice.sessions[0].answers[0].answer.selected='not an option';
  assert.throws(()=>submitHandler.validateSubmission(invalidChoice),/Pilihan jawaban/);
});

test('server accepts the documented fill-question substitutions when speaking is unavailable',()=>{
  const payload=makePayload();
  for(const key of ['a6','a9']){
    const index=payload.sessions[0].answers.findIndex(entry=>entry.question_key===key);
    const fallback=BANK.find(question=>question.n===key).fb;
    payload.sessions[0].answers[index]={question_key:fallback.n,answer:{text:fallback.a[0]}};
  }
  const result=submitHandler.validateSubmission(payload);
  assert.equal(result.sessions[0].total_score,100);
});


test('server allows one retry for practice but not for independent assessment',()=>{
  const practice=makePayload();
  practice.sessions[0].answers[0].attempts=2;
  assert.equal(submitHandler.validateSubmission(practice).sessions[0].answer_details[0].attempts,2);
  const assessment=makePayload();
  assessment.sessions[1].answers[0].attempts=2;
  assert.throws(()=>submitHandler.validateSubmission(assessment),/Jumlah percobaan/);
});
