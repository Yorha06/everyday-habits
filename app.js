const A=document.getElementById('app'),g=id=>document.getElementById(id);
const PER={1:5,2:5,3:5},PTS=100/15;
const KKM=75,BG_VOLUME=.18;
const AUDIO={background:new Audio('sfx/bgSound.mp3'),correct:new Audio('sfx/correct.mp3'),wrong:new Audio('sfx/wrong.mp3'),aboveKkm:new Audio('sfx/diatasKKM.mp3'),aroundKkm:new Audio('sfx/sekitarKKM.mp3'),poor:[new Audio('sfx/fail1.mp3'),new Audio('sfx/fail2.mp3')],veryPoor:new Audio('sfx/extraFail.mp3')};
AUDIO.background.loop=true;AUDIO.background.volume=BG_VOLUME;
Object.values(AUDIO).flat().forEach(audio=>{audio.preload='auto';audio.load()});
let currentEffect=null;
let effectSequence=0;
let backgroundRequested=false;
const LV={1:['Pagi','Mudah','☀️'],2:['Siang','Sedang','🌤️'],3:['Malam','Menantang','🌙']};
const TYPE={mcq:'Pilihan ganda',tf:'Benar atau salah',fill:'Isi titik-titik',order:'Susun kalimat',match:'Jodohkan',listen:'Menyimak',speak:'Speaking'};
const INS={mcq:'Pilih satu jawaban yang paling tepat.',tf:'Baca pernyataan, lalu pilih True (Benar) atau False (Salah).',fill:'Ketik kata yang hilang. Tiap garis _ adalah satu huruf.',order:'Ketuk kata-kata di bawah sesuai urutan, sampai menjadi kalimat yang benar.',match:'Pilih arti yang tepat untuk setiap kata. Setiap pasangan yang benar tetap mendapat poin!',listen:'Tekan tombol untuk mendengarkan kalimat, lalu pilih jawaban yang tepat. Kalimat dapat diputar ulang.',speak:'Tekan 🎤 lalu ucapkan dengan suara jelas. Boleh coba lagi sebelum diperiksa.'};
const patH=(a,value='')=>{let index=0;const letters=value.toUpperCase().replace(/[^A-Z]/g,'');return a.split(' ').map(w=>`<span class="pw">${[...w].map(c=>`<span class="lt">${/[a-z]/i.test(c)?esc(letters[index++]||'_'):esc(c)}</span>`).join('')}</span>`).join('&nbsp;')};
const fmt=n=>String(Math.round(n*10)/10).replace('.',',');
const SKY=[['#ffd6a5','🌅','#ffeacf'],['#ffe69a','☀️','#fff4c4'],['#ffee9e','☀️','#fff8d0'],['#d6efff','☀️','#eef9ff'],['#b9e1ff','🌤️','#e1f2ff'],['#ffcf9f','⛅','#ffe9d3'],['#c7a8e8','🌇','#efe4fb'],['#4b4f9e','🌙','#323776'],['#2f3470','🌙','#242859'],['#1f2350','🌙','#191c42']];
function theme(n){const b=document.body,s=SKY[n<0?1:Math.round(n/(Q.length-1)*9)],dark=n>=0&&Q[n].t==3,card=n<0?s[2]:dark?'#323776':Q[n].t==2?'#d6efff':'#fff4c4';b.style.setProperty('--bg',s[0]);b.style.setProperty('--card',card);b.classList.toggle('dark',dark);g('sky').textContent=n<0?'☀️':s[1];window.scrollTo(0,0)}
let Q=[],i=0,score=0,res=[],st={};
const shuf=a=>{a=[...a];for(let j=a.length-1;j>0;j--){const k=Math.random()*(j+1)|0;[a[j],a[k]]=[a[k],a[j]]}return a};
const norm=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z' ]/g,'').replace(/\s+/g,' ').trim();
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
let NAME='';try{NAME=localStorage.getItem('eh_name')||''}catch(e){}
const bk=()=>'eh_best_'+NAME.toLowerCase();
const best=()=>{try{return +localStorage.getItem(bk())||0}catch(e){return 0}};
const QUESTION_HISTORY_KEY='eh_question_history_v1';
function loadQuestionHistory(){try{const saved=JSON.parse(localStorage.getItem(QUESTION_HISTORY_KEY));return{questions:saved?.questions&&typeof saved.questions=='object'?saved.questions:{},positions:saved?.positions&&typeof saved.positions=='object'?saved.positions:{}}}catch(e){return{questions:{},positions:{}}}}
function saveQuestionHistory(history){try{localStorage.setItem(QUESTION_HISTORY_KEY,JSON.stringify(history))}catch(e){}}
function questionKey(q){const parts=[q.t,fk(q),q.q,q.o||null,q.a,q.w||null,q.p||null];if(q.target)parts.push(q.target);return JSON.stringify(parts)}
function decayQuestionHistory(history){for(const key of Object.keys(history.questions)){history.questions[key]*=.95;if(history.questions[key]<.05)delete history.questions[key]}
for(const key of Object.keys(history.positions)){for(const position of Object.keys(history.positions[key])){history.positions[key][position]*=.85;if(history.positions[key][position]<.05)delete history.positions[key][position]}
if(!Object.keys(history.positions[key]).length)delete history.positions[key]}}
function pickQuestion(candidates,history,position){const weights=candidates.map(q=>{const key=questionKey(q),seen=history.questions[key]||0,samePosition=history.positions[key]?.[position]||0;return Math.pow(.3,seen)/(1+samePosition*2)});
let point=Math.random()*weights.reduce((sum,weight)=>sum+weight,0);for(let index=0;index<candidates.length;index++){point-=weights[index];if(point<0)return candidates[index]}return candidates[candidates.length-1]}
function rememberQuestion(q,position){const history=loadQuestionHistory(),key=questionKey(q);
history.questions[key]=(history.questions[key]||0)+1;
history.positions[key]||={};history.positions[key][position]=(history.positions[key][position]||0)+1;
saveQuestionHistory(history)}

function home(){clearSession();theme(-1);setTimeout(updateMicNote);
A.innerHTML=`<section class="hero"><div class="mascot">🦉<span>⏰</span></div><div><div class="brand"><img class="logo" src="logo.svg" alt="Logo Everyday Habits" width="48" height="48"><span>Everyday Habits</span></div><h1>Halo, Teman Pintar!</h1>
<p class="sub">Yuk belajar kebiasaan sehari-hari dalam bahasa Inggris. Seru, mudah, dan ada bintangnya!</p>
<label for="nm">Siapa namamu?</label>
<input id="nm" class="inp" maxlength="16" autocomplete="off" placeholder="Tulis namamu di sini" value="${esc(NAME)}" onkeydown="if(event.key==='Enter')go()">
<div id="fb"></div><p id="micnote" class="sub"></p><button class="btn go" onclick="go()">Ayo Mulai! 🚀</button><button class="btn alt" onclick="learn()">📘 Belajar Dulu</button>
${best()?`<p class="best">🏆 Skor terbaikmu: <b>${fmt(best())}</b></p>`:''}</div></section>
<section class="steps"><div><b>✍️ Jawab 15 soal</b><span>Pilih, ketik, susun, jodohkan, dengarkan, dan bicara</span></div><div><b>⭐ Nilai maksimal 100</b><span>Jodohkan: nilai dihitung per pasangan</span></div><div><b>☀️ → 🌤️ → 🌙</b><span>Soal makin lama makin menantang</span></div></section>`}

function go(){const n=g('nm').value.trim();if(!n)return warn('Tulis namamu dulu ya! 😊');NAME=n;try{localStorage.setItem('eh_name',n)}catch(e){}
closeMicDialog();startBackgroundMusic();requestMicPermission().then(start)}

function learn(){saveSession('learn');theme(-1);
const W=[['⏰','wake up / get up','bangun tidur / bangun'],['🪥','brush my teeth','menyikat gigi'],['🚿','take a shower','mandi'],['🧼','wash my face / hands','mencuci muka / tangan'],['👕','get dressed','berpakaian'],['🥛','drink water','minum air'],['🍳','have breakfast','sarapan'],['🎒','go to school','pergi ke sekolah'],['🍱','have / eat lunch','makan siang'],['📚','do my homework','mengerjakan PR'],['📖','study English','belajar bahasa Inggris'],['🍲','have dinner','makan malam'],['📺','watch TV','menonton TV'],['🎮','play games / football / badminton','bermain game / sepak bola / bulu tangkis'],['🧹','clean my room','membersihkan kamarku'],['🛏️','make my bed','merapikan tempat tidur'],['🍳','cook dinner','memasak makan malam'],['🤝','help at home','membantu di rumah'],['📕','read a book','membaca buku'],['🌙','go to bed','pergi tidur']];
const T=[['🌅','in the morning','pada pagi hari'],['🌤️','in the afternoon','pada sore hari'],['🌆','in the evening','pada malam hari (petang)'],['🌙','at night','pada malam hari'],['🕕','six o\'clock (6:00)','pukul enam tepat'],['🕢','half past seven (7:30)','pukul setengah delapan'],['⬅️','before / after','sebelum / sesudah'],['📅','on Sundays','pada hari Minggu']];
const TR=[['🚌','by bus','naik bus'],['🚲','by bike','naik sepeda'],['🚗','by car','naik mobil'],['🚶','on foot / walk','berjalan kaki']];
const F=[['always','selalu',100],['usually','biasanya',80],['often','sering',60],['sometimes','kadang-kadang',40],['rarely','jarang',10],['never','tidak pernah',0]];
const N=[['once a day','sekali sehari'],['twice a week','dua kali seminggu'],['three times a week','tiga kali seminggu'],['three times a month','tiga kali sebulan'],['once a year','sekali setahun'],['every day / morning / evening / weekend','setiap hari / pagi / sore / akhir pekan']];
const box=(title,items)=>`<section class="card"><h2>${title}</h2><div class="words">${items.map(w=>`<div class="w"><i>${w[0]}</i><div><b>${w[1]}</b><small>${w[2]}</small></div></div>`).join('')}</div></section>`;
A.innerHTML=`<div class="wrap"><button class="back" onclick="home()">⬅ Kembali</button>
${box('🌞 Kegiatan Sehari-hari',W)}
${box('🕒 Waktu & Jam',T)}
${box('🚌 Pergi ke Sekolah',TR)}
<section class="card"><h2>🔢 Seberapa Sering?</h2><p class="sub">Makin panjang garisnya, makin sering kamu melakukannya.</p>${F.map(f=>`<div class="m"><div><b>${f[0]}</b><small>${f[1]}</small></div><div class="bar"><i style="width:${f[2]}%"></i></div><span>${f[2]}%</span></div>`).join('')}
<p class="sub">Berapa kali? <b>once</b> = 1x, <b>twice</b> = 2x, <b>three times</b> = 3x.</p>${N.map(n=>`<div class="tip"><b>${n[0]}</b> — ${n[1]}</div>`).join('')}</section>
<section class="card"><h2>🔁 How often + do / does</h2>
<p class="sub">Pertanyaan "seberapa sering" selalu memakai <b>do</b> atau <b>does</b>. Kata kerjanya tetap bentuk dasar!</p>
<div class="tip">👥 <b>How often do</b> + I / you / we / they + kata kerja dasar?<br><i>How often do you read? · How often do they play games?</i></div>
<div class="tip">👤 <b>How often does</b> + he / she / it (atau satu orang) + kata kerja dasar?<br><i>How often does she swim? · How often does your father cook?</i><br>❌ How often does she <u>swims</u>? → ✅ How often does she <u>swim</u>?</div>
<div class="tip">💬 <b>Jawab dengan frekuensi:</b><br><i>I read twice a week. · She swims every Saturday. · They sometimes play games.</i></div>
<div class="tip">✅ <b>Jawaban singkat</b> untuk pertanyaan Do/Does:<br><i>Do you read? — Yes, I do. / No, I don't.<br>Does she read? — Yes, she does. / No, she doesn't.</i></div></section>
<section class="card"><h2>✍️ Aturan Kalimat</h2>
<div class="tip">1️⃣ <b>I / You / We / They</b> → kata kerja dasar.<br><i>I brush my teeth. They walk to school.</i></div>
<div class="tip">2️⃣ <b>He / She / It</b> (juga nama satu orang, My father, My sister) → kata kerja ditambah <b>s / es</b>.<br><i>gets, works, plays, cooks · brush → brushes · go → goes · do → does · have → has · study → studies</i></div>
<div class="tip">3️⃣ Kata "seberapa sering" ditaruh <b>sebelum kata kerja</b>.<br><i>She always eats fruit. We sometimes watch TV.</i></div>
<div class="tip">4️⃣ Setelah <b>is / am / are</b>, taruh sesudahnya.<br><i>He is never late. I am usually tired.</i></div>
<div class="tip">5️⃣ Keterangan waktu biasanya di <b>belakang</b> kalimat.<br><i>I wake up at six. We play after school. She goes to school by bus.</i></div></section>
<section class="card"><h2>❓ Bertanya & Menjawab</h2>
<div class="tip">🔹 <b>Do / Does</b> + subjek + kata kerja dasar. Setelah does, kata kerja <b>tidak</b> memakai s.<br><i>Do you walk to school? · Does she usually play football?</i></div>
<div class="tip">🔹 Jawaban singkat: <i>Yes, I do. · No, I don't. · Yes, she does. · No, she doesn't.</i></div>
<div class="tip">🔹 <b>How often</b> (seberapa sering) → jawab dengan frekuensi.<br><i>How often do you read? — Three times a week.</i></div>
<div class="tip">🔹 <b>What time</b> (jam berapa) → jawab dengan jam.<br><i>What time does he get up? — At six o'clock.</i></div>
<div class="tip">🔹 Kata tanya lain: <b>Where</b> = di mana, <b>Who</b> = siapa.</div></section>
<section class="card"><h2>🚫 Kalimat Negatif</h2>
<div class="tip">🔸 <b>I / You / We / They</b> → <b>don't</b> (do not) + kata kerja dasar.<br><i>They don't go to bed late.</i></div>
<div class="tip">🔸 <b>He / She / It</b> → <b>doesn't</b> (does not) + kata kerja dasar.<br><i>She doesn't go to school by bus. (bukan "goes")</i></div>
<div class="tip">🔸 <b>Never</b> sudah berarti "tidak pernah", jadi tidak perlu don't.<br><i>She never eats breakfast late.</i></div></section>
<section class="card"><h2>🔊🎤 Tips Menyimak & Speaking</h2>
<div class="tip">🔊 Dengarkan <b>kata penting</b>: jam (four o'clock), kegiatan (brush, homework), dan frekuensi (twice a week). Kalimat dapat diputar ulang.</div>
<div class="tip">🎤 Baca pelan dan jelas, satu kata demi satu kata. Ucapkan <b>semua kata</b> dan jangan menambah kata lain.</div>
<div class="tip">🔊 Pada soal menyimak, browser membacakan kalimat dalam bahasa Inggris. Pada Speaking, tekan "Dengar Contoh" untuk mendengar contoh jawaban. Jawaban singkat: <i>Yes, I do.</i> atau <i>No, I don't.</i></div></section>
<button class="btn go" onclick="home()">Siap! Kembali ke Beranda 🏠</button></div>`}

const FORMATS=['mcq','tf','fill','order','match'],fk=q=>q.k||q.type;
const POOL={1:BANK.filter(q=>q.t==1),2:BANK.filter(q=>q.t==2),3:BANK.filter(q=>q.t==3)}; // daftar soal tiap level
function chooseFromPool(level,format,history,position,used){const candidates=POOL[level].filter(q=>fk(q)==format&&!used.has(q));if(!candidates.length)throw new Error(`Bank soal level ${level} tidak memiliki soal format ${format}.`);
const question=pickQuestion(candidates,history,position);used.add(question);return question}
// Rotasi soal listening & speaking: tiap kelompok soal punya "kantong" yang diacak lalu diambil tanpa pengembalian.
// Soal baru muncul lagi setelah semua soal lain di kantong yang sama keluar, jadi pemakaiannya merata.
const ROTATION_BAG_KEY='eh_listening_bag_v1';
// Isi tiap sesi: 3 listening + 3 speaking, hanya di Siang dan Malam (Pagi semua soal biasa); sisanya soal biasa.
const SESSION_PLAN={1:{listen:0,speak:0},2:{listen:1,speak:2},3:{listen:2,speak:1}};
let rotationBagMemory={};
function loadRotationBags(){try{const saved=JSON.parse(localStorage.getItem(ROTATION_BAG_KEY));if(saved&&typeof saved=='object')return saved}catch(e){}return rotationBagMemory}
function saveRotationBags(bags){rotationBagMemory=bags;try{localStorage.setItem(ROTATION_BAG_KEY,JSON.stringify(bags))}catch(e){}}
function drawFromBag(bags,name,items,count){if(items.length<count)throw new Error(`Kelompok soal ${name} membutuhkan minimal ${count} soal.`);
const byKey=new Map(items.map(q=>[questionKey(q),q]));let bag=Array.isArray(bags[name])?bags[name].filter(key=>byKey.has(key)):[];
const picked=[];while(picked.length<count){if(!bag.length)bag=shuf([...byKey.keys()].filter(key=>!picked.includes(key)));picked.push(bag.shift())}
bags[name]=bag;return picked.map(key=>byKey.get(key))}
function pickRotating(level,name,filter,count){const bags=loadRotationBags(),chosen=drawFromBag(bags,`${name}${level}`,POOL[level].filter(filter),count);saveRotationBags(bags);return chosen}
function build(){const history=loadQuestionHistory();decayQuestionHistory(history);let position=0;
const questions=[],canSpeak=speechUsable();
for(const level of [1,2,3]){const used=new Set(),plan=SESSION_PLAN[level];
const listening=plan.listen?pickRotating(level,'listen',q=>q.listenText,plan.listen):[];
const speaking=canSpeak&&plan.speak?pickRotating(level,'speak',q=>q.k=='speak',plan.speak):[]; // tanpa dukungan mikrofon, diganti soal biasa
const standardFormats=shuf(FORMATS).slice(0,PER[level]-listening.length-speaking.length);
const slots=shuf([...listening,...speaking].map(q=>({q})).concat(standardFormats.map(format=>({format}))));
for(const slot of slots){if(slot.q){used.add(slot.q);questions.push(slot.q);position++}else questions.push(chooseFromPool(level,slot.format,history,position++,used))}}
saveQuestionHistory(history);return questions}
function start(){startBackgroundMusic();Q=build();i=0;score=0;res=[];show()}

function show(){const q=Q[i],[l,n,ic]=LV[q.t];stopVoice();if(restoringSession)restoringSession=false;else rememberQuestion(q,i);theme(i);st={sel:null,ans:[],m:[],done:false,fillMode:false,heard:'',alts:[],tries:0};
saveSession('quiz');q.sh=q.type=='order'?shuf(q.w.map((w,k)=>[w,k])):q.type=='match'?shuf(q.p.map(p=>p[1])):0;
A.innerHTML=`<div class="wrap"><div class="hi-row"><button class="home-btn" type="button" onclick="confirmHome()" aria-label="Kembali ke beranda">🏠 Beranda</button><p class="hi">Semangat, ${esc(NAME)}! 💪</p></div><div class="top"><div class="badge l${q.t}">${ic} ${l} – ${n}</div><div class="sc">⭐ ${fmt(score)}</div></div>
<div class="prog">${Q.map((x,k)=>`<i class="l${x.t} ${k<i?'on':k==i?'cur':''}"></i>`).join('')}</div>
<section class="card quiz-card"><p class="hint">Soal ${i+1} dari ${Q.length} · Kesulitan ${'●'.repeat(q.t)}${'○'.repeat(3-q.t)} · ${q.k?TYPE[q.k]:TYPE[q.type]} · ${q.type=='match'?`maks ${fmt(PTS)} poin (${fmt(PTS/q.p.length)} per pasangan)`:`${fmt(PTS)} poin`}</p><h2>${esc(q.q)}</h2><p class="ins">👉 ${INS[q.k||q.type]}</p>${q.id?`<p class="idn">💬 ${esc(q.id)}</p>`:''}
<div id="body">${body(q)}</div><div id="fb"></div><button class="btn go" id="chk" onclick="check()">Periksa Jawaban</button></section></div>`;
if(q.type=='order')draw()}

function body(q){
if(q.type=='mcq')return `${q.listenText?'<button class="btn alt listen-btn" type="button" onclick="sayListening()">🔊 Dengarkan Kalimat</button>':''}<div class="opts">${q.o.map((o,k)=>`<button class="opt" onclick="pick(${k})">${esc(o)}</button>`).join('')}</div>`;
if(q.type=='fill')return `<div id="pat" class="pat">${patH(q.a[0])}</div><input id="fi" class="inp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" oninput="fillInput()" onkeydown="if(event.key==='Enter')check()" maxlength="${Math.max(...q.a.map(a=>a.length))+4}" placeholder="Ketik jawabanmu di sini…">`;
if(q.type=='order')return `<div id="ans" class="ans"></div><div id="bank" class="bank"></div><p class="hint">Ketuk kata untuk menyusun. Ketuk lagi untuk membatalkan.</p>`;
if(q.type=='speak'){const exampleCount=Q.slice(0,i).filter(question=>question.type=='speak').length;
return `<div class="speak-box"><div class="speak-text">${q.mode=='read'?esc(q.target):`Contoh jawaban: <b>${esc(q.target)}</b>`}</div><div class="speak-actions">${exampleCount<2?'<button class="btn alt" type="button" onclick="sayExample()">🔊 Dengar Contoh</button>':''}<button class="btn go mic-btn" id="mic" type="button" onclick="toggleMic()">🎤 Tekan & Bicara</button></div><div id="heard" class="heard" aria-live="polite">Belum ada suara. Tekan 🎤 lalu bicara.</div><div id="swap"></div></div>`}
return q.p.map((p,k)=>`<div class="row"><b>${esc(p[0])}</b><div class="dd"><button type="button" class="ddb" onclick="tg(${k})">Pilih arti…</button><ul class="ddl" hidden>${q.sh.map((x,j)=>`<li><button type="button" data-v="${esc(x)}" onclick="sv(${k},${j})">${esc(x)}</button></li>`).join('')}</ul></div></div>`).join('')}

function pick(k){st.sel=k;document.querySelectorAll('.opt').forEach((b,j)=>b.classList.toggle('sel',j==k))}
function fillInput(){g('pat').innerHTML=patH(Q[i].a[0],g('fi').value)}
function keepFillInputVisible(){const input=g('fi');if(!input||document.activeElement!==input)return;
const viewportHeight=window.visualViewport?.height||window.innerHeight,rect=input.getBoundingClientRect(),overflow=rect.bottom-(viewportHeight-24);
if(overflow>0)window.scrollBy({top:overflow,behavior:'smooth'})}
document.addEventListener('focusin',e=>{if(e.target.id=='fi')setTimeout(keepFillInputVisible,250)});
window.visualViewport?.addEventListener('resize',keepFillInputVisible);
function draw(){const q=Q[i];g('ans').innerHTML=st.ans.map(k=>`<button class="chip" onclick="mv(${k},0)">${esc(q.w[k])}</button>`).join('');
g('bank').innerHTML=q.sh.filter(([w,k])=>!st.ans.includes(k)).map(([w,k])=>`<button class="chip" onclick="mv(${k},1)">${esc(w)}</button>`).join('')}
function mv(k,add){if(st.done)return;st.ans=add?[...st.ans,k]:st.ans.filter(x=>x!=k);draw()}
function tg(k){if(st.done)return;document.querySelectorAll('.ddl').forEach((u,j)=>u.hidden=j==k?!u.hidden:true)}
function sv(k,j){const v=Q[i].sh[j];st.m[k]=v;const b=document.querySelectorAll('.ddb')[k];b.textContent=v;b.classList.add('set');document.querySelectorAll('.ddl').forEach(u=>u.hidden=true);document.querySelectorAll('.ddl li button').forEach(x=>x.classList.toggle('used',st.m.includes(x.dataset.v)))}
document.addEventListener('click',e=>{if(!e.target.closest('.dd'))document.querySelectorAll('.ddl').forEach(u=>u.hidden=true)});
document.addEventListener('keydown',e=>{if(e.key=='Escape')document.querySelectorAll('.ddl').forEach(u=>u.hidden=true)});
function warn(m){g('fb').innerHTML=`<div class="fb part">${m}</div>`;g('fb').scrollIntoView?.({block:'nearest',behavior:'smooth'})}

function showAnswerOverlay(ok,partial){const old=document.querySelector('.answer-overlay');if(old)old.remove();
const overlay=document.createElement('div');overlay.className=`answer-overlay ${ok?'correct':partial?'partial':'incorrect'}`;overlay.setAttribute('role','status');overlay.setAttribute('aria-live','assertive');
overlay.innerHTML=`<div class="answer-overlay-card"><span class="answer-overlay-icon">${ok?'🎉':partial?'🌟':'💫'}</span><b>${ok?'Benar!':partial?'Hampir!':'Belum tepat'}</b></div>`;
document.body.append(overlay);const remove=()=>{clearTimeout(timeout);overlay.remove()};overlay.addEventListener('animationend',remove,{once:true});const timeout=setTimeout(remove,700)}

function startBackgroundMusic(){backgroundRequested=true;if(voiceBusy||document.hidden||!document.hasFocus()||!AUDIO.background.paused)return;
const playback=AUDIO.background.play();if(playback)playback.catch(error=>{console.warn('Backsound tidak dapat diputar:',error);if(error&&error.name=='NotAllowedError')armAudioUnlock()})}
// Setelah refresh, browser memblokir suara otomatis sampai ada interaksi; musik diputar pada sentuhan/klik/ketikan pertama.
let audioUnlockArmed=false;
function armAudioUnlock(){if(audioUnlockArmed)return;audioUnlockArmed=true;const events=['pointerdown','touchstart','keydown','click'];
const unlock=()=>{events.forEach(name=>document.removeEventListener(name,unlock,true));audioUnlockArmed=false;if(backgroundRequested)startBackgroundMusic()};events.forEach(name=>document.addEventListener(name,unlock,true))}

function playEffect(audio){if(document.hidden||!document.hasFocus())return;const sequence=++effectSequence;
if(currentEffect)currentEffect.pause();
currentEffect=audio;AUDIO.background.pause();AUDIO.background.volume=BG_VOLUME;audio.volume=1;audio.currentTime=0;
const restore=()=>{if(effectSequence===sequence){currentEffect=null;if(backgroundRequested&&!document.hidden&&document.hasFocus())startBackgroundMusic()}};
audio.onended=restore;
audio.onerror=()=>{restore();console.error(`Efek suara gagal dimuat: ${audio.currentSrc||audio.src}`)};
const playback=audio.play();if(playback)playback.catch(error=>{restore();console.error(`Efek suara tidak dapat diputar (${audio.currentSrc||audio.src}):`,error)})}

function suspendAudio(){effectSequence++;if(currentEffect){currentEffect.pause();currentEffect.currentTime=0;currentEffect=null}
AUDIO.background.pause();AUDIO.background.volume=BG_VOLUME}

function resumeAudio(){if(document.hidden||!document.hasFocus())return;if(backgroundRequested)startBackgroundMusic()}

document.addEventListener('visibilitychange',()=>document.hidden?suspendAudio():resumeAudio());
window.addEventListener('blur',suspendAudio);
window.addEventListener('focus',resumeAudio);
window.addEventListener('pagehide',suspendAudio);
window.addEventListener('pageshow',resumeAudio);

function playAnswerSound(correct){playEffect(correct?AUDIO.correct:AUDIO.wrong)}

// ===== Speaking: mikrofon (Web Speech API) dan contoh ucapan =====
const NUMBER_WORDS=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
// Chrome sering menulis jam sebagai angka ("9:00", "7:30"); "o'clock" bersifat opsional karena sering hilang saat ditranskripsi.
const speechTokens=text=>norm(String(text).toLowerCase().replace(/(\d{1,2}):30/g,'half past $1').replace(/(\d{1,2}):00/g,'$1').replace(/\b\d{1,2}\b/g,d=>NUMBER_WORDS[+d]||d).replace(/o['’]\s?clock/g,'oclock')).replace(/'/g,'').split(' ').filter(word=>word&&word!='oclock');
function speakScore(q,alternatives){let best={ok:false,score:0};
for(const target of [q.target,...(q.accept||[])]){const words=speechTokens(target);
for(const heard of alternatives){const heardWords=speechTokens(heard),pool=[...heardWords];let hit=0;for(const w of words){const k=pool.indexOf(w);if(k>=0){hit++;pool.splice(k,1)}}
// Benar penuh: semua kata target terucap dan kata tambahan maksimal 1 (jadi "yes I love" bukan "yes I do").
const ok=words.length>0&&hit==words.length&&heardWords.length-hit<=(q.extra??1),score=ok?1:hit/Math.max(words.length,heardWords.length,1);
if(ok||(!best.ok&&score>best.score))best={ok,score}}}return best}
const speechRecognitionClass=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
let micPermission='unknown'; // unknown | granted | denied | missing
function speechSupported(){return !!speechRecognitionClass()&&window.isSecureContext!==false}
const speechUsable=()=>speechSupported()&&micPermission!='denied'&&micPermission!='missing'
let recognition=null,voiceBusy=false,speechSequence=0;
function setVoiceBusy(busy){voiceBusy=busy;if(busy){effectSequence++;if(currentEffect){currentEffect.pause();currentEffect=null}AUDIO.background.pause()}else if(backgroundRequested)startBackgroundMusic()}
function stopVoice(resumeBackground=true){speechSequence++;if(recognition){const r=recognition;recognition=null;r.onresult=r.onerror=r.onend=null;try{r.abort()}catch(e){}}
try{window.speechSynthesis?.cancel()}catch(e){}if(voiceBusy){if(resumeBackground)setVoiceBusy(false);else voiceBusy=false}const mic=g('mic');if(mic){mic.classList.remove('rec');mic.textContent='🎤 Tekan & Bicara'}}
function showHeard(text,cls=''){const el=g('heard');if(el){el.className='heard '+cls;el.textContent=text}}
function offerSwap(){const el=g('swap');if(el&&!el.firstChild)el.innerHTML='<button class="btn alt" type="button" onclick="swapSpeaking()">Mikrofon bermasalah? Ganti soal lain</button>'}
function swapSpeaking(){const q=Q[i];stopVoice();const used=new Set(Q),formats=shuf(FORMATS).filter(f=>POOL[q.t].some(x=>fk(x)==f&&!used.has(x)));
Q[i]=chooseFromPool(q.t,formats[0],loadQuestionHistory(),i,used);show()}
function sayExample(){if(st.done||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return warn('Browser ini belum bisa membacakan contoh. 😅');
sayText(Q[i].target,.75)}
function sayListening(){if(st.done)return;if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return warn('Browser ini belum mendukung suara otomatis. Coba gunakan Chrome atau Edge. 😅');
sayText(Q[i].listenText,.75)}
function preferredEnglishVoice(){const voices=speechSynthesis.getVoices(),english=voices.filter(voice=>voice.lang.toLowerCase().startsWith('en'));
return english.find(voice=>/\b(female|woman|girl|samantha|victoria|karen|moira|tessa|fiona|ava|allison|susan|zira|jenny|aria|michelle|hazel)\b/i.test(voice.name))||english[0]||voices[0]||null}
function sayText(text,rate){stopVoice(false);const sequence=++speechSequence,u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.voice=preferredEnglishVoice();u.rate=rate;setVoiceBusy(true);
u.onend=u.onerror=()=>{if(sequence===speechSequence&&voiceBusy&&!recognition)setVoiceBusy(false)};speechSynthesis.speak(u)}
function toggleMic(){if(st.done)return;if(recognition){recognition.stop();return}
const SR=speechRecognitionClass();if(!SR){offerSwap();return showHeard('Browser ini belum mendukung mikrofon. Coba Chrome atau Edge.','bad')}
stopVoice();const r=new SR();recognition=r;r.lang='en-US';r.interimResults=true;r.maxAlternatives=3;r.continuous=false;
let gotSound=false,failed=false;st.tries++;setVoiceBusy(true);
const mic=g('mic');mic.classList.add('rec');mic.textContent='⏹ Mendengarkan… (ketuk untuk selesai)';showHeard('Mendengarkan… ayo bicara! 🎧');
r.onresult=e=>{const alts=Array.from(e.results[e.results.length-1]||[]).map(a=>a.transcript).filter(Boolean);if(alts.length){gotSound=true;st.alts=alts;st.heard=alts[0];showHeard('🗣️ “'+alts[0]+'”','ok')}};
r.onerror=e=>{failed=true;const m={'not-allowed':'Izin mikrofon ditolak. Izinkan mikrofon di browser, lalu coba lagi.','service-not-allowed':'Izin mikrofon ditolak. Izinkan mikrofon di browser, lalu coba lagi.','audio-capture':'Mikrofon tidak ditemukan.','network':'Pengenalan suara butuh internet.','no-speech':'Suaramu belum terdengar. Coba lagi, bicara lebih dekat ke mikrofon.'}[e.error];
if(e.error!='aborted')showHeard(m||'Gagal mendengar suaramu. Coba lagi.','bad');if(e.error!='no-speech'||st.tries>=3)offerSwap()};
r.onend=()=>{if(recognition!==r)return;recognition=null;setVoiceBusy(false);mic.classList.remove('rec');mic.textContent='🎤 Bicara Lagi';
if(!gotSound&&!failed){showHeard('Belum terdengar. Coba lagi ya!','bad');if(st.tries>=3)offerSwap()}};
try{r.start()}catch(err){failed=true;recognition=null;setVoiceBusy(false);showHeard('Mikrofon tidak bisa dipakai sekarang.','bad');offerSwap()}}

// ===== Izin mikrofon: diminta sekali di awal (saat web dibuka / tombol Mulai), bukan saat soal speaking =====
const MIC_NOTE={granted:'🎤 Mikrofon siap untuk soal speaking.',denied:'🎤 Mikrofon belum diizinkan, jadi soal bicara diganti soal lain.',missing:'🎤 Mikrofon tidak ditemukan, jadi soal speaking diganti soal biasa.',unsupported:'🎤 Browser ini belum mendukung speaking (pakai Chrome/Edge lewat localhost atau HTTPS), jadi soal speaking diganti soal biasa.'};
function updateMicNote(){const el=g('micnote');if(!el)return;const key=!speechSupported()?'unsupported':micPermission;el.textContent=MIC_NOTE[key]||'';
if(key=='denied'){const b=document.createElement('button');b.className='back';b.type='button';b.textContent='Cara mengaktifkan';b.onclick=()=>micDialog('denied');el.append(' ',b)}}
// Dialog ramah anak: dipandu burung hantu, tanpa menyuruh anak mencari ikon di address bar.
function closeMicDialog(){document.querySelector('.mic-dialog')?.remove()}
function micDialog(kind){closeMicDialog();const d=document.createElement('div');d.className='mic-dialog';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
d.innerHTML=kind=='ask'
?`<div class="mic-dialog-card"><div class="mic-owl">🦉🎤</div><h2>Ayo latihan bicara!</h2><p>Aku mau mendengar suaramu.<br>Nanti muncul kotak kecil. Tekan tombol <b>Izinkan</b> atau <b>Allow</b> ya!</p><button class="btn go" type="button" onclick="allowMic()">Siap! 🎤</button><button class="btn alt" type="button" onclick="closeMicDialog()">Nanti saja</button></div>`
:`<div class="mic-dialog-card"><div class="mic-owl">🦉😢</div><h2>Mikrofon belum boleh dipakai</h2><p>Tidak apa-apa! Kamu tetap bisa bermain. Soal bicara diganti soal lain.</p><button class="btn go" type="button" onclick="closeMicDialog()">Lanjut main 👍</button><button class="btn alt" type="button" onclick="document.getElementById('mic-help').hidden=false;this.hidden=true">🧑‍🏫 Minta bantuan guru / orang tua</button><p id="mic-help" class="mic-help" hidden><b>Untuk guru / orang tua:</b> ketuk ikon di sebelah kiri alamat web (🔒 atau ⚙️), pilih <b>Izin</b> → <b>Mikrofon</b> → <b>Izinkan</b>, lalu muat ulang halaman ini.</p></div>`;
document.body.append(d)}
async function allowMic(){closeMicDialog();await requestMicPermission();if(micPermission=='denied')micDialog('denied')}
async function initMic(){if(!speechSupported()||!navigator.mediaDevices?.getUserMedia){updateMicNote();return}
let state='prompt';try{state=(await navigator.permissions.query({name:'microphone'})).state}catch(e){}
if(state=='prompt')micDialog('ask');else{await requestMicPermission();if(micPermission=='denied')micDialog('denied')}}

let micRequest=null;
function requestMicPermission(){if(micRequest)return micRequest;
micRequest=(async()=>{if(!speechSupported()||!navigator.mediaDevices?.getUserMedia){updateMicNote();return}
try{const status=await navigator.permissions.query({name:'microphone'});micPermission=status.state=='prompt'?'unknown':status.state;
status.onchange=()=>{micPermission=status.state=='prompt'?'unknown':status.state;updateMicNote()}}catch(e){}
if(micPermission=='unknown'){try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());micPermission='granted'}
catch(e){micPermission=e&&e.name=='NotFoundError'?'missing':'denied'}}
updateMicNote()})().finally(()=>{micRequest=null});return micRequest}

// ===== Pengaman refresh: kuis yang sedang berjalan disimpan dan dilanjutkan setelah halaman dimuat ulang =====
const SESSION_KEY='eh_session_v1',SESSION_MAX_AGE=12*60*60*1000;
let restoringSession=false;
function saveSession(view){try{localStorage.setItem(SESSION_KEY,JSON.stringify(view=='learn'?{view,ts:Date.now()}:{view,keys:Q.map(questionKey),i,score,res,answered:!!st.done,ts:Date.now()}))}catch(e){}}
function clearSession(){try{localStorage.removeItem(SESSION_KEY)}catch(e){}}
function restoreSession(){let data;try{data=JSON.parse(localStorage.getItem(SESSION_KEY))}catch(e){}
if(!data||!data.ts||Date.now()-data.ts>SESSION_MAX_AGE){clearSession();return false}
if(data.view=='learn'){learn();return true}
const byKey=new Map(BANK.map(q=>[questionKey(q),q])),restored=(data.keys||[]).map(key=>byKey.get(key));
if(restored.length!=15||restored.some(q=>!q)||!Number.isInteger(data.i)||!Array.isArray(data.res)||!Number.isFinite(data.score)){clearSession();return false}
Q=restored;score=data.score;res=data.res;i=data.i;
if(data.view=='quiz'){if(data.answered)i++; // jawaban sudah dihitung, lanjut ke soal berikutnya (tidak bisa dijawab ulang lewat refresh)
if(i>=Q.length)end();else{restoringSession=true;startBackgroundMusic();armAudioUnlock();show()}return true}
if(data.view=='result'){end();return true}
clearSession();return false}
// Tombol Beranda saat kuis berjalan: minta konfirmasi dulu.
function confirmHome(){closeMicDialog();const d=document.createElement('div');d.className='mic-dialog';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
d.innerHTML='<div class="mic-dialog-card"><div class="mic-owl">🦉🤔</div><h2>Kembali ke beranda?</h2><p>Kuis yang sedang berjalan akan berhenti dan skormu tidak disimpan.</p><button class="btn go" type="button" onclick="closeMicDialog()">Lanjut main 👍</button><button class="btn alt" type="button" onclick="leaveToHome()">Ya, ke beranda</button></div>';
d.addEventListener('click',e=>{if(e.target==d)closeMicDialog()});document.body.append(d)}
function leaveToHome(){closeMicDialog();stopVoice();document.querySelector('.answer-overlay')?.remove();effectSequence++;if(currentEffect){currentEffect.pause();currentEffect=null}home()}

function gradeForScore(value){if(value>=KKM+5)return{id:'above',label:'Luar Biasa!',description:'Hebat! Kamu sudah menguasai banyak hal.',icon:'🏆',sound:AUDIO.aboveKkm,stars:3};
if(value>=KKM-5)return{id:'around',label:'Bagus!',description:'Hasil yang bagus! Terus berlatih untuk mendapat nilai lebih tinggi.',icon:'🎯',sound:AUDIO.aroundKkm,stars:2};
if(value>=40)return{id:'poor',label:'Ayo Berlatih Lagi',description:'Tidak apa-apa, yuk pelajari lagi dan coba kembali.',icon:'💪',sound:AUDIO.poor[Math.random()<.5?0:1],stars:1};
return{id:'very-poor',label:'Yuk Coba Lagi!',description:'Mulai pelan-pelan. Kamu pasti bisa lebih baik!',icon:'🌱',sound:AUDIO.veryPoor,stars:0}}

function showGradeOverlay(grade){const old=document.querySelector('.answer-overlay');if(old)old.remove();
const overlay=document.createElement('div');overlay.className=`answer-overlay grade-${grade.id}`;overlay.setAttribute('role','status');overlay.setAttribute('aria-live','assertive');
overlay.innerHTML=`<div class="answer-overlay-card"><span class="answer-overlay-icon">${grade.icon}</span><b>${grade.label}</b><small>${grade.description}</small></div>`;
document.body.append(overlay);let removed=false;const remove=()=>{if(!removed){removed=true;overlay.remove()}};
overlay.addEventListener('animationend',remove,{once:true});setTimeout(remove,2400)}

function check(){if(st.done)return next();const q=Q[i];let ok,right,n,pts=0;
if(q.type=='mcq'){if(st.sel==null)return warn('Pilih satu jawaban dulu ya! 😊');ok=st.sel==q.a;right=q.o[q.a];
document.querySelectorAll('.opt').forEach((b,j)=>{if(j==q.a)b.classList.add('ok');else if(j==st.sel)b.classList.add('no')})}
else if(q.type=='fill'){const u=norm(g('fi').value);if(!u)return warn('Ketik jawabannya dulu ya! ✍️');ok=q.a.some(a=>norm(a)==u);right=q.a[0]}
else if(q.type=='order'){if(st.ans.length<q.w.length)return warn('Susun semua katanya dulu ya! 🧩');ok=[q.a,...(q.alt||[])].some(a=>norm(a)==norm(st.ans.map(k=>q.w[k]).join(' ')));right=q.a}
else if(q.type=='speak'){stopVoice();if(!st.heard)return warn('Tekan 🎤 dan ucapkan dulu ya! 🗣️');const r=speakScore(q,st.alts);ok=r.ok;pts=ok?PTS:q.mode=='read'&&r.score>=.5?PTS*r.score:0;right=q.target}
else{const v=q.p.map((p,k)=>st.m[k]||'');if(v.includes(''))return warn('Pilih arti untuk semua kata dulu ya! 🔗');n=v.filter((x,k)=>x==q.p[k][1]).length;ok=n==q.p.length;pts=PTS*n/q.p.length;right=q.p.map(p=>p[0]+' = '+p[1]).join('; ');
document.querySelectorAll('.ddb').forEach((b,k)=>{const r=v[k]==q.p[k][1];b.classList.add(r?'ok':'no');if(!r)b.insertAdjacentHTML('afterend',`<span class="fix">✔ ${esc(q.p[k][1])}</span>`)})}
if(q.type!='match'&&ok)pts=PTS;
st.done=true;score+=pts;res.push({t:q.t,pts});saveSession('quiz');g('body').classList.add('locked');
g('fb').innerHTML=`<div class="fb ${ok?'ok':pts>0?'part':'no'}">${ok?`🎉 <b>Benar! +${fmt(pts)} poin</b>`:pts>0?`👍 <b>${q.type=='speak'?'Hampir benar!':`${n} dari ${q.p.length} pasangan benar!`} +${fmt(pts)} poin</b>`:'😅 <b>Belum tepat (0 poin).</b>'}${ok?'':`<br>Jawaban benar: <b>${esc(right)}</b>`}${q.type=='speak'?`<br>🎤 Terdengar: <b>${esc(st.heard)}</b>`:''}${q.listenText?`<br>🔊 Kalimat yang dibacakan: <b>${esc(q.listenText)}</b>`:''}<br>💡 ${esc(q.e)}</div>`;
showAnswerOverlay(ok,!ok&&pts>0);playAnswerSound(ok);
g('fb').scrollIntoView?.({block:'nearest',behavior:'smooth'});g('chk').textContent=i==Q.length-1?'Lihat Hasil 🏆':'Lanjut ➜'}

function next(){i++;i<Q.length?show():end()}

function end(){saveSession('result');window.scrollTo(0,0);const pr=best();if(score>pr)try{localStorage.setItem(bk(),score)}catch(e){}
const grade=gradeForScore(score);
A.innerHTML=`<div class="wrap"><section class="card"><div class="stars">${'⭐'.repeat(grade.stars)||'🌱'}</div><div class="score">${fmt(score)}<small> / 100</small></div>
<h2 style="text-align:center">${grade.icon} ${grade.label}</h2><p class="sub" style="text-align:center">${grade.description}</p>${score>pr&&pr?'<p class="sub" style="text-align:center">🎊 Skor terbaik baru!</p>':''}
<div class="bd">${[1,2,3].map(t=>{const c=res.filter(r=>r.t==t).reduce((a,r)=>a+r.pts,0);return `<div class="badge l${t}">${LV[t][2]} ${LV[t][0]}<small>${fmt(c)} dari ${fmt(PER[t]*PTS)} poin</small></div>`}).join('')}</div>
<button class="btn go" onclick="start()">Main Lagi (soal baru) 🔄</button><button class="btn alt" onclick="learn()">📘 Baca Materi</button><button class="btn alt" onclick="home()">🏠 Beranda</button></section></div>`;
showGradeOverlay(grade);playEffect(grade.sound)}
if(!restoreSession()){home();initMic()}
