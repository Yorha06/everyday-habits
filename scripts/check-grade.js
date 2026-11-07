const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.APP_URL || 'http://127.0.0.1:8080';
const QUESTION_DELAY_MS = 3000;
const GRADES = {
  '1': { id: 'above', label: 'Luar Biasa!', score: 80, correctAnswers: 12, sound: 'diatasKKM.mp3' },
  '2': { id: 'around', label: 'Bagus!', score: 73.3, correctAnswers: 11, sound: 'sekitarKKM.mp3' },
  '3': { id: 'poor', label: 'Ayo Berlatih Lagi', score: 60, correctAnswers: 9, sound: null },
  '4': { id: 'very-poor', label: 'Yuk Coba Lagi!', score: 26.7, correctAnswers: 4, sound: 'extraFail.mp3' },
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForEnter(message = 'Browser tetap terbuka. Tekan Enter untuk menutup...') {
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    await prompt.question(message);
  } finally {
    prompt.close();
  }
}

async function chooseGrade() {
  if (GRADES[process.argv[2]]) return GRADES[process.argv[2]];

  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    console.log('Pilih target grade:');
    console.log('1. Luar biasa (target 80)');
    console.log('2. Bagus (target 73,3)');
    console.log('3. Ayo berlatih lagi (target 60)');
    console.log('4. Yuk coba lagi (target 26,7)');
    const choice = (await prompt.question('Masukkan pilihan [1-4]: ')).trim();
    if (!GRADES[choice]) throw new Error('Pilihan tidak valid. Jalankan ulang dan pilih angka 1 sampai 4.');
    return GRADES[choice];
  } finally {
    prompt.close();
  }
}

async function isServerAvailable() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function startServerIfNeeded() {
  if (await isServerAvailable()) return null;

  const server = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    stdio: 'ignore',
    env: { ...process.env, PORT: new URL(BASE_URL).port || '8080' },
  });
  let exitError;
  server.once('error', error => { exitError = error; });
  server.once('exit', code => {
    if (code !== 0) exitError = new Error(`Server berhenti dengan kode ${code}.`);
  });

  for (let attempt = 0; attempt < 50; attempt++) {
    if (await isServerAvailable()) return server;
    if (exitError) throw exitError;
    await wait(100);
  }

  server.kill();
  throw new Error(`Server tidak merespons di ${BASE_URL}.`);
}

function normalizeSentence(value) {
  return value.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z' ]/g, '').replace(/\s+/g, ' ').trim();
}

function findWrongOrder(words, acceptedAnswers) {
  const accepted = new Set(acceptedAnswers.map(normalizeSentence));
  const used = Array(words.length).fill(false);
  const order = [];
  let result = null;

  function search() {
    if (result) return;
    if (order.length === words.length) {
      const sentence = order.map(index => words[index]).join(' ');
      if (!accepted.has(normalizeSentence(sentence))) result = order.map(index => words[index]);
      return;
    }

    for (let index = 0; index < words.length; index++) {
      if (used[index]) continue;
      used[index] = true;
      order.push(index);
      search();
      order.pop();
      used[index] = false;
      if (result) return;
    }
  }

  search();
  if (!result) throw new Error(`Tidak menemukan susunan jawaban salah untuk: ${words.join(' ')}`);
  return result;
}

function findWrongMatches(pairs) {
  const answers = pairs.map(pair => pair[1]);
  const assignment = Array(pairs.length).fill(null);

  function search(row, used) {
    if (row === pairs.length) return true;
    for (let index = 0; index < answers.length; index++) {
      if (used.has(index) || answers[index] === pairs[row][1]) continue;
      assignment[row] = answers[index];
      used.add(index);
      if (search(row + 1, used)) return true;
      used.delete(index);
    }
    return false;
  }

  if (!search(0, new Set())) throw new Error('Tidak menemukan pasangan jawaban yang seluruhnya salah.');
  return assignment;
}

async function getCurrentQuestion(page) {
  return page.evaluate(() => {
    const question = Q[i];
    return {
      type: question.type,
      answer: question.a,
      words: question.w,
      audio: question.audio,
      target: question.target,
      acceptedAnswers: question.type === 'order' ? [question.a, ...(question.alt || [])] : [],
      pairs: question.p,
    };
  });
}

async function answerQuestion(page, question, shouldBeCorrect) {
  if (question.type === 'mcq') {
    const wrongChoice = question.answer === 0 ? 1 : 0;
    await page.locator('.opt').nth(shouldBeCorrect ? question.answer : wrongChoice).click();
    return;
  }

  if (question.type === 'fill') {
    const answer = shouldBeCorrect ? question.answer[0] : 'not_a_valid_answer';
    await page.locator('#fi').fill(answer);
    return;
  }

  if (question.type === 'order') {
    const words = shouldBeCorrect
      ? question.words
      : findWrongOrder(question.words, question.acceptedAnswers);
    for (const word of words) {
      const buttons = page.locator('#bank .chip');
      const labels = await buttons.allTextContents();
      const index = labels.findIndex(label => label.trim() === word);
      if (index < 0) throw new Error(`Kata "${word}" tidak ditemukan di bank kata.`);
      await buttons.nth(index).click();
    }
    return;
  }

  if (question.type === 'match') {
    const wrongAnswers = shouldBeCorrect ? null : findWrongMatches(question.pairs);
    for (let row = 0; row < question.pairs.length; row++) {
      const target = shouldBeCorrect ? question.pairs[row][1] : wrongAnswers[row];
      const dropdown = page.locator('.dd').nth(row);
      await dropdown.locator('.ddb').click();
      await dropdown.locator('.ddl button').getByText(target, { exact: true }).click();
    }
    return;
  }

  if (question.type === 'speak') {
    await page.evaluate(text => { window.__speechTranscript = text; }, shouldBeCorrect ? question.target : 'banana');
    await page.locator('#mic').click();
    await page.locator('#heard.ok').waitFor();
    return;
  }

  throw new Error(`Jenis soal tidak dikenal: ${question.type}`);
}

async function verifyAudioPlayback(page, filenames, description) {
  await page.waitForFunction(
    sounds => {
      const entry = window.__audioPlaybackLog.findLast(item => sounds.some(sound => item.src.endsWith(`/sfx/${sound}`)));
      return entry && ['ended', 'rejected', 'error'].includes(entry.state);
    },
    filenames,
    { timeout: 30000 },
  );
  const attempts = await page.evaluate(sounds => window.__audioPlaybackLog
    .filter(entry => sounds.some(sound => entry.src.endsWith(`/sfx/${sound}`))),
  filenames);
  const lastAttempt = attempts.at(-1);
  if (!lastAttempt || lastAttempt.state !== 'ended') {
    throw new Error(`${description} tidak selesai diputar: ${JSON.stringify(lastAttempt)}.`);
  }
}

async function run() {
  const target = await chooseGrade();
  let server;
  let browser;

  try {
    server = await startServerIfNeeded();
    browser = await chromium.launch({
      headless: process.argv.includes('--headless'),
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    });
    const context = await browser.newContext({ permissions: ['microphone'] });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.addInitScript(() => {
      window.__audioPlaybackLog = [];
      // Tiruan SpeechRecognition: mengembalikan teks dari window.__speechTranscript tanpa mikrofon sungguhan.
      window.SpeechRecognition = class {
        start() {
          setTimeout(() => {
            this.onresult?.({ results: [[{ transcript: window.__speechTranscript || '' }]] });
            this.onend?.();
          }, 50);
        }
        stop() {}
        abort() {}
      };
      const originalPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        const entry = { src: this.currentSrc || this.src, state: 'requested' };
        window.__audioPlaybackLog.push(entry);
        this.addEventListener('ended', () => { entry.state = 'ended'; }, { once: true });
        this.addEventListener('error', () => { entry.state = 'error'; }, { once: true });
        this.addEventListener('pause', () => {
          if (entry.state === 'playing' && !this.ended) entry.state = 'interrupted';
        }, { once: true });
        const result = originalPlay.call(this);
        if (result && typeof result.then === 'function') {
          result.then(
            () => { entry.state = 'playing'; },
            error => { entry.state = 'rejected'; entry.error = error.name; },
          );
        }
        return result;
      };
    });

    await page.goto(BASE_URL);
    await page.bringToFront();
    await page.getByRole('heading', { name: 'Halo, Teman Pintar!' }).waitFor();
    await page.getByRole('button', { name: /Belajar Dulu/ }).click();
    await page.getByRole('heading', { name: 'Kegiatan Sehari-hari' }).waitFor();
    await page.locator('.back').click();
    await page.getByRole('heading', { name: 'Halo, Teman Pintar!' }).waitFor();
    await page.locator('#nm').fill('Pengecekan');
    await page.getByRole('button', { name: /Ayo Mulai/ }).click();

    for (let index = 0; index < 15; index++) {
      await page.locator('.card .hint').first().waitFor();
      const question = await getCurrentQuestion(page);
      if (question.audio) {
        await page.locator('.listen-btn').click();
        await page.waitForFunction(audio => LISTENING_AUDIO[audio]?.ended, question.audio);
      }
      await wait(QUESTION_DELAY_MS);
      await answerQuestion(page, question, index < target.correctAnswers);
      await page.locator('#chk').click();
      const feedback = page.locator('#fb .fb');
      await feedback.waitFor();
      const shouldBeCorrect = index < target.correctAnswers;
      const feedbackClass = await feedback.getAttribute('class');
      const expectedClass = shouldBeCorrect ? 'ok' : 'no';
      if (!feedbackClass.split(/\s+/).includes(expectedClass)) {
        throw new Error(`Hasil soal ${index + 1} tidak sesuai rencana: ${await feedback.innerText()}`);
      }
      await verifyAudioPlayback(page, [shouldBeCorrect ? 'correct.mp3' : 'wrong.mp3'], `SFX soal ${index + 1}`);
      console.log(`Soal ${index + 1}/15 (${shouldBeCorrect ? 'benar' : 'salah'}): ${await feedback.innerText()}`);
      await page.locator('#chk').click();
    }

    await page.locator(`.answer-overlay.grade-${target.id}`).waitFor();
    await page.locator('#app h2').filter({ hasText: target.label }).waitFor();
    const displayedScore = (await page.locator('.score').innerText()).replace(/\s+/g, ' ').trim();
    const scoreMatch = displayedScore.match(/([\d,]+)\s*\/\s*100/);
    if (!scoreMatch) throw new Error(`Nilai tidak ditemukan di halaman hasil: "${displayedScore}".`);
    const numericScore = Number(scoreMatch[1].replace(',', '.'));
    if (Math.abs(numericScore - target.score) > 0.1) {
      throw new Error(`Skor hasil ${numericScore} tidak sama dengan target ${target.score}.`);
    }
    const finalSounds = target.sound ? [target.sound] : ['fail1.mp3', 'fail2.mp3'];
    await verifyAudioPlayback(page, ['wrong.mp3'], 'SFX jawaban salah');
    await verifyAudioPlayback(page, finalSounds, 'SFX penilaian akhir');
    const playedSounds = await page.evaluate(() => window.__audioPlaybackLog
      .filter(entry => entry.state === 'playing')
      .map(entry => entry.src.split('/').pop()));
    console.log(`Berhasil: alur Beranda, Belajar, Kuis, dan Hasil berjalan.`);
    console.log(`Target grade: ${target.label}; nilai: ${displayedScore}.`);
    console.log(`SFX yang terputar: ${playedSounds.join(', ')}.`);
    await waitForEnter();
  } catch (error) {
    console.error(`Pengecekan gagal: ${error.message}`);
    if (browser) await waitForEnter('Pengecekan gagal. Browser tetap terbuka untuk diperiksa. Tekan Enter untuk menutup...');
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) server.kill();
  }
}

run().catch(error => {
  console.error(`Pengecekan gagal sebelum browser dibuka: ${error.message}`);
  process.exitCode = 1;
});
