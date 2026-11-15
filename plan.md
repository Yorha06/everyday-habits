
## 1. Tujuan

> Status implementasi: kode aplikasi, API, skema, dan Admin sudah ditambahkan. Setup project Supabase/Vercel dan pengujian live masih memerlukan kredensial serta project deployment. Checklist menunjukkan pekerjaan di repository, bukan bukti deployment live.

Menambahkan penyimpanan submission terpusat dan halaman Admin pada Everyday Habits yang di-host di Vercel.

Target:
- Peserta wajib menyelesaikan seluruh sesi sebelum submit.
- Satu submission menyimpan identitas peserta dan seluruh hasil sesi.
- Nama boleh sama; identitas utama menggunakan UUID.
- Admin dapat melihat data, membuka detail skor per sesi, dan mengunduh Excel.
- Stack tetap Vanilla HTML/CSS/JavaScript, Vercel Functions, dan Supabase.

## 2. Arsitektur target

```text
Peserta
  |
  v
Frontend Everyday Habits (Vercel)
  |-- index.html
  |-- style.css
  |-- app.js
  |-- questions.js
  |-- js/supabase.js
  |-- js/scoring.js
  `-- js/submission.js
  |
  | POST /api/submit
  v
Vercel Function
  |-- validasi payload dan kelengkapan sesi
  |-- verifikasi/perhitungan skor
  `-- simpan secara atomik
  |
  v
Supabase PostgreSQL
  |-- submissions
  |-- session_results
  `-- Supabase Auth

Admin -> /admin -> Login -> Dashboard -> Detail -> Export Excel
```

Tidak perlu mengganti framework atau hosting. `server.js` tetap untuk menjalankan static site secara lokal; endpoint produksi ditangani Vercel Functions.

## 3. File dan komponen yang perlu diperbarui

| Komponen | Tindakan | Tanggung jawab |
|---|---|---|
| `app.js` | Update | Mengumpulkan hasil semua sesi, validasi kelengkapan, memulai submit |
| `questions.js` | Audit | Memastikan struktur soal dan identitas sesi konsisten |
| `index.html` | Update seperlunya | Memuat modul yang dibutuhkan |
| `style.css` | Update seperlunya | Ringkasan dan status submit |
| `js/supabase.js` | Buat | Konfigurasi client publik Supabase |
| `js/scoring.js` | Buat/refactor | Logika penilaian yang dapat diuji dan diverifikasi server |
| `js/submission.js` | Buat | Menyusun payload dan mengirim ke API |
| `api/submit.js` | Buat | Validasi dan penyimpanan submission di server |
| `admin/index.html` | Buat | Login dan dashboard |
| `admin/admin.js` | Buat | Auth, tabel data, pencarian, detail, export |
| `admin/admin.css` | Buat | Tampilan Admin |
| Supabase SQL | Buat | Tabel, constraint, index, RPC/transaksi, dan RLS |

Nama/lokasi file adalah rancangan target. Sesuaikan dengan struktur repository aktual setelah audit.

## 4. Desain database

### Tabel `submissions`

Satu baris untuk satu submission final.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `participant_code` | TEXT | Kode tampilan unik, misalnya EH-0001 |
| `participant_name` | TEXT | Nama peserta; tidak harus unik |
| `total_score` | NUMERIC | Total skor |
| `submitted_at` | TIMESTAMPTZ | Waktu submit |

Constraint/index:
- Primary key pada `id`.
- Unique index pada `participant_code`.
- Index pada `submitted_at`.
- Jangan membuat unique constraint pada `participant_name`.

### Tabel `session_results`

Satu baris untuk setiap sesi dalam submission.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `submission_id` | UUID | Foreign key ke `submissions.id` |
| `session_key` | TEXT | Identitas sesi yang stabil |
| `session_number` | INTEGER | Urutan sesi |
| `total_score` | NUMERIC | Skor sesi |
| `level_scores` | JSONB | Skor per kategori/komponen |
| `answer_details` | JSONB | Jawaban dan detail penilaian |

Constraint/index:
- Foreign key `submission_id`.
- Unique `(submission_id, session_key)`.
- Index pada `submission_id`.

Gunakan JSONB untuk detail yang bervariasi, bukan membuat kolom tetap untuk setiap pertanyaan. Asesmen lima pasangan dapat ditambahkan setelah format dan relasinya dipastikan; jangan mengasumsikan bentuk datanya sebelum audit.

## 5. Flow peserta

1. Peserta membuka aplikasi dan mengisi nama.
2. Peserta menyelesaikan seluruh sesi.
3. Hasil sesi disimpan sementara di browser sesuai mekanisme aplikasi.
4. Setelah semua sesi selesai, aplikasi menampilkan ringkasan.
5. Tombol Submit hanya aktif jika seluruh sesi wajib lengkap.
6. Peserta mengonfirmasi submission.
7. Frontend mengirim satu payload final ke `POST /api/submit`.
8. Server memvalidasi dan menyimpan submission beserta seluruh sesi dalam satu transaksi.
9. Server mengembalikan UUID/kode peserta.
10. Aplikasi menampilkan konfirmasi berhasil.

Aturan:
- Tidak ada pengiriman ke database sebelum submit final.
- Nama duplikat diperbolehkan.
- UUID menjadi identitas internal.
- Klik berulang/retry tidak boleh membuat data ganda.
- Data lokal jangan dihapus sebelum server mengonfirmasi sukses.

## 6. Flow API dan penyimpanan

Endpoint: `POST /api/submit`

Payload konseptual (sesuaikan setelah audit kode):

```json
{
  "participant_name": "Andi",
  "sessions": [
    {
      "session_key": "session-1",
      "session_number": 1,
      "answers": {}
    },
    {
      "session_key": "session-2",
      "session_number": 2,
      "answers": {}
    }
  ],
  "submission_token": "unique-client-generated-token"
}
```

Validasi server:
- Nama wajib dan memiliki batas panjang.
- Semua sesi wajib harus ada.
- Tidak boleh ada sesi duplikat.
- Validasi struktur dan tipe jawaban.
- Hitung ulang skor berdasarkan aturan penilaian tepercaya di server.
- Jangan mempercayai total skor dari browser.
- Validasi token idempotensi agar retry tidak membuat data ganda.
- Batasi ukuran payload.

Penyimpanan harus atomik: insert `submissions` dan seluruh `session_results` berhasil bersama-sama atau dibatalkan bersama-sama. Implementasikan melalui PostgreSQL function/RPC atau transaksi server yang sesuai.

## 7. Admin dan keamanan

### Admin
- Gunakan Supabase Auth.
- Buat akun admin secara terkontrol.
- Verifikasi role admin sebelum menampilkan data.
- Sediakan logout.
- Jangan mengandalkan penyembunyian halaman `/admin` sebagai proteksi.

### Kunci dan RLS
- Supabase URL dan publishable/anon key boleh berada di frontend dengan RLS yang benar.
- Service Role Key hanya disimpan sebagai environment variable Vercel.
- Jangan pernah memasukkan Service Role Key ke JavaScript publik atau repository.
- Aktifkan RLS pada tabel.
- Pengunjung publik tidak boleh membaca data submission.
- Admin berwenang boleh membaca data.
- Endpoint submission wajib melakukan validasi ketat karena kredensial server dengan hak istimewa dapat melewati RLS.
- Tambahkan rate limiting/perlindungan spam jika diperlukan.

## 8. Fitur halaman Admin

Route: `/admin`

### Login
- Login email/password melalui Supabase Auth.
- Verifikasi role admin.
- Jangan mengambil/menampilkan data sebelum autentikasi dan otorisasi lolos.

### Dashboard
- Total submission.
- Rata-rata skor keseluruhan.
- Rata-rata skor per sesi.
- Jumlah submission berdasarkan rentang tanggal.

### Tabel peserta
Kolom:
- Kode peserta.
- Nama.
- Skor setiap sesi.
- Total skor.
- Waktu submit.
- Tombol Detail.

Fitur:
- Pencarian nama/kode.
- Filter tanggal.
- Pengurutan.
- Pagination.
- Nama sama tetap tampil sebagai baris berbeda berdasarkan UUID/kode.

### Detail peserta
- Identitas peserta dan waktu submit.
- Total skor.
- Skor setiap sesi.
- Rincian kategori/komponen.
- Jawaban jika diperlukan.
- Pengambilan data berdasarkan `submission_id`, bukan nama.

### Export Excel
- Export seluruh peserta.
- Export berdasarkan filter.
- Export sesi tertentu.
- Export satu peserta.

Worksheet yang disarankan:
- `Summary`: satu baris per peserta.
- `Session Results`: satu baris per peserta per sesi.
- `Answer Details`: rincian jawaban/skor bila diperlukan.

Gunakan SheetJS atau proses export server. Pastikan hasil dapat dibuka di Excel/LibreOffice.

## 9. Environment variables

Atur melalui Vercel Project Settings dan environment lokal yang tidak di-commit.

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Untuk HTML/JS tanpa bundler, konfigurasi publik dapat dimuat melalui file konfigurasi publik. Secret tidak boleh dikirim ke browser.

## 10. Tahapan implementasi

### Fase 0 — Audit repository dan penilaian
- [x] Periksa struktur folder dan file relevan.
- [x] Identifikasi semua sesi wajib.
- [x] Petakan format jawaban dan penyimpanan lokal.
- [x] Temukan fungsi perhitungan skor.
- [x] Identifikasi cara aplikasi mendeteksi sesi selesai.
- [x] Dokumentasikan payload final.
- [x] Tetapkan posisi asesmen lima pasangan setelah formatnya jelas.

**Output:** spesifikasi data dan flow berdasarkan kode aktual.

### Fase 1 — Setup Supabase
- [ ] Buat project Supabase.
- [x] Buat definisi tabel `submissions` di `supabase/schema.sql`.
- [x] Buat definisi tabel `session_results` di `supabase/schema.sql`.
- [x] Buat constraint dan index.
- [x] Buat RPC/transaksi penyimpanan atomik.
- [ ] Jalankan SQL dan uji RLS pada project Supabase.
- [ ] Buat mekanisme role admin dan akun admin.

**Output:** database siap diuji.

### Fase 2 — Integrasi submission
- [x] Buat modul konfigurasi Supabase publik untuk halaman Admin.
- [x] Refactor pengumpulan hasil sesi.
- [x] Tambahkan validasi seluruh sesi wajib.
- [x] Buat ringkasan sebelum submit.
- [x] Buat endpoint `POST /api/submit`.
- [x] Validasi payload di server.
- [x] Verifikasi/perhitungan ulang skor di server.
- [x] Implementasikan transaksi atomik dan idempotensi.
- [x] Tambahkan status loading, sukses, gagal, dan retry.
- [x] Pertahankan data lokal sampai submit terkonfirmasi.

**Output:** satu submission final menyimpan semua sesi.

### Fase 3 — Admin
- [x] Buat `/admin`.
- [x] Implementasikan Supabase Auth.
- [x] Verifikasi role admin.
- [x] Buat dashboard ringkasan.
- [x] Buat tabel submission.
- [x] Tambahkan pencarian dan filter.
- [x] Buat detail peserta berbasis UUID.
- [x] Implementasikan logout dan proteksi akses.

**Output:** admin dapat melihat dan menelusuri submission.

### Fase 4 — Export Excel
- [x] Tetapkan format kolom.
- [x] Buat worksheet Summary.
- [x] Buat worksheet Session Results.
- [x] Tambahkan worksheet Answer Details.
- [x] Buat export semua data.
- [x] Buat export berdasarkan filter.
- [x] Buat export satu peserta.
- [ ] Uji di Excel dan LibreOffice.

**Output:** laporan Excel siap digunakan.

### Fase 5 — Testing dan deployment
- [x] Uji validasi dua peserta dengan nama sama.
- [x] Uji payload submit sebelum semua sesi selesai.
- [ ] Uji klik submit berulang.
- [ ] Uji koneksi terputus saat submit.
- [ ] Uji retry setelah kegagalan.
- [x] Uji konsistensi perhitungan skor server.
- [ ] Uji kegagalan penyimpanan detail sesi.
- [ ] Uji akses publik tanpa login.
- [ ] Uji akun non-admin.
- [ ] Uji export semua sesi dan detail.
- [ ] Atur environment variables Vercel.
- [ ] Deploy dan uji domain produksi.

**Output:** sistem siap digunakan.

## 11. Kriteria selesai

- [ ] Peserta tidak dapat submit sebelum semua sesi wajib selesai.
- [ ] Satu submission berisi seluruh sesi peserta.
- [ ] Nama duplikat diperbolehkan dan tidak menggabungkan data.
- [ ] Setiap submission memiliki UUID dan kode unik.
- [ ] Data utama dan detail sesi tersimpan atomik.
- [ ] Retry tidak membuat submission ganda.
- [ ] Skor final diverifikasi di server.
- [ ] Pengunjung publik tidak dapat membaca data peserta.
- [ ] Hanya admin berwenang yang dapat membuka dashboard.
- [ ] Admin dapat melihat detail setiap sesi.
- [ ] Admin dapat mengunduh Excel.
- [ ] Deployment tetap menggunakan Vercel.

## 12. Keputusan teknis

1. Pertahankan Vanilla JavaScript; jangan migrasi framework.
2. Gunakan UUID, bukan nama, sebagai identitas utama.
3. Kirim satu submission final setelah seluruh sesi selesai.
4. Gunakan tabel relasi untuk hasil sesi dan JSONB untuk detail yang bervariasi.
5. Jangan pernah menaruh Service Role Key di frontend.
6. Verifikasi skor di server.
7. Audit sistem penilaian aktual sebelum mengubahnya.
8. Jangan mengasumsikan struktur asesmen lima pasangan sebelum formatnya ditetapkan.

## 13. Referensi

- Supabase: https://supabase.com/
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database Functions: https://supabase.com/docs/guides/database/functions
- Vercel Functions: https://vercel.com/docs/functions
- SheetJS: https://docs.sheetjs.com/