# Everyday Habits – Latihan Bahasa Inggris Kelas 6 SD
Web app statis (HTML/CSS/JS murni, tanpa build atau dependensi runtime). Dependensi Playwright hanya dipakai untuk skrip pengecekan otomatis.

## Menjalankan
- Cara cepat: buka `index.html` di browser (soal speaking baru aktif lewat `localhost`/HTTPS, lihat bagian Sistem soal).
- Lewat Node: `npm start` atau `node server.js`, lalu buka http://localhost:8080.
- Jangan jalankan `node app.js` (file itu untuk browser).

## Pengecekan browser otomatis
- Pasang dependensi: `npm install`
- Pasang browser Chromium untuk Playwright: `npx playwright install chromium`
- Jalankan `npm run check:grade`, lalu pilih target grade di terminal.
- Target: 1 = luar biasa (80), 2 = bagus (73,3), 3 = ayo berlatih lagi (60), 4 = yuk coba lagi (26,7).
- Setiap soal ditampilkan selama 3 detik sebelum dijawab. Skrip menunggu SFX jawaban benar/salah selesai sebelum berpindah ke soal berikutnya, lalu memverifikasi nilai, grade, dan SFX penilaian akhir.
- Setelah berhasil maupun gagal, browser tetap terbuka sampai Enter ditekan di terminal agar hasil atau error dapat diperiksa.
- Untuk mode tanpa jendela browser: `npm run check:grade -- 1 --headless`. Nomor grade dapat diganti 1–4.
- Untuk memakai server yang sudah berjalan di URL lain, set `APP_URL`, misalnya `$env:APP_URL='http://127.0.0.1:8081'; npm run check:grade`.

## Deploy / forward port
Upload seluruh folder ke hosting statis apa pun (Netlify, Vercel, GitHub Pages, Nginx, dll). Tidak butuh backend.

## Struktur
- `questions.js` – bank soal (126 soal: 33 mudah, 43 sedang, 50 menantang; tambah soal di sini).
- `app.js` – logika kuis, pemilihan soal, skor. Konstanta `PER` (jumlah soal per level) dan `PTS` (poin per soal) ada di bagian atas.
- `style.css` – tema terang ramah anak.
- `sfx/` – backsound loop dan efek suara untuk jawaban serta empat grade nilai.
- `scripts/check-grade.js` – otomasi browser Playwright untuk memeriksa alur dan target grade (SpeechRecognition ditiru agar soal speaking bisa dijawab otomatis).

## Sistem soal & skor
- Bank: 126 soal dalam tiga level (Pagi/mudah, Siang/sedang, Malam/menantang).
- Tiap sesi: 15 soal, masing-masing 5 soal per level, berurutan mudah → sulit. Total 6 soal sound per sesi, hanya di Siang dan Malam: 3 listening (1 Siang, 2 Malam) dan 3 speaking (2 Siang, 1 Malam). Level Pagi berisi 5 soal biasa; total 9 soal biasa per sesi.
- Format: pilihan ganda, benar/salah, isi titik-titik, susun kalimat, jodohkan, listening, dan speaking. Jawaban benar bernilai sama; nilai maksimum sesi 100.
- Bintang: 90–100 ⭐⭐⭐, 70–89 ⭐⭐, 50–69 ⭐, <50 🌱. Skor terbaik disimpan di localStorage.
- Riwayat soal disimpan di browser. Soal yang pernah muncul peluangnya turun tajam (bobot ×0,3 tiap kali muncul), terutama pada nomor yang sama; peluangnya berangsur pulih agar soal tetap bisa terpilih lagi.
- Grade hasil: 80–100 luar biasa, 70–79 bagus, 40–69 ayo berlatih lagi, dan <40 yuk coba lagi. Efek untuk grade perlu latihan dipilih acak.
- Listening menggunakan enam berkas `audio/listening-01.mp3` sampai `audio/listening-06.mp3`. Pemutar bisa dipakai ulang; transkrip baru ditampilkan setelah jawaban dinilai.
- Semua aset audio diminta saat aplikasi dibuka (`preload=auto`) agar tersedia lebih cepat saat dipakai; browser dapat menyimpannya sementara di cache. Backsound mulai saat kuis dimulai dan berulang otomatis. Backsound dijeda sebelum audio listening atau efek suara diputar, lalu dilanjutkan setelah audio selesai.

## Catatan tambahan
- Halaman "Belajar Dulu" (`learn()` di `app.js`) mencakup semua materi soal: kosakata kegiatan, waktu & jam, transportasi, kata frekuensi dan jumlah kali, aturan s/es, posisi kata frekuensi, do/does, jawaban singkat, How often/What time, kalimat negatif, serta tips listening dan speaking. Tambahkan materinya di sini saat menambah jenis soal baru.
- Tema berubah bertahap dari pagi ke malam mengikuti progres soal (`SKY` di `app.js`).
- Soal jodohkan: nilai sebagian, tiap pasangan benar mendapat bagian dari bobot soal.
- Tiap level punya daftar soal sendiri (`POOL` di `app.js`). Listening memakai format pilihan ganda, tetapi dipilih sebagai kategori tersendiri agar tepat 1 soal listening muncul di Siang dan 2 di Malam.
- Pemilihan listening dan speaking memakai rotasi "kantong" (`pickRotating` di `app.js`, disimpan di localStorage): soal diambil tanpa pengembalian dan baru keluar lagi setelah semua soal di kelompoknya terpakai, sehingga tidak ada soal yang terlalu sering muncul. Listening: Siang 3 soal (ambil 1), Malam 9 soal (ambil 2). Speaking: Siang 8 soal (ambil 2), Malam 8 soal (ambil 1).
- **Speaking**: soal baca kalimat (`mode:'read'`) atau jawab pertanyaan sederhana (`mode:'answer'`), memakai Web Speech API (`SpeechRecognition`, `en-US`). Benar penuh jika semua kata target terucap dan kata tambahan maksimal 1 ("yes I love" tidak dianggap "yes I do"). Soal baca kalimat yang hampir benar (≥50% kata cocok) mendapat nilai sebagian; soal jawab pertanyaan hanya benar atau salah. Jawaban lain yang diterima ditulis di `accept`; `extra` (opsional) menentukan batas kata tambahan untuk jawaban bebas seperti "I brush my teeth twice a day". Tombol 🔊 membacakan contoh lewat `speechSynthesis`. Backsound dijeda selama mikrofon aktif.
- Speaking butuh Chrome/Edge dan konteks aman (HTTPS atau `localhost`, jadi pakai `npm start`, bukan membuka `index.html` langsung). Audio suara diproses oleh layanan pengenalan suara browser (Chrome mengirimnya ke server Google). Izin mikrofon diminta sekali di awal lewat dialog ramah anak (maskot burung hantu, tombol "Siap!") sebelum kotak izin browser muncul; jika ditolak, muncul dialog "Mikrofon belum boleh dipakai" dengan tombol lanjut main dan petunjuk khusus guru/orang tua. Izin diminta saat halaman dibuka (diulang saat menekan "Ayo Mulai" jika belum diputuskan), bukan saat soal speaking tampil; status izin ditampilkan di beranda. Jika browser tidak mendukung atau izin mikrofon ditolak, soal speaking otomatis diganti soal biasa; jika mikrofon bermasalah di tengah soal, muncul tombol "Ganti soal lain".


- Fokus materi soal: pola **How often + do/does** (soal biasa, speaking, dan kartu materi "How often + do / does" di halaman Belajar).
- **Refresh aman**: kuis yang sedang berjalan (soal, nomor, skor) disimpan di localStorage (`eh_session_v1`, berlaku 12 jam) dan dilanjutkan setelah halaman dimuat ulang. Soal yang sudah dijawab tidak bisa dijawab ulang lewat refresh. Sesi dihapus saat kembali ke beranda.
- **Tombol 🏠 Beranda** saat kuis berjalan membuka pop up konfirmasi (skor tidak disimpan jika keluar).
- **Logo**: `logo.svg` (matahari, bulan, dan panah siklus harian), `logo-180.png` untuk ikon layar utama, dan dipakai sebagai favicon serta di beranda.
