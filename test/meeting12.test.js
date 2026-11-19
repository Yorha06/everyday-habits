const test=require('node:test');
const assert=require('node:assert/strict');
const{BANK}=require('../questions.js');
const scoring=require('../js/scoring.js');

test('the practice stage has ten items distributed 4/3/3 and maps to the target skill',()=>{
  const practice=BANK.filter(question=>question.type!=='pair');
  const assessment=BANK.filter(question=>question.type==='pair');
  assert.equal(practice.length,10);
  assert.deepEqual([1,2,3].map(level=>practice.filter(question=>question.t===level).length),[4,3,3]);
  assert.equal(assessment.length,5);
  assert.ok(practice.some(question=>question.n==='a1'));
  assert.ok(practice.some(question=>question.n==='a5'));
  assert.ok(practice.some(question=>question.n==='a7'));
  assert.ok(practice.some(question=>question.n==='a8'));
  assert.ok(practice.some(question=>question.n==='a9'));
});

test('all five assessment examples meet the three target criteria',()=>{
  const assessment=BANK.filter(question=>question.type==='pair');
  const results=assessment.map(question=>scoring.gradeAnswer(question,{
    question:question.eq,
    answer:question.ea+' '+question.f
  }));
  assert.equal(results.filter(result=>result.ok).length,5);
  assert.ok(results.every(result=>result.details.c1&&result.details.c2&&result.details.c3));
});

test('assessment rejects a frequency that does not match the Indonesian prompt',()=>{
  const question=BANK.find(item=>item.n==='p1');
  const result=scoring.gradeAnswer(question,{
    question:question.eq,
    answer:'I play football twice a week'
  });
  assert.equal(result.details.c1,true);
  assert.equal(result.details.c2,true);
  assert.equal(result.details.c3,false);
  assert.equal(result.ok,false);
});

test('assessment requires the exact question pattern and correct question word order',()=>{
  const question=BANK.find(item=>item.n==='p4');
  const result=scoring.gradeAnswer(question,{
    question:'How often do she study English',
    answer:question.ea+' '+question.f
  });
  assert.equal(result.details.c1,false);
  assert.equal(result.ok,false);
  const wrongVerb=scoring.gradeAnswer(question,{question:question.eq.replace('study','studies'),answer:question.ea+' '+question.f});
  assert.equal(wrongVerb.details.c1,true);
  assert.equal(wrongVerb.details.c2,false);
  assert.equal(wrongVerb.ok,false);
});

test('objective decision is based on four fully accurate pairs, not partial points',()=>{
  const assessment=BANK.filter(question=>question.type==='pair');
  const results=assessment.map((question,index)=>scoring.gradeAnswer(question,{
    question:question.eq,
    answer:index===0?'I play football once a month':question.ea+' '+question.f
  }));
  assert.equal(results.filter(result=>result.ok).length,4);
  assert.equal(results.filter(result=>result.ok).length>=4,true);
  assert.equal(results.slice(0,3).filter(result=>result.ok).length>=4,false);
});
