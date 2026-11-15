// Soal tetap (tidak diacak). Fase 1 = 10 soal latihan "How often" (nilai maks 100, 10 poin/soal). Fase 2 = 5 pasangan asesmen (dinilai terpisah, target 4 dari 5).
// t = level (1 Pagi, 2 Siang, 3 Malam). n = id unik. fb = soal pengganti untuk soal speaking bila mikrofon tidak bisa dipakai.
// Fase 2 (type:'pair'): qi = pertanyaan Indonesia; eq/ea/f = contoh pertanyaan, jawaban, frekuensi (untuk koreksi); qd = pengecoh pertanyaan; aw = semua kartu jawaban; short = boleh jawaban singkat Yes/No.
const FREQ_ANSWERS=['Every day','Once a week','Twice a week','Three times a week','Once a day','Twice a day','Always','Usually','Often','Sometimes','Rarely','Never'];
const BANK=[
// ===== FASE 1 · PAGI =====
{n:'a1',pos:2,t:1,type:'mcq',q:'Apa arti “How often”?',o:['Seberapa sering','Jam berapa','Di mana','Siapa'],a:0,e:'How often = seberapa sering. Dijawab dengan frekuensi, misalnya twice a week.'},
{n:'a2',t:1,type:'tf',q:'“Never” artinya “sering”.',a:false,e:'Never = tidak pernah. “Sering” dalam bahasa Inggris adalah often.'},
{n:'a3',t:1,type:'fill',q:'How ___ do you brush your teeth?',id:'Seberapa sering kamu menyikat gigi?',a:['often'],e:'How often = seberapa sering.'},
{n:'a4',t:1,type:'order',q:'Susun kalimat bahasa Inggris untuk: “Seberapa sering kamu membaca?”',w:['How','often','do','you','read'],a:'How often do you read',e:'Pola: How often + do + you + kata kerja dasar.'},
// ===== FASE 1 · SIANG =====
{n:'a5',t:2,type:'match',q:'Pasangkan ungkapan frekuensi dengan artinya.',p:[['once a day','Sekali sehari'],['twice a week','Dua kali seminggu'],['every evening','Setiap malam'],['three times a year','Tiga kali setahun']],e:'Once = 1 kali, twice = 2 kali, three times = 3 kali.'},
{n:'a6',t:2,k:'speak',type:'speak',mode:'read',q:'Baca kalimat ini dengan suara jelas.',target:'How often do you play games?',id:'Seberapa sering kamu bermain game?',e:'How often + do + you + kata kerja dasar.',
 fb:{n:'a6f',t:2,type:'fill',q:'How ___ does she read?',id:'Seberapa sering dia membaca?',a:['often'],e:'How often = seberapa sering.'}},
{n:'a7',pos:3,t:2,type:'mcq',q:'How often ___ he play badminton?',id:'Seberapa sering dia bermain bulu tangkis?',o:['do','does','is','are'],a:1,e:'He memakai does: How often does he play?'},
// ===== FASE 1 · MALAM =====
{n:'a8',pos:1,t:3,k:'listen',type:'mcq',listenText:'Nina swims twice a week.',q:'Which question matches the sentence?',id:'Pertanyaan mana yang cocok dengan kalimat yang kamu dengar?',o:['How often does Nina swim?','How often do Nina swim?','How often does Nina swims?','How much does Nina swim?'],a:0,e:'Nina swims twice a week → How often does Nina swim? (setelah does, kata kerja tanpa s).'},
{n:'a9',t:3,k:'speak',type:'speak',mode:'answer',extra:5,q:'Jawab pertanyaan ini: “How often do you do your homework?”',target:'Every day.',accept:FREQ_ANSWERS,id:'Seberapa sering kamu mengerjakan PR?',e:'Jawab dengan frekuensi: every day, once a week, dll.',
 fb:{n:'a9f',t:3,type:'fill',q:'How often ___ your brother help you?',id:'Seberapa sering kakakmu membantumu?',a:['does'],e:'Your brother = he, jadi memakai does.'}},
{n:'a10',pos:0,t:3,type:'mcq',q:'Pilih pertanyaan yang benar.',id:'Seberapa sering dia (perempuan) berenang?',o:['How often does she swim?','How often do she swim?','How often does she swims?','How often she swim?'],a:0,e:'How often + does + she + kata kerja dasar (tanpa s).'},
// ===== FASE 2 · ASESMEN: 5 pasangan tanya-jawab (siswa menyusun pertanyaan DAN jawaban sendiri; jawaban bebas asal ada frekuensi) =====
{n:'p1',t:3,type:'pair',q:'Susun pertanyaan dan jawabannya dalam bahasa Inggris.',qi:'Seberapa sering kamu bermain sepak bola?',
 eq:'How often do you play football',aux:'do',subj:'you',verb:'play',ea:'I play football',sa:'I',vf:'play',f:'once a week',
 qd:['does','plays','your'],aw:['I','play','football','once','twice','three','times','a','week','day','every','always','plays','my','you'],e:'You → do + kata kerja dasar. Contoh jawaban: I play football once a week.'},
{n:'p2',t:3,type:'pair',q:'Susun pertanyaan dan jawabannya dalam bahasa Inggris.',qi:'Seberapa sering kamu mencuci tangan?',
 eq:'How often do you wash your hands',aux:'do',subj:'you',verb:'wash',ea:'I wash my hands',sa:'I',vf:'wash',f:'three times a day',
 qd:['does','washes','my'],aw:['I','wash','my','hands','three','times','twice','once','a','day','week','every','washes','your','always'],e:'You → do. Saat menjawab, you → I dan your → my. Contoh: I wash my hands three times a day.'},
{n:'p3',t:3,type:'pair',q:'Susun pertanyaan dan jawabannya dalam bahasa Inggris.',qi:'Seberapa sering mereka menonton TV?',
 eq:'How often do they watch TV',aux:'do',subj:'they',verb:'watch',ea:'They watch TV',sa:'They',vf:'watch',f:'every Sunday',
 qd:['does','watches','we'],aw:['They','watch','TV','every','day','Sunday','twice','a','week','watches','we','often','always'],e:'They → do + kata kerja dasar. Contoh: They watch TV every Sunday.'},
{n:'p4',t:3,type:'pair',q:'Susun pertanyaan dan jawabannya dalam bahasa Inggris.',qi:'Seberapa sering dia (perempuan) belajar bahasa Inggris?',short:true,
 eq:'How often does she study English',aux:'does',subj:'she',verb:'study',ea:'She studies English',sa:'She',vf:'studies',f:'every day',
 qd:['do','studies','he'],aw:['She','studies','English','every','day','twice','a','week','study','he','Yes','No','does',"doesn't",'always'],e:'Pertanyaan: does + she + study (tanpa s). Jawaban: She studies... (study → studies), atau jawaban singkat Yes, she does. / No, she doesn’t.'},
{n:'p5',t:3,type:'pair',q:'Susun pertanyaan dan jawabannya dalam bahasa Inggris.',qi:'Seberapa sering dia (laki-laki) pergi ke perpustakaan?',short:true,
 eq:'How often does he go to the library',aux:'does',subj:'he',verb:'go',ea:'He goes to the library',sa:'He',vf:'goes',f:'twice a month',
 qd:['do','goes','she'],aw:['He','goes','to','the','library','twice','a','month','once','week','every','go','she','Yes','No','does',"doesn't"],e:'Pertanyaan: does + he + go (tanpa es). Jawaban: He goes... (go → goes), atau jawaban singkat Yes, he does. / No, he doesn’t.'},
];
const ALL=BANK.concat(BANK.filter(q=>q.fb).map(q=>q.fb));
BANK.forEach(q=>{if(q.type==='tf'){q.k='tf';q.type='mcq';q.o=['✅ True (Benar)','❌ False (Salah)'];q.a=q.a?0:1}});
// Susun kalimat: tampilkan arti Indonesia saja, jangan bocorkan urutan benar. Kartu kata dibuat otomatis.
BANK.forEach(q=>{if(q.type==='pair'){q.qw=[...q.eq.split(' '),...q.qd];}});
if(typeof module!=='undefined'&&module.exports)module.exports={BANK,ALL,FREQ_ANSWERS};
