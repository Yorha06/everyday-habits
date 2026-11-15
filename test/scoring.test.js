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
