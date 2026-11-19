(function(root,factory){
  const scoring=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=scoring;
  else root.EHScoring=scoring;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const norm=s=>String(s??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z' ]/g,'').replace(/\s+/g,' ').trim();
  const NUMBER_WORDS=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  const speechTokens=(text,splitEveryday=false)=>{
    const tokens=norm(String(text??'').toLowerCase().replace(/(\d{1,2}):30/g,'half past $1').replace(/(\d{1,2}):00/g,'$1').replace(/\b\d{1,2}\b/g,d=>NUMBER_WORDS[+d]||d).replace(/o['’]\s?clock/g,'oclock')).replace(/'/g,'').split(' ').filter(word=>word&&word!='oclock');
    return splitEveryday?tokens.flatMap(word=>word=='everyday'?['every','day']:[word]):tokens;
  };
  function scoreSpeech(q,alternatives){
    let best={ok:false,score:0};
    const targets=[q.target,...(q.accept||[])];
    const splitEveryday=targets.some(target=>speechTokens(target).join(' ')=='every day');
    for(const target of targets){
      const words=speechTokens(target,splitEveryday);
      for(const heard of alternatives){
        const heardWords=speechTokens(heard,splitEveryday),pool=[...heardWords];
        let hit=0;
        for(const word of words){const index=pool.indexOf(word);if(index>=0){hit++;pool.splice(index,1)}}
        const ok=words.length>0&&hit===words.length&&heardWords.length-hit<=(q.extra??1);
        const score=ok?1:hit/Math.max(words.length,heardWords.length,1);
        if(ok||(!best.ok&&score>best.score))best={ok,score};
      }
    }
    return best;
  }
  function gradePair(q,question,answer){
    const qt=norm(question).split(' '),at=norm(answer).split(' ');
    const expectedQuestion=norm(q.eq).split(' '),expectedAnswer=norm(q.ea).split(' ');
    const verbIndex=expectedQuestion.indexOf(norm(q.verb),4);
    const frameExpected=expectedQuestion.map((word,index)=>index===verbIndex?'__verb__':word);
    const frameActual=qt.map((word,index)=>index===verbIndex?'__verb__':word);
    // Criterion 1: How often + correct auxiliary + subject + the right word order.
    // The verb slot is checked separately as part of criterion 2.
    const c1=verbIndex>=4&&qt.length===expectedQuestion.length&&
      qt[2]===q.aux&&qt[3]===q.subj&&
      frameActual.every((word,index)=>word===frameExpected[index]);
    // Criterion 2: base verb in the question and the correct subject/verb in the answer.
    const c2Question=verbIndex>=0&&qt[verbIndex]===norm(q.verb);
    const c2Answer=expectedAnswer.length>1&&
      at.slice(0,expectedAnswer.length).join(' ')===expectedAnswer.join(' ');
    const c2=c2Question&&c2Answer;
    // Criterion 3: the frequency phrase must exactly match the Indonesian prompt.
    const c3=at.slice(expectedAnswer.length).join(' ')===norm(q.f);
    const points=Math.round(20*((c1?0.30:0)+(c2?0.35:0)+(c3?0.35:0)));
    return{c1,c2,c2Question,c2Answer,c3,ok:c1&&c2&&c3,points};
  }
  function gradeAnswer(q,answer){
    let ok=false,points=0,correctCount;
    const maxPoints=q.type==='pair'?20:10;
    if(q.type==='mcq'){
      ok=answer.selected===q.o[q.a];points=ok?10:0;
    }else if(q.type==='fill'){
      ok=q.a.some(candidate=>norm(candidate)===norm(answer.text));points=ok?10:0;
    }else if(q.type==='order'){
      const text=(answer.words||[]).join(' ');ok=[q.a,...(q.alt||[])].some(candidate=>norm(candidate)===norm(text));points=ok?10:0;
    }else if(q.type==='match'){
      correctCount=(answer.matches||[]).filter((value,index)=>value===q.p[index]?.[1]).length;
      ok=correctCount===q.p.length;points=10*correctCount/q.p.length;
    }else if(q.type==='speak'){
      const alternatives=Array.isArray(answer.alternatives)&&answer.alternatives.length?answer.alternatives:[answer.transcript];
      const speech=scoreSpeech(q,alternatives);ok=speech.ok;points=ok?10:q.mode==='read'&&speech.score>=.5?10*speech.score:0;
      return{ok,points,maxPoints,details:speech};
    }else if(q.type==='pair'){
      const pair=gradePair(q,answer.question,answer.answer);ok=pair.ok;points=pair.points;
      return{ok,points,maxPoints,details:pair};
    }else throw new TypeError(`Unsupported question type: ${q.type}`);
    return{ok,points,maxPoints,correctCount};
  }
  return{normalize:norm,scoreSpeech,gradePair,gradeAnswer};
});
