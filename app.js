const A=document.getElementById('app'),g=id=>document.getElementById(id);
const PER={1:4,2:3,3:3},PTS=10;
const KKM=80,BG_VOLUME=.18;
const AUDIO={background:new Audio('sfx/bgSound.mp3'),correct:new Audio('sfx/correct.mp3'),wrong:new Audio('sfx/wrong.mp3'),aboveKkm:new Audio('sfx/diatasKKM.mp3'),aroundKkm:new Audio('sfx/sekitarKKM.mp3'),poor:[new Audio('sfx/fail1.mp3'),new Audio('sfx/fail2.mp3')],veryPoor:new Audio('sfx/extraFail.mp3')};
AUDIO.background.loop=true;AUDIO.background.volume=BG_VOLUME;
Object.values(AUDIO).flat().forEach(audio=>{audio.preload='auto';audio.load()});
let currentEffect=null;
let effectSequence=0;
let backgroundRequested=false;
const LV={1:['Pagi','Mudah','☀️'],2:['Siang','Sedang','🌤️'],3:['Malam','Menantang','🌙']};
const TYPE={pair:'Asesmen',mcq:'Pilihan ganda',tf:'Benar atau salah',fill:'Isi titik-titik',order:'Susun kalimat',match:'Jodohkan',listen:'Menyimak',speak:'Speaking'};
const INS={pair:'Baca pertanyaan bahasa Indonesia. Susun pertanyaan dan jawabanmu sendiri dalam bahasa Inggris. Tidak semua kartu dipakai, hati-hati kartu pengecoh!',mcq:'Pilih satu jawaban yang paling tepat.',tf:'Baca pernyataan, lalu pilih True (Benar) atau False (Salah).',fill:'Ketik kata yang hilang. Tiap garis _ adalah satu huruf.',order:'Ketuk kata-kata di bawah sesuai urutan, sampai menjadi kalimat yang benar.',match:'Pilih arti yang tepat untuk setiap kata. Setiap pasangan yang benar tetap mendapat poin!',listen:'Tekan tombol untuk mendengarkan kalimat, lalu pilih jawaban yang tepat. Kalimat dapat diputar ulang.',speak:'Tekan 🎤 lalu ucapkan dengan suara jelas. Boleh coba lagi sebelum diperiksa.'};
const patH=(a,value='')=>{let index=0;const letters=value.toUpperCase().replace(/[^A-Z]/g,'');return a.split(' ').map(w=>`<span class="pw">${[...w].map(c=>`<span class="lt">${/[a-z]/i.test(c)?esc(letters[index++]||'_'):esc(c)}</span>`).join('')}</span>`).join('&nbsp;')};
const fmt=n=>String(Math.round(n*10)/10).replace('.',',');
const SKY=[['#ffd6a5','🌅','#ffeacf'],['#ffe69a','☀️','#fff4c4'],['#ffee9e','☀️','#fff8d0'],['#d6efff','☀️','#eef9ff'],['#b9e1ff','🌤️','#e1f2ff'],['#ffcf9f','⛅','#ffe9d3'],['#c7a8e8','🌇','#efe4fb'],['#4b4f9e','🌙','#323776'],['#2f3470','🌙','#242859'],['#1f2350','🌙','#191c42']];
function theme(n){const b=document.body,s=SKY[n<0?1:Math.round(n/(Q.length-1)*9)],dark=n>=0&&Q[n].t==3,card=n<0?s[2]:dark?'#323776':Q[n].t==2?'#d6efff':'#fff4c4';b.style.setProperty('--bg',s[0]);b.style.setProperty('--card',card);b.classList.toggle('dark',dark);g('sky').textContent=n<0?'☀️':s[1];window.scrollTo(0,0)}
let Q=[],i=0,score=0,res=[],st={},submissionReceipt=null,submissionToken=null;
const shuf=a=>{a=[...a];for(let j=a.length-1;j>0;j--){const k=Math.random()*(j+1)|0;[a[j],a[k]]=[a[k],a[j]]}return a};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const NAME='Peserta anonim';
try{localStorage.removeItem('eh_name');localStorage.setItem('eh_anon_v1','1');['eh_question_history_v1','eh_listening_bag_v1','eh_session_v1'].forEach(k=>localStorage.removeItem(k))}catch(e){}
const bk=()=> 'eh_best_anonymous';
const best=()=>{try{return +localStorage.getItem(bk())||0}catch(e){return 0}};
let introSeen={};
const INTRO={0:['🦉','Fase 1: Latihan','Ada <b>10 soal</b> tentang <b>How often</b>. Mulai dari mengenali arti, melengkapi, menyusun kata, memilih do/does, sampai menyimak dan berbicara. Jika jawaban belum tepat, kamu mendapat petunjuk dan satu kesempatan mencoba lagi.','Mulai Latihan'],10:['✍️','Fase 2: Asesmen','Buat <b>5 pasang</b> pertanyaan dan jawaban dari kartu kata. Setiap petunjuk memberi tahu kegiatan dan frekuensinya. Bagian ini dikerjakan sendiri, tanpa contoh atau petunjuk jawaban, dan hanya satu kali percobaan. Target: <b>minimal 4 dari 5 pasangan benar</b>.','Mulai Asesmen']};
function introDialog(k){closeMicDialog();introSeen[k]=1;const[ic,t,p,b]=INTRO[k],d=document.createElement('div');d.className='mic-dialog';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
d.innerHTML=`<div class="mic-dialog-card"><div class="mic-owl">${ic}</div><h2>${t}</h2><p>${p}</p><button class="btn go" type="button" onclick="closeMicDialog()">${b}</button></div>`;document.body.append(d)}

function home(skipQueue){if(!skipQueue&&canSubmitResults()&&!submissionReceipt)try{EHSubmission.queue(submissionPayload())}catch(error){return warn(error.message)}
clearSession();theme(-1);setTimeout(updateMicNote);
let pending=[],pendingError='';try{pending=EHSubmission.getPending()}catch(error){pendingError=error.message}
A.innerHTML=`<section class="hero"><div class="mascot">🦉<span>⏰</span></div><div><div class="brand"><img class="logo" src="logo.svg" alt="Logo Everyday Habits" width="48" height="48"><span>Everyday Habits</span></div><h1>Halo, Teman Pintar!</h1>
<p class="sub">Yuk belajar kebiasaan sehari-hari dalam bahasa Inggris. Seru, mudah, dan ada bintangnya!</p>
<p class="sub"><b>Tujuan belajar:</b> membuat pertanyaan dan jawaban How often tentang rutinitas dengan susunan kata dan frekuensi yang tepat.</p>
<p class="sub"><b>Tidak perlu menulis nama, email, atau nomor telepon.</b> Hasil disimpan secara anonim dengan kode peserta setelah kamu menyelesaikan latihan dan asesmen.</p>


${pendingError?`<div class="fb part">${esc(pendingError)}</div>`:pending.length?`<section class="card pending-results"><h2>📤 Hasil belum terkirim</h2><p class="sub">Hasil tetap tersimpan di browser. Kirim ulang saat internet tersedia.</p>${pending.map(item=>`<button class="btn alt" type="button" onclick="retrySubmission('${esc(item.submission_token)}',this)">Kirim hasil anonim (${new Date(item.created_at).toLocaleString('id-ID')})</button>`).join('')}</section>`:''}
<div id="fb"></div><p id="micnote" class="sub"></p><button class="btn go" onclick="go()">Ayo Mulai! 🚀</button><button class="btn alt" onclick="learn()">📘 Belajar Dulu</button>
${best()?`<p class="best">🏆 Skor terbaikmu: <b>${fmt(best())}</b></p>`:''}</div></section>
<section class="steps"><div><b>✍️ 10 latihan + 5 asesmen</b><span>Latihan bertahap menuju kemampuan membuat pasangan How often.</span></div><div><b>⭐ Latihan maks 100</b><span>Asesmen: target minimal 4 dari 5 pasangan benar.</span></div><div><b>☀️ → 🌤️ → 🌙</b><span>Soal latihan makin lama makin menantang.</span></div></section>`}

function go(){closeMicDialog();startBackgroundMusic();requestMicPermission().then(start)}

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
<section class="card"><h2>🔊🎤 Tips Menyimak & Speaking</h2>
<div class="tip">🔊 Dengarkan <b>kata penting</b>: jam (four o'clock), kegiatan (brush, homework), dan frekuensi (twice a week). Kalimat dapat diputar ulang.</div>
<div class="tip">🎤 Baca pelan dan jelas, satu kata demi satu kata. Ucapkan <b>semua kata</b> dan jangan menambah kata lain.</div>
<div class="tip">🔊 Pada soal menyimak, browser membacakan kalimat dalam bahasa Inggris. Pada Speaking, tekan "Dengar Contoh" untuk mendengar contoh jawaban. Jawaban singkat: <i>Yes, I do.</i> atau <i>No, I don't.</i></div></section>
<button class="btn go" onclick="home()">Siap! Kembali ke Beranda 🏠</button></div>`}

function build(){const ok=speechUsable();return BANK.map(q=>q.k=='speak'&&!ok?q.fb:q)}
function start(){if(canSubmitResults()&&!submissionReceipt)try{EHSubmission.queue(submissionPayload())}catch(error){return warn(error.message)}
let nextToken;try{nextToken=EHSubmission.createToken()}catch(error){return warn(error.message)}
startBackgroundMusic();introSeen={};Q=build();i=0;score=0;res=[];submissionReceipt=null;submissionToken=nextToken;show()}

function show(){const q=Q[i],[l,n,ic]=LV[q.t],restored=restoringSession,pair=q.type=='pair',p2sum=res.filter(r=>r.ph==2).reduce((a,r)=>a+r.pts,0);stopVoice();restoringSession=false;theme(i);st={sel:null,ans:[],m:[],done:false,fillMode:false,heard:'',alts:[],tries:0,attempts:restored?restoredAttempts:0};restoredAttempts=0;
saveSession('quiz');q.G=q.type=='order'?[{w:q.w}]:pair?[{w:q.qw},{w:q.aw}]:0;if(q.G){q.G.forEach(x=>x.sh=shuf(x.w.map((w,k)=>[w,k])));st.ans=q.G.map(()=>[])}
if(q.type=='mcq'){const oo=q.o.map((o,k)=>[o,k]);if(q.k=='tf')q.oo=oo;else{const c=oo.splice(q.a,1)[0],r=shuf(oo);r.splice(q.pos??Math.random()*(r.length+1)|0,0,c);q.oo=r}}
q.sh=q.type=='match'?shuf(q.p.map(p=>p[1])):0;
A.innerHTML=`<div class="wrap"><div class="hi-row"><button class="home-btn" type="button" onclick="confirmHome()" aria-label="Kembali ke beranda">🏠 Beranda</button><p class="hi">Semangat, Teman Pintar! 💪</p></div><div class="top"><div class="badge l${q.t}">${pair?'✍️ Fase 2 – Asesmen':`${ic} ${l} – ${n}`}</div><div class="sc">${pair?`🎯 ${p2sum}/100`:`⭐ ${fmt(score)}`}</div></div>
<div class="prog">${Q.map((x,k)=>`<i class="l${x.t} ${k<i?'on':k==i?'cur':''}"></i>`).join('')}</div>
<section class="card quiz-card"><p class="hint">${pair?`Pasangan ${i-9} dari 5 · Asesmen`:`Soal ${i+1} dari 10 · Kesulitan ${'●'.repeat(q.t)}${'○'.repeat(3-q.t)} · ${q.k?TYPE[q.k]:TYPE[q.type]} · ${q.type=='match'?`maks ${fmt(PTS)} poin (${fmt(PTS/q.p.length)} per pasangan)`:`${fmt(PTS)} poin`}`}</p><h2>${esc(q.q)}</h2><p class="ins">👉 ${INS[q.k||q.type]}</p>${q.id?`<p class="idn">💬 ${esc(q.id)}</p>`:''}
<div id="body">${body(q)}</div><div id="fb"></div><button class="btn go" id="chk" onclick="check()">Periksa Jawaban</button></section></div>`;
if(q.G)draw();if(!restored&&INTRO[i]&&!introSeen[i])introDialog(i)}

function body(q){
if(q.type=='mcq')return `${q.listenText?'<button class="btn alt listen-btn" type="button" onclick="sayListening()">🔊 Dengarkan Kalimat</button>':''}<div class="opts">${q.oo.map((o,k)=>`<button class="opt" onclick="pick(${k})">${esc(o[0])}</button>`).join('')}</div>`;
if(q.type=='fill')return `<div id="pat" class="pat">${patH(q.a[0])}</div><input id="fi" class="inp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" oninput="fillInput()" onkeydown="if(event.key==='Enter')check()" maxlength="${Math.max(...q.a.map(a=>a.length))+4}" placeholder="Ketik jawabanmu di sini…">`;
if(q.type=='order')return `<div id="ans0" class="ans" data-g="0"></div><div id="bank0" class="bank" data-g="0"></div><p class="hint">Seret kata untuk menyusun, atau ketuk kata untuk memilih dan membatalkan.</p>`;
if(q.type=='pair')return [['❓ Tanya',q.qi],['💬 Jawab','Tulis jawabanmu sendiri dalam bahasa Inggris']].map((x,gi)=>`<div class="pair-sec"><p class="pl">${x[0]}: <b>${esc(x[1])}</b></p><div id="ans${gi}" class="ans" data-g="${gi}"></div><div id="bank${gi}" class="bank" data-g="${gi}"></div></div>`).join('')+'<p class="hint">Seret kata untuk menyusun, atau ketuk kata untuk memilih dan membatalkan. Kartu pengecoh tidak perlu dipakai.</p>';
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
function draw(){const q=Q[i];q.G.forEach((G,gi)=>{g('ans'+gi).innerHTML=st.ans[gi].map(k=>`<button class="chip" data-g="${gi}" data-word="${k}" onclick="mv(${gi},${k},0)">${esc(G.w[k])}</button>`).join('');
g('bank'+gi).innerHTML=G.sh.filter(([w,k])=>!st.ans[gi].includes(k)).map(([w,k])=>`<button class="chip" data-g="${gi}" data-word="${k}" onclick="mv(${gi},${k},1)">${esc(w)}</button>`).join('')})}
function mv(gi,k,add){if(st.done)return;st.ans[gi]=add?[...st.ans[gi],k]:st.ans[gi].filter(x=>x!=k);draw()}
let wordDrag=null;
const zoneAt=(x,y,gi)=>{const z=document.elementFromPoint(x,y)?.closest('.ans,.bank');return z&&Number(z.dataset.g)===gi?z:null};
const clearDrop=()=>document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
document.addEventListener('pointerdown',e=>{const chip=e.target.closest('.chip'),zone=chip?.parentElement;if(!chip||!zone||!zone.matches('.ans,.bank')||st.done)return;
const rect=chip.getBoundingClientRect();wordDrag={id:Number(chip.dataset.word),g:Number(chip.dataset.g),from:zone.classList.contains('ans')?'ans':'bank',pointerId:e.pointerId,x:e.clientX,y:e.clientY,offsetX:e.clientX-rect.left,offsetY:e.clientY-rect.top,moved:false,chip,ghost:null};chip.setPointerCapture?.(e.pointerId)});
document.addEventListener('pointermove',e=>{if(!wordDrag||e.pointerId!==wordDrag.pointerId)return;
if(!wordDrag.moved&&Math.hypot(e.clientX-wordDrag.x,e.clientY-wordDrag.y)<8)return;
if(!wordDrag.moved){wordDrag.moved=true;wordDrag.chip.classList.add('dragging');wordDrag.ghost=wordDrag.chip.cloneNode(true);wordDrag.ghost.classList.remove('dragging');wordDrag.ghost.classList.add('drag-ghost');document.body.append(wordDrag.ghost)}
wordDrag.ghost.style.left=`${e.clientX-wordDrag.offsetX}px`;wordDrag.ghost.style.top=`${e.clientY-wordDrag.offsetY}px`;e.preventDefault();const zone=zoneAt(e.clientX,e.clientY,wordDrag.g);
document.querySelectorAll('.drop-target').forEach(el=>{if(el!==zone)el.classList.remove('drop-target')});zone?.classList.add('drop-target')});
document.addEventListener('pointerup',e=>{if(!wordDrag||e.pointerId!==wordDrag.pointerId)return;
const drag=wordDrag;wordDrag=null;drag.chip.classList.remove('dragging');drag.ghost?.remove();clearDrop();
if(!drag.moved)return;
const zone=zoneAt(e.clientX,e.clientY,drag.g);if(!zone||st.done)return;const gi=drag.g;let arr=st.ans[gi];
if(zone.classList.contains('bank')){if(drag.from=='ans')st.ans[gi]=arr.filter(k=>k!==drag.id);else return}
else{const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.chip'),targetId=target&&target.parentElement==zone?Number(target.dataset.word):null;
if(drag.from=='ans'){if(!arr.includes(drag.id)||targetId===drag.id)return;arr=st.ans[gi]=arr.filter(k=>k!==drag.id)}
if(targetId!==null){const targetIndex=arr.indexOf(targetId);if(targetIndex<0)return;arr.splice(targetIndex,0,drag.id)}
else arr.push(drag.id)}
draw()});
document.addEventListener('pointercancel',e=>{if(wordDrag?.pointerId===e.pointerId){wordDrag.chip.classList.remove('dragging');wordDrag.ghost?.remove();wordDrag=null;clearDrop()}});
function tg(k){if(st.done)return;document.querySelectorAll('.ddl').forEach((u,j)=>u.hidden=j==k?!u.hidden:true)}
function sv(k,j){const v=Q[i].sh[j];st.m[k]=v;const b=document.querySelectorAll('.ddb')[k];b.textContent=v;b.classList.add('set');document.querySelectorAll('.ddl').forEach(u=>u.hidden=true);document.querySelectorAll('.ddl li button').forEach(x=>x.classList.toggle('used',st.m.includes(x.dataset.v)))}
document.addEventListener('click',e=>{if(!e.target.closest('.dd'))document.querySelectorAll('.ddl').forEach(u=>u.hidden=true)});
document.addEventListener('keydown',e=>{if(e.key=='Escape')document.querySelectorAll('.ddl').forEach(u=>u.hidden=true)});
function warn(m){const target=g('fb')||g('submit-feedback');if(!target){console.warn(m);return}
target.innerHTML=`<div class="fb part">${esc(m)}</div>`;target.scrollIntoView?.({block:'nearest',behavior:'smooth'})}

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
function swapSpeaking(){const q=Q[i];if(!q.fb)return;stopVoice();Q[i]=q.fb;show()}
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
const SESSION_KEY='eh_session_v3',SESSION_MAX_AGE=12*60*60*1000;
let restoringSession=false,restoredAttempts=0;
function saveSession(view){try{localStorage.setItem(SESSION_KEY,JSON.stringify(view=='learn'?{view,ts:Date.now()}:{view,keys:Q.map(q=>q.n),i,score,res,receipt:submissionReceipt,submissionToken,answered:!!st.done,attempts:st.attempts||0,ts:Date.now()}))}
catch(error){console.error('Gagal menyimpan progres lokal:',error);warn('Progres tidak bisa disimpan di browser ini. Jangan tutup halaman sebelum hasil dikirim.');}}
function clearSession(){try{localStorage.removeItem(SESSION_KEY)}catch(e){}}
function restoreSession(){let data;try{data=JSON.parse(localStorage.getItem(SESSION_KEY))}catch(e){console.error('Gagal membaca progres lokal:',e)}
if(!data||!data.ts||Date.now()-data.ts>SESSION_MAX_AGE){clearSession();return false}
if(data.view=='learn'){learn();return true}
const byKey=new Map(ALL.map(q=>[q.n,q])),restored=(data.keys||[]).map(key=>byKey.get(key));
if(restored.length!=BANK.length||restored.some(q=>!q)||!Number.isInteger(data.i)||!Array.isArray(data.res)||!Number.isFinite(data.score)){clearSession();return false}
Q=restored;score=data.score;res=data.res;submissionReceipt=data.receipt||null;submissionToken=data.submissionToken||null;restoredAttempts=Number.isInteger(data.attempts)?Math.max(0,Math.min(1,data.attempts)):0;i=data.i;
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

const pair2=q=>q.type=='pair';
const PAIR_PTS=20,PAIR_TARGET=4;
// Petunjuk berdasarkan aturan, tanpa menyebut kata jawaban yang tepat.
function pairHints(q,r){
  const hints={
    c1:'Mulai dengan How often. Periksa do/does dan siapa pelakunya.',
    c2:'Periksa kata kerja setelah subjek pada pertanyaan dan bentuk kata kerja pada jawaban.',
    c3:'Lihat petunjuk dalam tanda kurung. Frekuensinya harus sama, misalnya sekali seminggu atau dua kali sebulan.'
  };
  return{c1:hints.c1,c2:hints.c2,c3:hints.c3};
}
function practiceHint(q){
  const hints={
    a1:'How often menanyakan seberapa sering suatu kegiatan dilakukan.',
    a2:'Ingat arti never dan often. Apakah keduanya mempunyai arti yang sama?',
    a3:'Pikirkan ungkapan bahasa Inggris untuk “seberapa sering”.',
    a4:'Mulai dengan How often. Setelah itu gunakan kata bantu, subjek, lalu kata kerja dasar.',
    a5:'Once berarti satu kali, twice berarti dua kali. Perhatikan juga day, week, dan year.',
    a6:'Ucapkan pertanyaan perlahan. Perhatikan bunyi “How often”.',
    a6f:'How often berarti “seberapa sering”.',
    a7:'He adalah satu orang. Ingat kata bantu untuk he, she, atau it.',
    a8:'Nina adalah satu orang. Setelah does, kata kerja kembali ke bentuk dasar.',
    a9:'Jawab dengan ungkapan frekuensi, misalnya setiap hari atau dua kali seminggu.',
    a9f:'Your brother berarti he. Ingat kata bantu yang digunakan untuk he.',
    a10:'She adalah satu orang. Setelah does, gunakan kata kerja tanpa tambahan s.'
  };
  return hints[q.n]||'Baca kembali pertanyaan dan periksa pola How often.';
}

function check(){
  if(st.done)return next();
  const q=Q[i];let answer,ok=false,right='',n,pts=0,pairHtml='',pairPts=0;
  if(q.type==='mcq'){
    if(st.sel==null)return warn('Pilih satu jawaban dulu ya!');
    answer={selected:q.oo[st.sel][0]};right=q.o[q.a];
  }else if(q.type==='fill'){
    const text=g('fi').value.trim();if(!EHScoring.normalize(text))return warn('Ketik jawabannya dulu ya!');
    answer={text};right=q.a[0];
  }else if(q.type==='order'){
    if(st.ans[0].length<q.w.length)return warn('Susun semua katanya dulu ya!');
    answer={words:st.ans[0].map(k=>q.w[k])};right=q.a;
  }else if(q.type==='pair'){
    if(!st.ans[0].length||!st.ans[1].length)return warn('Susun pertanyaan dan jawabannya dulu ya!');
    const [question,response]=st.ans.map((a,gi)=>a.map(k=>q.G[gi].w[k]).join(' '));
    answer={question,answer:response};right=q.eq;
    const graded=EHScoring.gradeAnswer(q,answer),r=graded.details;ok=graded.ok;pts=graded.points;pairPts=pts;
    const H=pairHints(q,r),line=(good,label,hint)=>`<br>${good?'✅':'⚠️'} ${label}${good?'':`<br><small>💡 ${hint}</small>`}`;
    pairHtml=`<div class="fb ${ok?'ok':pairPts>0?'part':'no'}">${ok?'🎉 <b>Pasangan ini benar!</b>':'😅 <b>Pasangan ini belum tepat.</b>'} <b>+${pairPts} poin</b>${line(r.c1,'Susunan How often, do/does, dan subjek',H.c1)}${line(r.c2,'Bentuk kata kerja pada pertanyaan dan jawaban',H.c2)}${line(r.c3,'Makna ungkapan frekuensi',H.c3)}</div>`;
  }else if(q.type==='speak'){
    stopVoice();if(!st.heard)return warn('Tekan tombol mikrofon dan ucapkan dulu.');
    answer={transcript:st.heard,alternatives:st.alts};right=q.target;
  }else{
    const matches=q.p.map((p,k)=>st.m[k]||'');if(matches.includes(''))return warn('Pilih arti untuk semua kata dulu.');
    answer={matches};right=q.p.map(p=>p[0]+' = '+p[1]).join('; ');
  }
  const graded=q.type==='pair'?null:EHScoring.gradeAnswer(q,answer);
  if(graded){ok=graded.ok;pts=graded.points;n=graded.correctCount}

  // Fase 1 memberi satu petunjuk dan satu kesempatan mencoba lagi. Asesmen (pair) tetap satu percobaan.
  if(q.type!=='pair'&&!ok&&st.attempts===0){
    st.attempts=1;
    g('fb').innerHTML=`<div class="fb part">Belum tepat. ${esc(practiceHint(q))}<br><b>Coba sekali lagi.</b></div>`;
    g('chk').textContent='Coba Lagi';
    saveSession('quiz');
    playAnswerSound(false);
    return;
  }

  if(q.type==='mcq'){
    document.querySelectorAll('.opt').forEach((b,j)=>{
      if(q.oo[j][1]===q.a)b.classList.add('ok');
      else if(j===st.sel)b.classList.add('no');
    });
  }
  if(q.type==='match'){
    answer.matches.forEach((value,k)=>{
      const b=document.querySelectorAll('.ddb')[k],correct=value===q.p[k][1];
      b.classList.add(correct?'ok':'no');
      if(!correct)b.insertAdjacentHTML('afterend',`<span class="fix">✔ ${esc(q.p[k][1])}</span>`);
    });
  }
  st.done=true;
  if(!pair2(q))score+=pts;
  res.push({t:q.t,pts,ok,ph:pair2(q)?2:1,n:q.n,ua:userAnswer(q,answer),answer,attempts:pair2(q)?1:st.attempts+1});
  saveSession('quiz');g('body').classList.add('locked');
  g('fb').innerHTML=pairHtml||`<div class="fb ${ok?'ok':pts>0?'part':'no'}">${ok?`🎉 <b>Benar! +${fmt(pts)} poin</b>`:pts>0?`👍 <b>${n} dari ${q.p.length} pasangan benar! +${fmt(pts)} poin</b>`:'😅 <b>Belum tepat (0 poin).</b>'}${ok?'':`<br>Jawaban benar: <b>${esc(right)}</b>`}${q.type==='speak'?`<br>🎤 Terdengar: <b>${esc(st.heard)}</b>`:''}${q.listenText?`<br>🔊 Kalimat yang dibacakan: <b>${esc(q.listenText)}</b>`:''}<br>💡 ${esc(q.e)}</div>`;
  showAnswerOverlay(ok,!ok&&(pts>0||pairPts>0));playAnswerSound(ok);
  g('fb').scrollIntoView?.({block:'nearest',behavior:'smooth'});
  g('chk').textContent=i===Q.length-1?'Lihat Hasil 🏆':'Lanjut ➜';
}

function userAnswer(q,answer){
if(q.type=='mcq')return answer.selected;if(q.type=='fill')return answer.text;if(q.type=='order')return answer.words.join(' ');if(q.type=='speak')return answer.transcript;
if(q.type=='pair')return `${answer.question}? / ${answer.answer}`;return q.p.map((p,k)=>`${p[0]} = ${answer.matches[k]}`).join('; ')}
const correctText=q=>q.type=='mcq'?q.o[q.a]:q.type=='fill'?q.a[0]:q.type=='order'?q.a:q.type=='speak'?q.target:q.type=='pair'?`${q.eq}? / ${q.ea} ${q.f}.`:q.p.map(p=>p[0]+' = '+p[1]).join('; ');
function review(){saveSession('result');window.scrollTo(0,0);
const items=Q.map((q,k)=>{const r=res[k]||{},p2=q.type=='pair',max=p2?PAIR_PTS:PTS,st2=r.ok?'ok':r.pts>0?'part':'no';
return `<section class="card rv ${st2}"><p class="hint">${p2?`✍️ Asesmen · Pasangan ${k-9}`:`📝 Soal ${k+1} · ${LV[q.t][0]} · ${q.k?TYPE[q.k]:TYPE[q.type]}`} · ${r.ok?'✅':r.pts>0?'🌟':'❌'} ${fmt(r.pts||0)}/${fmt(max)} poin</p>
<h3>${esc(p2?`Tanya: ${q.qi}`:q.q)}</h3>${q.listenText?`<p>🔊 Kalimat yang dibacakan: <b>${esc(q.listenText)}</b></p>`:''}${q.id&&!p2?`<p class="idn">💬 ${esc(q.id)}</p>`:''}
<p>Jawabanmu: <b>${esc(r.ua||'-')}</b></p><p>${p2?'Contoh jawaban benar':'Jawaban benar'}: <b>${esc(correctText(q))}</b></p>${p2?'<p class="hint">Jawaban Fase 2 boleh kreatif selama tepat; ini hanya salah satu contoh.</p>':''}<p>💡 ${esc(q.e)}</p></section>`}).join('');
A.innerHTML=`<div class="wrap"><button class="back" onclick="end(true)">⬅ Kembali ke Nilai</button><h2 style="text-align:center">📖 Pembahasan</h2>${items}<button class="btn go" onclick="end(true)">⬅ Kembali ke Nilai</button></div>`}
function next(){i++;i<Q.length?show():end()}

function submissionPayload(){if(!submissionToken)submissionToken=EHSubmission.createToken();return{submission_token:submissionToken,participant_name:NAME,sessions:[
{session_key:'practice',session_number:1,answers:res.filter(result=>result.ph==1).map(result=>({question_key:result.n,answer:result.answer,attempts:result.attempts||1}))},
{session_key:'assessment',session_number:2,answers:res.filter(result=>result.ph==2).map(result=>({question_key:result.n,answer:result.answer,attempts:result.attempts||1}))}
]}}
function canSubmitResults(){return Q.length===BANK.length&&res.length==Q.length&&res.every(result=>result.n&&result.answer&&typeof result.answer=='object')}
async function submitCurrentResults(){
if(!canSubmitResults())return warn('Hasil versi lama belum memiliki detail jawaban yang dibutuhkan. Mainkan ulang untuk mengirim hasil ini.');
if(!window.confirm('Kirim hasil Latihan dan Asesmen ini ke guru?'))return;
const button=document.getElementById('submit-result');if(button){button.disabled=true;button.textContent='Mengirim hasil…'}
try{submissionReceipt=await EHSubmission.submit(submissionPayload());saveSession('result');end(true)}
catch(error){warn(error.message);if(button){button.disabled=false;button.textContent='Kirim Hasil'}}
}
async function retrySubmission(token,button){
if(button){button.disabled=true;button.textContent='Mengirim…'}
try{const receipt=await EHSubmission.send(token);if(token===submissionToken)submissionReceipt=receipt;home(true);warn('Hasil berhasil dikirim!')}
catch(error){warn(error.message);if(button){button.disabled=false;button.textContent='Kirim ulang hasil'}}
}
function end(quiet){window.scrollTo(0,0);
  const p2=res.filter(r=>r.ph===2),t2=p2.reduce((a,r)=>a+r.pts,0),accuratePairs=p2.filter(r=>r.ok).length,targetMet=accuratePairs>=PAIR_TARGET;
  const total=(score+t2)/2,pr=best();if(total>pr)try{localStorage.setItem(bk(),total)}catch(e){}
  if(canSubmitResults()&&!submissionReceipt)try{EHSubmission.queue(submissionPayload())}catch(error){console.error('Hasil belum masuk antrean pengiriman:',error)}
  saveSession('result');
  const grade=gradeForScore(total),row=(a,b)=>`<div class="prow"><span>${a}</span><b>${b}</b></div>`;
  const lv=[1,2,3].map(t=>row(`${LV[t][2]} ${LV[t][0]}`,`${fmt(res.filter(r=>r.t===t&&r.ph!==2).reduce((a,r)=>a+r.pts,0))}/${fmt(PER[t]*PTS)}`)).join('');
  const pr2=p2.map((r,k)=>row(`Pasangan ${k+1}`,`${fmt(r.pts)}/${PAIR_PTS} poin`)).join('');
  A.innerHTML=`<div class="wrap"><section class="card"><div class="stars">${'⭐'.repeat(grade.stars)||'🌱'}</div><p class="sub" style="text-align:center;margin:0">Nilai Akhir (rata-rata Fase 1 dan 2)</p><div class="score">${fmt(total)}<small> / 100</small></div>
  <h2 style="text-align:center">${grade.icon} ${grade.label}</h2><p class="sub" style="text-align:center">${grade.description}</p>${total>pr&&pr?'<p class="sub" style="text-align:center">🎊 Skor terbaik baru!</p>':''}
  <div class="pgrid"><div class="pcard ${score>=KKM?'ok':'no'}"><b>📝 Fase 1: Latihan</b><div class="pscore">${fmt(score)}<small> / 100</small></div>${lv}<p class="pnote">${score>=KKM?`Mencapai KKM (${KKM}) ✅`:`KKM ${KKM}, ayo berlatih lagi`}</p></div>
  <div class="pcard ${targetMet?'ok':'no'}"><b>✍️ Fase 2: Asesmen</b><div class="pscore">${fmt(t2)}<small> / 100</small></div>${pr2}<p class="pnote"><b>${accuratePairs} dari 5 pasangan benar.</b><br>${targetMet?'Target tercapai: minimal 4/5 ✅':'Target belum tercapai. Target minimal 4/5 pasangan.'}</p></div></div>
  ${submissionReceipt?`<div class="fb ok submission-confirmation"><b>✅ Hasil berhasil dikirim!</b></div>`:canSubmitResults()?`<div class="submission-box"><p>Hasil Latihan dan Asesmen lengkap. Kirim hasil anonim ini agar guru dapat melihat ringkasan kelas.</p><div id="submit-feedback"></div><button class="btn go" id="submit-result" onclick="submitCurrentResults()">Kirim Hasil</button><p class="hint">Jika koneksi gagal, hasil tersimpan di browser dan bisa dikirim ulang nanti.</p></div>`:'<div class="fb part">Hasil ini berasal dari sesi lama tanpa detail jawaban. Mainkan ulang untuk mengirim nilai.</div>'}
  <button class="btn go" onclick="start()">Main Lagi 🔄</button><button class="btn alt" onclick="review()">📖 Pembahasan</button><button class="btn alt" onclick="learn()">📘 Baca Materi</button><button class="btn alt" onclick="home()">🏠 Beranda</button></section></div>`;
  if(!quiet){showGradeOverlay(grade);playEffect(grade.sound)}
}


if(!restoreSession()){home();initMic()}
