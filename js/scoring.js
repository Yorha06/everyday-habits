(function(root,factory){
  const scoring=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=scoring;
  else root.EHScoring=scoring;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z' ]/g,'').replace(/\s+/g,' ').trim();
  const NUMBER_WORDS=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  const speechTokens=text=>norm(String(text??'').toLowerCase().replace(/(\d{1,2}):30/g,'half past $1').replace(/(\d{1,2}):00/g,'$1').replace(/\b\d{1,2}\b/g,d=>NUMBER_WORDS[+d]||d).replace(/o['’]\s?clock/g,'oclock')).replace(/'/g,'').split(' ').filter(word=>word&&word!='oclock');
  const DAYS='sunday|monday|tuesday|wednesday|thursday|friday|saturday';
  const FREQ=new RegExp(`\\b(once|twice|(two|three|four|five|six|seven) times) a (day|week|month|year)\\b|\\bevery (day|morning|afternoon|evening|night|week|weekend|month|year|${DAYS})\\b|\\b(always|usually|often|sometimes|rarely|never)\\b|\\bon (${DAYS})s?\\b`);

  function scoreSpeech(q,alternatives){
    let best={ok:false,score:0};
    for(const target of [q.target,...(q.accept||[])]){
      const words=speechTokens(target);
      for(const heard of alternatives){
        const heardWords=speechTokens(heard),pool=[...heardWords];
        let hit=0;
        for(const word of words){
          const index=pool.indexOf(word);
          if(index>=0){hit++;pool.splice(index,1)}
        }
        const ok=words.length>0&&hit==words.length&&heardWords.length-hit<=(q.extra??1);
        const score=ok?1:hit/Math.max(words.length,heardWords.length,1);
        if(ok||(!best.ok&&score>best.score))best={ok,score};
      }
    }
    return best;
  }

  function gradePair(q,question,answer){
    const qt=norm(question).split(' '),normalizedAnswer=norm(answer).replace(/'/g,''),at=normalizedAnswer.split(' '),subject=q.sa.toLowerCase();
    const short=!!q.short&&new RegExp(`^((yes|no) )?${subject} (does|doesnt)$`).test(normalizedAnswer);
    const c1=qt[0]=='how'&&qt[1]=='often'&&qt[2]==q.aux;
    const c2=qt.includes(q.verb)&&(short||at.includes(subject)&&at.includes(q.vf));
    const c3=short||FREQ.test(normalizedAnswer);
    return{c1,c2,c3,short,c2q:qt.includes(q.verb),c2a:short||at.includes(subject)&&at.includes(q.vf),ok:c3&&(c1||c2)};
  }

  function gradeAnswer(q,answer){
    let ok=false,points=0,correctCount;
    const maxPoints=q.type=='pair'?20:10;
    if(q.type=='mcq'){
      ok=answer.selected===q.o[q.a];
      points=ok?10:0;
    }else if(q.type=='fill'){
      ok=q.a.some(candidate=>norm(candidate)===norm(answer.text));
      points=ok?10:0;
    }else if(q.type=='order'){
      const text=(answer.words||[]).join(' ');
      ok=[q.a,...(q.alt||[])].some(candidate=>norm(candidate)===norm(text));
      points=ok?10:0;
    }else if(q.type=='match'){
      correctCount=(answer.matches||[]).filter((value,index)=>value===q.p[index]?.[1]).length;
      ok=correctCount===q.p.length;
      points=10*correctCount/q.p.length;
    }else if(q.type=='speak'){
      const alternatives=Array.isArray(answer.alternatives)&&answer.alternatives.length?answer.alternatives:[answer.transcript];
      const speech=scoreSpeech(q,alternatives);
      ok=speech.ok;
      points=ok?10:q.mode=='read'&&speech.score>=.5?10*speech.score:0;
      return{ok,points,maxPoints,details:speech};
    }else if(q.type=='pair'){
      const pair=gradePair(q,answer.question,answer.answer);
      ok=pair.ok;
      points=ok?20:Math.round(20*((pair.c1?.3:0)+(pair.c2?.35:0)+(pair.c3?.35:0)));
      return{ok,points,maxPoints,details:pair};
    }else{
      throw new TypeError(`Unsupported question type: ${q.type}`);
    }
    return{ok,points,maxPoints,correctCount};
  }

  return{normalize:norm,scoreSpeech,gradePair,gradeAnswer};
});
