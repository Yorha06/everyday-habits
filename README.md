# Everyday Habits

Game Vanilla JavaScript untuk belajar bahasa Inggris kelas 6. Production menggunakan static hosting Vercel, Vercel Function untuk submission, dan Supabase PostgreSQL/Auth untuk penyimpanan dan Admin.

## Mulai bermain dan pengembangan lokal

1. Jalankan `npm start`.
2. Buka http://localhost:8080.
3. Masukkan nama samaran, lalu pilih **Ayo Mulai!** atau **Belajar Dulu**.
4. Jalankan validasi lokal dengan `npm test`.

`server.js` hanya melayani file statis. Untuk menguji endpoint secara lokal:

1. Pastikan Vercel CLI sudah terpasang (`npm.cmd install --global vercel`).
2. Buat `.env.local` di root project dengan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.
3. Jalankan `npm.cmd run dev`; buka alamat yang ditampilkan (default `http://127.0.0.1:3000`).

Script lokal menjalankan Vercel CLI dalam mode tanpa project link dan tidak mencetak nilai environment. `.env.local` diabaikan Git. Jangan menaruh Service Role Key di file yang dikirim ke browser atau commit ke repository.

## Flow dan skor

- Satu submission berisi dua sesi wajib: **Latihan** (10 soal, dibagi Pagi/Siang/Malam) dan **Asesmen** (5 pasangan).
- Skor setiap sesi maksimum 100; skor total adalah rata-rata skor Latihan dan Asesmen.
- Latihan 10 soal memberi satu petunjuk dan satu percobaan ulang setelah jawaban pertama salah.
- Asesmen terdiri dari lima pasangan mandiri. Keberhasilan objektif dihitung dari jumlah pasangan yang memenuhi ketiga kriteria (minimal 4 dari 5), bukan dari akumulasi poin parsial.
- Aplikasi menyimpan hasil lengkap di browser dan menyiapkan antrean lokal sebelum submit. Data tetap tersimpan saat koneksi gagal dan dapat dikirim ulang.
- `POST /api/submit` memvalidasi semua jawaban dan menghitung ulang skor di server. Skor dari browser tidak digunakan.
- Submission menyimpan UUID, kode peserta acak, label anonim, skor sesi, skor komponen, jawaban, jumlah percobaan latihan, serta token idempotensi. Nama tidak dikumpulkan dari anak; backend menggunakan label tetap `Peserta anonim` dan kode hasil acak.
- Soal dan kunci jawaban aplikasi tersedia pada JavaScript publik; validasi server melindungi integritas perhitungan skor, bukan mencegah peserta melihat materi sumber.

## Setup Supabase

1. Buat project Supabase.
2. Jalankan seluruh isi `supabase/schema.sql` melalui SQL Editor.
3. Buat akun email/password admin melalui Supabase Auth.
4. Berikan role admin secara terkontrol melalui SQL Editor (ganti alamat email):

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

   Keluar lalu masuk kembali agar token Auth memuat role terbaru. Jangan menaruh role admin pada `user_metadata` yang dapat diubah pengguna.
5. Isi `url` dan `anonKey` publik di `js/supabase.js`. Nilai ini memang digunakan browser; RLS membatasi akses data hanya untuk admin.

Skema mengaktifkan RLS, menolak akses tabel untuk publik, memberi akses baca dan hapus submission hanya kepada pengguna terautentikasi dengan `app_metadata.role = admin`, dan membatasi RPC penulisan kepada `service_role`. Jika project sudah memakai skema sebelumnya, jalankan ulang `supabase/schema.sql` agar izin hapus ikut diterapkan.

## Setup Vercel

1. Hubungkan repository ini ke Vercel.
2. Tambahkan environment variables pada Vercel Project Settings:
   - `SUPABASE_URL`: URL project Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key Supabase. **Rahasia; hanya untuk environment server Vercel.**
3. Deploy. Vercel Functions otomatis mengekspos `api/submit.js` sebagai `POST /api/submit`; halaman Admin tersedia di `/admin`.
4. Uji submit dua peserta dengan nama sama, retry token yang sama, submit dengan sesi kurang, serta login sebagai akun non-admin.

`SUPABASE_ANON_KEY` tidak diperlukan oleh function submission; konfigurasi frontend Admin berada di `js/supabase.js`. File `.env.example` hanya contoh nama variable dan tidak menyimpan kunci.

Endpoint menerima payload maksimal 64 KiB dan melakukan validasi sesi/soal/format jawaban. Sebelum membuka aplikasi untuk umum, aktifkan rate limit atau proteksi spam melalui Vercel Firewall/WAF atau layanan rate limiting yang sesuai; in-memory limit tidak aman untuk function serverless.

## Admin dan export

- `/admin` memakai Supabase Auth email/password dan mengecek role admin dari metadata yang diverifikasi server Auth sebelum mengambil data.
- Dashboard menyediakan ringkasan skor, pencarian nama/kode, filter tanggal, pengurutan, pagination, detail jawaban, export Excel, dan tombol hapus di samping Detail maupun di dialog detail. Penghapusan permanen meminta konfirmasi dan ikut menghapus rincian sesi terkait.
- Export membuat worksheet `Ringkasan`, `Nilai Komponen`, dan `Rincian Jawaban`; filter sesi dan filter dashboard berlaku untuk export. Export satu peserta tersedia dari dialog detail.
- Admin memuat Supabase JS dan ExcelJS dari CDN, sehingga koneksi internet diperlukan pada halaman Admin.


## Meeting 12 - alignment

- Sepuluh latihan disusun bertahap dalam urutan pengenalan makna, melengkapi dan menyusun pola, memilih do/does, menyimak, lalu menjawab secara lisan. Latihan memberi satu petunjuk dan satu kesempatan ulang.
- Asesmen berisi lima prompt dengan frekuensi dinyatakan jelas dalam bahasa Indonesia. Siswa menyusun pertanyaan dan jawaban dari kartu kata, tanpa contoh atau bantuan dan hanya satu percobaan.
- Pasangan dinyatakan benar hanya bila pola pertanyaan, bentuk kata kerja, dan makna frekuensi semuanya benar. Target adalah minimal empat pasangan benar dari lima; poin parsial tidak dihitung sebagai pasangan benar.
- Identitas anak tidak diminta. Server mengganti label peserta dengan `Peserta anonim` dan membuat kode hasil acak.
- Admin menampilkan proporsi pencapaian target serta kriteria kelas yang paling lemah.
