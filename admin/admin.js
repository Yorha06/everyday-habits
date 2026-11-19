const $=id=>document.getElementById(id);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const PAGE_SIZE=25;
const LEVEL_LABELS={1:'Pagi',2:'Siang',3:'Malam',pagi:'Pagi',siang:'Siang',malam:'Malam'};
const questionBank=typeof ALL!=='undefined'?ALL:(typeof BANK!=='undefined'?BANK:[]);
const questionsByKey=new Map(questionBank.map(question=>[question.n,question]));
let client=null,adminUser=null,allRows=[],visibleRows=[],page=0,selectedParticipant=null;

function message(element,text,type=''){
  element.textContent=text;element.className=`notice ${type}`.trim();element.hidden=!text;
}
function setAuthenticated(visible){
  $('login-panel').hidden=visible;$('dashboard').hidden=!visible;$('logout').hidden=!visible;
}
function sessionScore(row,key){
  const session=(row.session_results||[]).find(item=>item.session_key===key);
  return session?Number(session.total_score):null;
}
function formatScore(value){
  return value===null||value===undefined||!Number.isFinite(Number(value))?'—':`${Number(value).toLocaleString('id-ID',{maximumFractionDigits:2})}/100`;
}
function formatPoints(score,maxScore){
  const scoreValue=Number(score),maxValue=Number(maxScore);
  if(!Number.isFinite(scoreValue)||!Number.isFinite(maxValue))return '—';
  return `${scoreValue.toLocaleString('id-ID',{maximumFractionDigits:2})}/${maxValue.toLocaleString('id-ID',{maximumFractionDigits:2})} poin`;
}
function formatDate(value){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'—':date.toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});
}
function localDate(value){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'':`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function questionFor(answer){return questionsByKey.get(answer.question_key)||null}
function levelLabel(value){
  return LEVEL_LABELS[value]||'';
}
function answerStatus(answer){
  const score=Number(answer.score),maxScore=Number(answer.max_score);
  if(answer.correct===true)return{label:'Benar',className:'correct'};
  if(score>0&&score<maxScore)return{label:'Sebagian benar',className:'partial'};
  return{label:'Belum tepat',className:'incorrect'};
}
function answerValue(value){
  if(typeof value==='string'||typeof value==='number')return String(value);
  if(Array.isArray(value))return value.map(item=>String(item??'')).join(' ');
  return '';
}
function renderAnswerHtml(answer,question){
  const response=answer.answer&&typeof answer.answer==='object'?answer.answer:{};
  const type=answer.question_type||question?.type;
  if(type==='mcq'){
    return `<p class="answer-value"><span>Pilihan peserta</span>${escapeHtml(answerValue(response.selected)||'Belum ada jawaban')}</p>`;
  }
  if(type==='fill'){
    return `<p class="answer-value"><span>Jawaban peserta</span>${escapeHtml(answerValue(response.text)||'Belum ada jawaban')}</p>`;
  }
  if(type==='order'){
    const words=Array.isArray(response.words)?response.words.join(' '):'';
    return `<p class="answer-value"><span>Susunan peserta</span>${escapeHtml(words||'Belum ada jawaban')}</p>`;
  }
  if(type==='speak'){
    return `<p class="answer-value"><span>Transkrip peserta</span>${escapeHtml(answerValue(response.transcript)||'Belum ada transkrip')}</p>`;
  }
  if(type==='pair'){
    const criteria=[['c1','Pola How often + do/does'],['c2','Bentuk kata kerja'],['c3','Frekuensi sesuai petunjuk']];
    const criterionHtml=answer.criteria?criteria.map(([key,label])=>(answer.criteria[key]?'✓':'✗')+' '+label).join(' · '):'Belum tersedia pada hasil lama';
    return '<div class="answer-pair">'+
      '<p class="answer-value"><span>Pertanyaan peserta</span>'+escapeHtml(answerValue(response.question)||'Belum ada jawaban')+'</p>'+
      '<p class="answer-value"><span>Jawaban peserta</span>'+escapeHtml(answerValue(response.answer)||'Belum ada jawaban')+'</p>'+
      '<p class="answer-value"><span>Kriteria</span>'+criterionHtml+'</p>'+
      '<p class="answer-value"><span>Percobaan</span>'+Number(answer.attempts||1)+' kali</p></div>';
  }
  if(type==='match'){
    const pairs=question?.p||[];
    const matches=Array.isArray(response.matches)?response.matches:[];
    return `<div class="match-list">${pairs.map((pair,index)=>{
      const selected=matches[index]||'Belum dipilih';
      const isCorrect=selected===pair[1];
      return `<div class="match-row"><span>${escapeHtml(pair[0])}</span><span class="match-arrow" aria-hidden="true">→</span><span>${escapeHtml(selected)}</span><strong class="${isCorrect?'match-correct':'match-incorrect'}">${isCorrect?'Cocok':'Perlu diperbaiki'}</strong></div>`;
    }).join('')||'<p class="muted">Rincian pasangan tidak tersedia.</p>'}</div>`;
  }
  return `<p class="answer-value"><span>Jawaban peserta</span>${escapeHtml(answerValue(response)||'Format jawaban belum tersedia')}</p>`;
}
function renderComponentBreakdown(session,answers){
  if(session.session_key==='practice'){
    const scores=session.level_scores&&typeof session.level_scores==='object'?session.level_scores:{};
    const components=['pagi','siang','malam'].filter(key=>scores[key]).map(key=>
      `<li><span>${levelLabel(key)}</span><strong>${escapeHtml(formatPoints(scores[key].score,scores[key].max_score))}</strong></li>`);
    return components.length?`<ul class="component-list">${components.join('')}</ul>`:'';
  }
  if(session.session_key==='assessment'&&answers.length){
    return `<ul class="component-list">${answers.map((answer,index)=>
      `<li><span>Pasangan ${index+1}</span><strong>${escapeHtml(formatPoints(answer.score,answer.max_score))}</strong></li>`).join('')}</ul>`;
  }
  return '';
}

function filteredRows(){
  const term=$('search').value.trim().toLocaleLowerCase('id-ID'),from=$('date-from').value,to=$('date-to').value;
  const filtered=allRows.filter(row=>{
    const matchesText=!term||`${row.participant_name} ${row.participant_code}`.toLocaleLowerCase('id-ID').includes(term);
    const date=localDate(row.submitted_at);
    return matchesText&&(!from||date>=from)&&(!to||date<=to);
  });
  const sort=$('sort').value;
  filtered.sort((a,b)=>{
    if(sort=='name_asc')return a.participant_name.localeCompare(b.participant_name,'id');
    if(sort=='total_desc')return Number(b.total_score)-Number(a.total_score);
    if(sort=='total_asc')return Number(a.total_score)-Number(b.total_score);
    const order=new Date(a.submitted_at)-new Date(b.submitted_at);
    return sort=='submitted_asc'?order:-order;
  });
  return filtered;
}
function updateStats(rows){
  const average=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
  const totals=rows.map(row=>Number(row.total_score));
  const practice=rows.map(row=>sessionScore(row,'practice')).filter(value=>value!==null);
  const assessment=rows.map(row=>sessionScore(row,'assessment')).filter(value=>value!==null);
  $('stat-count').textContent=String(rows.length);
  $('stat-total').textContent=formatScore(average(totals));
  $('stat-practice').textContent=formatScore(average(practice));
  $('stat-assessment').textContent=formatScore(average(assessment));
  const targetCount=rows.filter(row=>{
    const session=(row.session_results||[]).find(item=>item.session_key==='assessment');
    return !!session&&(session.answer_details||[]).filter(answer=>answer.correct).length>=4;
  }).length;
  $('stat-target').textContent=rows.length?targetCount+' / '+rows.length:'—';
  const details=rows.flatMap(row=>(row.session_results||[]).filter(session=>session.session_key==='assessment').flatMap(session=>session.answer_details||[]));
  const criteria=[['c1','Pola pertanyaan'],['c2','Bentuk kata kerja'],['c3','Makna frekuensi']].map(([key,label])=>{
    const values=details.map(answer=>answer.criteria&&answer.criteria[key]).filter(value=>typeof value==='boolean');
    return{label,rate:values.length?values.filter(Boolean).length/values.length:null};
  }).filter(item=>item.rate!==null).sort((a,b)=>a.rate-b.rate);
  $('stat-weakest').textContent=criteria.length?criteria[0].label+' ('+Math.round(criteria[0].rate*100)+'%)':'—';
}

function renderTable(){
  visibleRows=filteredRows();updateStats(visibleRows);
  const pageCount=Math.max(1,Math.ceil(visibleRows.length/PAGE_SIZE));
  page=Math.min(page,pageCount-1);
  const pageRows=visibleRows.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  $('submission-rows').innerHTML=pageRows.length?pageRows.map(row=>`<tr>
    <td><span class="mobile-label">Kode peserta</span>${escapeHtml(row.participant_code)}</td>
    <td><span class="mobile-label">Nama</span>${escapeHtml(row.participant_name)}</td>
    <td class="score-cell"><span class="mobile-label">Skor latihan</span>${escapeHtml(formatScore(sessionScore(row,'practice')))}</td>
    <td class="score-cell"><span class="mobile-label">Skor asesmen</span>${escapeHtml(formatScore(sessionScore(row,'assessment')))}</td>
    <td class="score-cell"><span class="mobile-label">Skor total</span>${escapeHtml(formatScore(Number(row.total_score)))}</td>
    <td><span class="mobile-label">Waktu submit</span>${escapeHtml(formatDate(row.submitted_at))}</td>
    <td><span class="mobile-label">Aksi</span><div class="row-actions">
      <button type="button" class="button secondary detail-button" data-id="${escapeHtml(row.id)}">Detail</button>
      <button type="button" class="button danger delete-row-button" data-id="${escapeHtml(row.id)}" aria-label="Hapus ${escapeHtml(row.participant_name)} (${escapeHtml(row.participant_code)})">Hapus</button>
    </div></td>
  </tr>`).join(''):'<tr class="empty-row"><td colspan="7">Tidak ada submission untuk filter ini.</td></tr>';
  $('page-label').textContent=`Halaman ${page+1} dari ${pageCount} · ${visibleRows.length} peserta`;
  $('previous-page').disabled=page===0;
  $('next-page').disabled=page>=pageCount-1;
}
function setBusy(isBusy){
  $('dashboard-message').hidden=!isBusy;
  if(isBusy)message($('dashboard-message'),'Memuat data…');
}
async function loadSubmissions(){
  setBusy(true);
  const rows=[];let offset=0;
  while(true){
    const{data,error}=await client.from('submissions')
      .select('id,participant_code,participant_name,total_score,submitted_at,session_results(id,session_key,session_number,total_score,level_scores,answer_details)')
      .order('submitted_at',{ascending:false})
      .range(offset,offset+499);
    if(error)throw error;
    rows.push(...(data||[]));
    if(!data||data.length<500)break;
    offset+=500;
  }
  allRows=rows;page=0;renderTable();message($('dashboard-message'),'');
}
async function authorize(){
  const{data,error}=await client.auth.getUser();
  if(error)throw error;
  const user=data.user;
  if(!user||user.app_metadata?.role!=='admin'){
    const{error:signOutError}=await client.auth.signOut();
    if(signOutError)console.error('Failed to sign out non-admin user:',signOutError);
    adminUser=null;setAuthenticated(false);
    message($('login-message'),'Akun ini tidak memiliki role admin. Hubungi pengelola aplikasi.','error');
    return false;
  }
  adminUser=user;setAuthenticated(true);$('admin-email').textContent=user.email||'Admin';
  message($('login-message'),'');message($('dashboard-message'),'');
  await loadSubmissions();
  return true;
}
async function initialize(){
  try{
    client=window.createEHSupabaseClient();
  }catch(error){
    $('config-message').hidden=false;
    message($('config-message'),`${error.message} Isi URL dan anon key Supabase di js/supabase.js.`, 'warning');
    $('login-form').querySelector('button').disabled=true;
    return;
  }
  const{data,error}=await client.auth.getSession();
  if(error){message($('login-message'),error.message,'error');return}
  if(data.session)try{await authorize()}catch(loadError){setAuthenticated(true);message($('dashboard-message'),`Gagal memuat data: ${loadError.message}`,'error')}
}

$('login-form').addEventListener('submit',async event=>{
  event.preventDefault();message($('login-message'),'Memeriksa akun…');
  const{data,error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  if(error){message($('login-message'),error.message,'error');return}
  try{await authorize()}catch(loadError){setAuthenticated(true);message($('dashboard-message'),`Gagal memuat data: ${loadError.message}`,'error')}
});
$('logout').addEventListener('click',async()=>{
  const{error}=await client.auth.signOut();
  if(error){message($('dashboard-message'),`Gagal keluar: ${error.message}`,'error');return}
  allRows=[];adminUser=null;setAuthenticated(false);message($('login-message'),'Anda sudah keluar.','success');
});
['search','date-from','date-to','sort'].forEach(id=>$(id).addEventListener(id=='search'?'input':'change',()=>{page=0;renderTable()}));
$('previous-page').addEventListener('click',()=>{page=Math.max(0,page-1);renderTable()});
$('next-page').addEventListener('click',()=>{page++;renderTable()});
$('submission-rows').addEventListener('click',event=>{
  const deleteButton=event.target.closest('.delete-row-button');
  if(deleteButton){
    const row=allRows.find(item=>item.id===deleteButton.dataset.id);
    if(row)deleteParticipant(row,deleteButton,'dashboard-message');
    return;
  }
  const button=event.target.closest('.detail-button');if(!button)return;
  selectedParticipant=allRows.find(row=>row.id===button.dataset.id);
  if(selectedParticipant)showDetail(selectedParticipant);
});
$('close-detail').addEventListener('click',()=>$('detail-dialog').close());
$('detail-dialog').addEventListener('click',event=>{if(event.target===$('detail-dialog'))$('detail-dialog').close()});
$('delete-participant').addEventListener('click',deleteSelectedParticipant);

async function deleteSelectedParticipant(){
  await deleteParticipant(selectedParticipant,$('delete-participant'),'detail-message');
}
async function deleteParticipant(row,button,feedbackId){
  if(!row)return;
  if(!window.confirm(`Hapus permanen data ${row.participant_name} (${row.participant_code})? Rincian sesi terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`))return;
  button.disabled=true;button.textContent='Menghapus…';
  const feedback=$(feedbackId);
  message(feedback,'Menghapus data…');
  try{
    const{data,error}=await client.from('submissions')
      .delete()
      .eq('id',row.id)
      .select('id')
      .maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Data tidak ditemukan atau akun tidak memiliki izin menghapus.');
    if(selectedParticipant?.id===row.id){
      selectedParticipant=null;
      $('detail-dialog').close();
    }
    allRows=allRows.filter(item=>item.id!==row.id);
    renderTable();
    message($('dashboard-message'),`Data ${row.participant_name} (${row.participant_code}) berhasil dihapus.`,'success');
  }catch(error){
    console.error('Failed to delete participant submission:',error);
    message(feedback,`Gagal menghapus data: ${error.message}`,'error');
  }finally{
    button.disabled=false;button.textContent=button.id==='delete-participant'?'Hapus peserta':'Hapus';
  }
}

function showDetail(row){
  message($('detail-message'),'');
  const detailContent=$('detail-content');
  detailContent.innerHTML=`<section class="participant-summary" aria-label="Ringkasan peserta">
    <div><span>Nama peserta</span><strong>${escapeHtml(row.participant_name)}</strong></div>
    <div><span>Kode peserta</span><strong>${escapeHtml(row.participant_code)}</strong></div>
    <div><span>Tanggal pengumpulan</span><strong>${escapeHtml(formatDate(row.submitted_at))}</strong></div>
    <div class="summary-total"><span>Skor akhir</span><strong>${escapeHtml(formatScore(Number(row.total_score)))}</strong></div>
  </section>`;
  try{
    const sessions=(row.session_results||[]).slice().sort((a,b)=>a.session_number-b.session_number);
    const sessionMarkup=sessions.map(session=>{
      const answers=session.answer_details||[];
      const title=session.session_key==='practice'?'Latihan':'Asesmen';
      return `<section class="detail-session">
        <header class="session-heading"><div><p class="eyebrow">Sesi ${Number(session.session_number)||''}</p><h3>${title}</h3></div><strong class="session-score">${escapeHtml(formatScore(Number(session.total_score)))}</strong></header>
        ${renderComponentBreakdown(session,answers)}
        <div class="question-list">${answers.map((answer,index)=>{
          const question=questionFor(answer);
          const level=levelLabel(answer.level||question?.t);
          const status=answerStatus(answer);
          return `<article class="question-card">
            <div class="question-heading"><span class="question-number">Soal ${index+1}${level?` · ${escapeHtml(level)}`:''}</span><span class="result-badge ${status.className}">${status.label}</span></div>
            <p class="detail-question">${escapeHtml(answer.prompt||question?.q||'Pertanyaan tidak tersedia')}</p>
            ${renderAnswerHtml(answer,question)}
            <p class="detail-score">Skor ${escapeHtml(formatPoints(answer.score,answer.max_score))}</p>
          </article>`;
        }).join('')}</div>
      </section>`;
    }).join('');
    detailContent.insertAdjacentHTML('beforeend',sessionMarkup||'<p class="empty-detail">Rincian sesi belum tersedia.</p>');
  }catch(error){
    console.error('Failed to render participant details:',error);
    message($('detail-message'),'Ringkasan peserta tampil, tetapi rincian sesi gagal ditampilkan. Muat ulang halaman dan coba lagi.','error');
  }
  $('detail-dialog').showModal();
}

function resultLabel(answer){
  return answerStatus(answer).label;
}
function answerText(answer,question){
  const response=answer.answer&&typeof answer.answer==='object'?answer.answer:{};
  const type=answer.question_type||question?.type;
  if(type==='mcq')return answerValue(response.selected)||'Belum ada jawaban';
  if(type==='fill')return answerValue(response.text)||'Belum ada jawaban';
  if(type==='order')return Array.isArray(response.words)?response.words.join(' '):'Belum ada jawaban';
  if(type==='speak')return answerValue(response.transcript)||'Belum ada transkrip';
  if(type==='pair')return `Pertanyaan: ${answerValue(response.question)||'Belum ada jawaban'}\nJawaban: ${answerValue(response.answer)||'Belum ada jawaban'}`;
  if(type==='match'){
    const pairs=question?.p||[],matches=Array.isArray(response.matches)?response.matches:[];
    return pairs.map((pair,index)=>`${pair[0]} → ${matches[index]||'Belum dipilih'} (${matches[index]===pair[1]?'Cocok':'Perlu diperbaiki'})`).join('\n')||'Rincian pasangan tidak tersedia';
  }
  return answerValue(response)||'Format jawaban belum tersedia';
}
const REPORT_PALETTE={
  violet:'FF6252D9',dark:'FF302A68',slate:'FF24324A',muted:'FF66748A',
  lightViolet:'FFF2F0FF',lightBlue:'FFF3F6FB',stripe:'FFF8F9FC',
  border:'FFDDE3EF',white:'FFFFFFFF'
};
function averageScore(values){
  const scores=values
    .filter(value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value)))
    .map(Number);
  return scores.length?scores.reduce((sum,value)=>sum+value,0)/scores.length:null;
}
function excelColumnName(number){
  let name='';
  while(number){
    const remainder=(number-1)%26;
    name=String.fromCharCode(65+remainder)+name;
    number=Math.floor((number-1)/26);
  }
  return name;
}
function excelNumber(value){
  return value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
}
function styleHeader(row,columnCount){
  row.height=32;
  for(let column=1;column<=columnCount;column++){
    const cell=row.getCell(column);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:REPORT_PALETTE.violet}};
    cell.font={name:'Aptos',size:10,bold:true,color:{argb:REPORT_PALETTE.white}};
    cell.alignment={vertical:'middle',horizontal:'left',wrapText:true};
    cell.border={bottom:{style:'medium',color:{argb:REPORT_PALETTE.dark}}};
  }
}
function styleDataRow(row,rowIndex,columnCount){
  for(let column=1;column<=columnCount;column++){
    const cell=row.getCell(column);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:rowIndex%2?REPORT_PALETTE.white:REPORT_PALETTE.stripe}};
    cell.font={name:'Aptos',size:10,color:{argb:REPORT_PALETTE.slate}};
    cell.alignment={vertical:'top',horizontal:'left',wrapText:true};
    cell.border={bottom:{style:'thin',color:{argb:REPORT_PALETTE.border}}};
  }
}
function addDataWorksheet(workbook,name,tableName,headers,rows,widths,numberFormats={},filterColumnCount=3){
  const worksheet=workbook.addWorksheet(name,{properties:{tabColor:{argb:REPORT_PALETTE.violet}}});
  widths.forEach((width,index)=>{worksheet.getColumn(index+1).width=width});
  worksheet.addTable({
    name:tableName,
    ref:'A1',
    headerRow:true,
    totalsRow:false,
    style:{theme:'TableStyleMedium2',showRowStripes:true},
    columns:headers.map((header,index)=>({name:header,filterButton:index<filterColumnCount})),
    rows:rows.map(record=>headers.map(header=>record[header]??''))
  });
  styleHeader(worksheet.getRow(1),headers.length);
  rows.forEach((record,index)=>{
    const row=worksheet.getRow(index+2);
    styleDataRow(row,index,headers.length);
    headers.forEach((header,columnIndex)=>{
      if(numberFormats[header])row.getCell(columnIndex+1).numFmt=numberFormats[header];
    });
  });
  worksheet.views=[{state:'frozen',xSplit:0,ySplit:1,topLeftCell:'A2'}];
  return worksheet;
}
function setKpiCard(worksheet,startColumn,label,formula,result,numFmt){
  const endColumn=startColumn+1;
  for(let column=startColumn;column<=endColumn;column++){
    [4,5].forEach(rowNumber=>{
      worksheet.getCell(rowNumber,column).fill={
        type:'pattern',pattern:'solid',fgColor:{argb:REPORT_PALETTE.lightViolet}
      };
    });
  }
  worksheet.mergeCells(4,startColumn,4,endColumn);
  worksheet.mergeCells(5,startColumn,5,endColumn);
  const labelCell=worksheet.getCell(4,startColumn);
  labelCell.value=label;
  labelCell.font={name:'Aptos',size:10,bold:true,color:{argb:REPORT_PALETTE.muted}};
  labelCell.alignment={vertical:'middle',horizontal:'left',wrapText:true};
  const valueCell=worksheet.getCell(5,startColumn);
  valueCell.value={formula,result};
  valueCell.numFmt=numFmt;
  valueCell.font={name:'Aptos Display',size:19,bold:true,color:{argb:REPORT_PALETTE.violet}};
  valueCell.alignment={vertical:'middle',horizontal:'left'};
}
function summaryWorksheet(workbook,rows,sessionFilter){
  const worksheet=workbook.addWorksheet('Ringkasan',{properties:{tabColor:{argb:REPORT_PALETTE.violet}}});
  [28,16,15,15,14,24,12,12].forEach((width,index)=>{worksheet.getColumn(index+1).width=width});
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value='Laporan Hasil Everyday Habits';
  worksheet.getCell('A1').font={name:'Aptos Display',size:20,bold:true,color:{argb:REPORT_PALETTE.white}};
  worksheet.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:REPORT_PALETTE.dark}};
  worksheet.getCell('A1').alignment={vertical:'middle',horizontal:'left'};
  worksheet.getRow(1).height=38;
  worksheet.mergeCells('A2:H2');
  const sessionLabel=sessionFilter==='practice'?'Latihan':sessionFilter==='assessment'?'Asesmen':'Semua sesi';
  worksheet.getCell('A2').value=`Data mengikuti baris yang tampil di Admin · Rincian sesi: ${sessionLabel}`;
  worksheet.getCell('A2').font={name:'Aptos',size:10,color:{argb:REPORT_PALETTE.muted}};
  worksheet.getCell('A2').fill={type:'pattern',pattern:'solid',fgColor:{argb:REPORT_PALETTE.lightBlue}};
  worksheet.getCell('A2').alignment={vertical:'middle',horizontal:'left'};
  worksheet.getRow(2).height=24;
  worksheet.getRow(3).height=10;
  worksheet.getRow(4).height=28;
  worksheet.getRow(5).height=42;

  const headerRow=8,firstDataRow=headerRow+1,lastDataRow=Math.max(firstDataRow,headerRow+rows.length);
  const averageFormula=column=>`IFERROR(SUBTOTAL(101,$${column}$${firstDataRow}:$${column}$${lastDataRow}),0)`;
  setKpiCard(worksheet,1,'Jumlah peserta',
    `SUBTOTAL(103,$A$${firstDataRow}:$A$${lastDataRow})`,rows.length,'0');
  setKpiCard(worksheet,3,'Rata-rata skor akhir',
    averageFormula('E'),
    averageScore(rows.map(row=>row.total_score))??0,'0.00"/100"');
  setKpiCard(worksheet,5,'Rata-rata skor Latihan',
    averageFormula('C'),
    averageScore(rows.map(row=>sessionScore(row,'practice')))??0,'0.00"/100"');
  setKpiCard(worksheet,7,'Rata-rata skor Asesmen',
    averageFormula('D'),
    averageScore(rows.map(row=>sessionScore(row,'assessment')))??0,'0.00"/100"');

  worksheet.mergeCells('A6:H6');
  worksheet.getCell('A6').value='Klik panah filter pada Nama peserta atau Kode peserta; KPI akan menghitung ulang baris yang terlihat.';
  worksheet.getCell('A6').font={name:'Aptos',size:10,italic:true,color:{argb:REPORT_PALETTE.dark}};
  worksheet.getCell('A6').fill={type:'pattern',pattern:'solid',fgColor:{argb:REPORT_PALETTE.lightViolet}};
  worksheet.getCell('A6').alignment={vertical:'middle',horizontal:'left',wrapText:true};
  worksheet.getRow(6).height=28;
  worksheet.mergeCells('A7:F7');
  worksheet.getCell('A7').value='Daftar peserta';
  worksheet.getCell('A7').font={name:'Aptos Display',size:13,bold:true,color:{argb:REPORT_PALETTE.slate}};
  worksheet.getCell('A7').alignment={vertical:'middle',horizontal:'left'};
  worksheet.getRow(7).height=26;

  const headers=['Nama peserta','Kode peserta','Skor Latihan','Skor Asesmen','Skor akhir','Tanggal pengumpulan'];
  worksheet.addTable({
    name:'PesertaTable',
    ref:`A${headerRow}`,
    headerRow:true,
    totalsRow:false,
    style:{theme:'TableStyleMedium2',showRowStripes:true},
    columns:headers.map((name,index)=>({name,filterButton:index<2})),
    rows:rows.map(record=>[
      record.participant_name||'—',
      record.participant_code||'—',
      excelNumber(sessionScore(record,'practice')),
      excelNumber(sessionScore(record,'assessment')),
      excelNumber(record.total_score),
      formatDate(record.submitted_at)
    ])
  });
  styleHeader(worksheet.getRow(headerRow),headers.length);
  rows.forEach((record,index)=>{
    const row=worksheet.getRow(firstDataRow+index);
    styleDataRow(row,index,headers.length);
    [3,4,5].forEach(column=>{row.getCell(column).numFmt='0.##"/100"'});
  });
  worksheet.views=[{state:'frozen',xSplit:0,ySplit:headerRow,topLeftCell:`A${headerRow+1}`}];
  return worksheet;
}
async function exportWorkbook(rows,sessionFilter='all'){
  if(!window.ExcelJS||!window.ExcelJS.Workbook){
    message($('dashboard-message'),'Library Excel tidak dapat dimuat. Periksa koneksi internet.','error');
    return;
  }
  try{
    const selected=rows.map(row=>({...row,session_results:(row.session_results||[]).filter(session=>sessionFilter==='all'||session.session_key===sessionFilter)}));
    const sessionResults=[],answerDetails=[];
    selected.forEach(row=>(row.session_results||[]).forEach(session=>{
      const sessionName=session.session_key==='practice'?'Latihan':'Asesmen';
      const answers=session.answer_details||[];
      if(session.session_key==='practice'){
        const scores=session.level_scores&&typeof session.level_scores==='object'?session.level_scores:{};
        ['pagi','siang','malam'].forEach(level=>{
          if(!scores[level])return;
          sessionResults.push({
            'Nama peserta':row.participant_name,'Kode peserta':row.participant_code,'Sesi':sessionName,
            'Komponen':levelLabel(level),'Skor komponen':Number(scores[level].score),'Skor maksimal komponen':Number(scores[level].max_score),
            'Skor sesi':Number(session.total_score),'Tanggal pengumpulan':formatDate(row.submitted_at)
          });
        });
      }else if(answers.length){
        answers.forEach((answer,index)=>sessionResults.push({
          'Nama peserta':row.participant_name,'Kode peserta':row.participant_code,'Sesi':sessionName,
          'Komponen':`Pasangan ${index+1}`,'Skor komponen':Number(answer.score),'Skor maksimal komponen':Number(answer.max_score),
          'Skor sesi':Number(session.total_score),'Tanggal pengumpulan':formatDate(row.submitted_at)
        }));
      }else{
        sessionResults.push({
          'Nama peserta':row.participant_name,'Kode peserta':row.participant_code,'Sesi':sessionName,
          'Komponen':'Nilai sesi','Skor komponen':Number(session.total_score),'Skor maksimal komponen':100,
          'Skor sesi':Number(session.total_score),'Tanggal pengumpulan':formatDate(row.submitted_at)
        });
      }
      answers.forEach((answer,index)=>{
        const question=questionFor(answer);
        answerDetails.push({
          'Nama peserta':row.participant_name,'Kode peserta':row.participant_code,'Sesi':sessionName,
          'Nomor soal':`Soal ${index+1}`,'Tingkat':levelLabel(answer.level||question?.t)||'—',
          'Pertanyaan':answer.prompt||question?.q||'Pertanyaan tidak tersedia',
          'Jawaban peserta':answerText(answer,question),'Hasil':resultLabel(answer),
          'Kriteria 1 - Pola pertanyaan':answer.criteria&&typeof answer.criteria.c1==='boolean'?(answer.criteria.c1?'Benar':'Perlu diperbaiki'):'—',
          'Kriteria 2 - Bentuk kata kerja':answer.criteria&&typeof answer.criteria.c2==='boolean'?(answer.criteria.c2?'Benar':'Perlu diperbaiki'):'—',
          'Kriteria 3 - Makna frekuensi':answer.criteria&&typeof answer.criteria.c3==='boolean'?(answer.criteria.c3?'Benar':'Perlu diperbaiki'):'—',
          'Percobaan':Number(answer.attempts||1),'Skor':Number(answer.score),'Skor maksimal':Number(answer.max_score),'Tanggal pengumpulan':formatDate(row.submitted_at)
        });
      });
    }));

    const workbook=new window.ExcelJS.Workbook();
    workbook.creator='Everyday Habits';
    workbook.subject='Laporan hasil peserta';
    workbook.calcProperties={calcMode:'auto',fullCalcOnLoad:true,forceFullCalc:true};
    summaryWorksheet(workbook,rows,sessionFilter);
    addDataWorksheet(workbook,'Nilai Komponen','NilaiKomponenTable',
      ['Nama peserta','Kode peserta','Sesi','Komponen','Skor komponen','Skor maksimal komponen','Skor sesi','Tanggal pengumpulan'],
      sessionResults,[24,16,14,24,17,23,14,22],
      {'Skor komponen':'0.##" poin"','Skor maksimal komponen':'0.##" poin"','Skor sesi':'0.##"/100"'},3);
    addDataWorksheet(workbook,'Rincian Jawaban','RincianJawabanTable',
      ['Nama peserta','Kode peserta','Sesi','Nomor soal','Tingkat','Pertanyaan','Jawaban peserta','Hasil','Kriteria 1 - Pola pertanyaan','Kriteria 2 - Bentuk kata kerja','Kriteria 3 - Makna frekuensi','Percobaan','Skor','Skor maksimal','Tanggal pengumpulan'],
      answerDetails,[24,16,14,14,14,52,48,20,28,28,28,12,12,16,22],
      {'Skor':'0.##" poin"','Skor maksimal':'0.##" poin"'},3);

    const buffer=await workbook.xlsx.writeBuffer();
    const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    const link=document.createElement('a');
    link.href=url;
    link.download=`everyday-habits-${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    message($('dashboard-message'),'File Excel berhasil dibuat dan diunduh.','success');
  }catch(error){
    console.error('Excel export failed:',error);
    message($('dashboard-message'),'Gagal membuat file Excel. Coba lagi atau periksa koneksi.','error');
  }
}
$('export-button').addEventListener('click',()=>exportWorkbook(visibleRows,$('export-session').value));
$('export-participant').addEventListener('click',()=>{
  if(selectedParticipant)exportWorkbook([selectedParticipant],$('export-session').value);
});

initialize();
