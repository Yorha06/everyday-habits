const test=require('node:test');
const assert=require('node:assert/strict');
const{BANK}=require('../questions.js');
const scoring=require('../js/scoring.js');

test('shared scoring preserves partial matching and speaking rules',()=>{
  const match=BANK.find(question=>question.type=='match');
  const partial=scoring.gradeAnswer(match,{matches:[match.p[0][1],'wrong',match.p[2][1],'wrong']});
  assert.equal(partial.points,5);
  const speaking=BANK.find(question=>question.n=='a9');
  assert.equal(scoring.gradeAnswer(speaking,{transcript:'Every day',alternatives:['Every day']}).points,10);
  assert.equal(scoring.gradeAnswer(speaking,{transcript:'everyday',alternatives:['everyday']}).points,10);
  assert.equal(scoring.gradeAnswer(speaking,{transcript:'Every',alternatives:['Every']}).points,0);
});

test('pair assessment retains partial credit for criteria',()=>{
  const pair=BANK.find(question=>question.n=='p1');
  const result=scoring.gradeAnswer(pair,{question:'How often do you play football',answer:'I play football once a week'});
  assert.equal(result.ok,true);
  assert.equal(result.points,20);
});

test('pair assessment requires correct question, verb forms, and frequency for full credit',()=>{
  const pair=BANK.find(question=>question.n=='p1');
  const wrongQuestion=scoring.gradeAnswer(pair,{question:'How often does you play football',answer:'I play football once a week'});
  assert.equal(wrongQuestion.ok,false);
  assert.ok(wrongQuestion.points<20);
  const noFrequency=scoring.gradeAnswer(pair,{question:'How often do you play football',answer:'I play football'});
  assert.equal(noFrequency.ok,false);
});


test('assessment checks the three criteria and the exact frequency prompt',()=>{
  const pairs=BANK.filter(question=>question.type==='pair');
  const results=pairs.map(question=>scoring.gradeAnswer(question,{question:question.eq,answer:question.ea+' '+question.f}));
  assert.equal(results.every(result=>result.ok),true);
  assert.equal(results.filter(result=>result.ok).length,5);
  const mismatch=scoring.gradeAnswer(pairs[0],{question:pairs[0].eq,answer:'I play football twice a week'});
  assert.equal(mismatch.details.c1,true);
  assert.equal(mismatch.details.c2,true);
  assert.equal(mismatch.details.c3,false);
  assert.equal(mismatch.ok,false);
  const badOrder=scoring.gradeAnswer(pairs[0],{question:'How often does you play football',answer:pairs[0].ea+' '+pairs[0].f});
  assert.equal(badOrder.details.c1,false);
  assert.equal(badOrder.ok,false);
});
