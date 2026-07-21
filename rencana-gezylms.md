# Rencana Implementasi: GezyLMS Ringan

> **Target:** Learning Management System (LMS) ringan dan publik untuk materi belajar dan latihan interaktif.
> **Fitur inti:** Materi pembelajaran, quiz pilihan ganda/benar-salah/multi-response, riwayat belajar, skor, review jawaban.
> **Data persistent:** Materi, progress baca, skor, dan jawaban tersimpan, bisa dilihat kembali setelah login ulang.
> **Dukungan matematika:** Konten materi dan soal quiz mendukung LaTeX.
> **Akses:** Siapa saja boleh menggunakan aplikasi, tetapi akun siswa wajib agar progress dan nilai tersimpan.

---

## 1. Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Runtime | Bun 1.3.14 | Sudah terinstall, ringan (~60 MB per process) |
| Framework | **Elysia** | Fast, TypeScript-native, plugin ecosystem, low overhead |
| Database | **SQLite** (`bun:sqlite`) | Zero RAM overhead tambahan, file-based, built-in |
| Frontend | Server-rendered HTML + vanilla JS (HTMX opsional) | Tidak perlu SPA framework, rendering sisi server lebih ringan |
| Auth | Session-based (cookie) | `bun:sqlite` bisa langsung dipakai untuk session store, tanpa Redis |
| Reverse Proxy | Nginx | Sudah terinstall |
| Process Manager | PM2 | Sudah berjalan (3 proses: gezytech, platform-app, public-app) |

### Kenapa Elysia (bukan Hono)?

- Elysia memiliki plugin `@elysiajs/cookie`, `@elysiajs/html`, `@elysiajs/static` yang terintegrasi baik
- Performa setara Hono, tapi DX lebih baik untuk server-rendered app
- Built-in validation (Eden)

### Catatan LaTeX

- Konten materi dan soal disimpan sebagai teks/HTML aman dengan sintaks LaTeX.
- Rumus inline memakai format `\( ... \)`.
- Rumus display memakai format `\[ ... \]`.
- Rendering dilakukan di browser menggunakan asset pendukung seperti KaTeX atau MathJax, tanpa mengubah stack utama.
- Untuk deployment stabil, asset KaTeX/MathJax sebaiknya disimpan lokal di folder static, bukan bergantung CDN.

---

## 2. Arsitektur

```
User Browser
    │
    ▼
Nginx (reverse proxy: lms.gezytech.web.id → localhost:3001)
    │
    ▼
Bun + Elysia (port 3001)
    │
    ├── Static files (CSS, minimal JS, KaTeX/MathJax asset)
    ├── Server-rendered HTML (template literal / JSX via @elysiajs/html)
    ├── API routes (materi, progress, quiz submit, score retrieval)
    └── SQLite (gezylms.db)
```

### Estimasi Resource

| Komponen | RAM |
|---|---|
| Bun process (Elysia app) | ~60-80 MB |
| SQLite | ~5-10 MB (embedded) |
| Static LaTeX renderer | Tidak menambah process server |
| **Total tambahan** | **~65-90 MB** |

Dengan RAM free ~1 GB, sangat aman.

---

## 3. Fitur & Halaman

| Halaman | Fungsi |
|---|---|
| `/` | Landing publik + dashboard setelah login |
| `/materi` | Daftar materi berdasarkan kategori/topik |
| `/materi/:slug` | Detail materi dan daftar submateri |
| `/materi/:slug/:sectionSlug` | Halaman baca submateri/konten dengan dukungan Markdown + LaTeX |
| `/materi/:slug/:sectionSlug/selesai` | Tandai submateri sudah dipelajari |
| `/quiz` | Daftar quiz yang tersedia |
| `/quiz/:id` | Halaman pengerjaan quiz |
| `/quiz/:id/result` | Hasil setelah submit; kunci jawaban tampil setelah deadline |
| `/login` | Form login sederhana |
| `/register` | Pendaftaran siswa |
| `/history` | Riwayat belajar: submateri dibaca dan quiz dikerjakan |
| `/admin` | Panel buat/kelola kategori, materi, submateri, quiz, dan soal |

### Modul Materi

- Struktur sederhana: kategori/topik → materi → submateri → konten.
- Konten ditulis dengan Markdown + LaTeX.
- Submateri dapat dihubungkan ke quiz terkait.
- Progress siswa disimpan per submateri: belum mulai, sedang dipelajari, selesai.
- Admin dapat membuat, mengedit, menerbitkan, atau menyembunyikan materi.

### Modul Quiz

**Tipe soal yang didukung:**

- Pilihan ganda (1 jawaban benar dari 4-5 opsi)
- Benar-salah (true/false)
- Multi-response (beberapa jawaban benar, skor parsial)

**Dukungan LaTeX pada quiz:**

- `question_text` mendukung LaTeX.
- `options` mendukung LaTeX.
- `explanation` mendukung LaTeX.
- Setelah submit, siswa langsung melihat skor.
- Kunci jawaban dan pembahasan baru tampil setelah deadline/release time yang ditentukan admin.

---

## 4. Skema Database

```sql
-- Tabel users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'student',  -- 'student' atau 'admin'
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabel categories / kategori topik
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tabel materi
CREATE TABLE materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES categories(id),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    status TEXT DEFAULT 'draft',    -- 'draft' atau 'published'
    sort_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabel submateri / konten
CREATE TABLE material_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content_markdown TEXT NOT NULL,  -- Markdown + LaTeX
    status TEXT DEFAULT 'draft',     -- 'draft' atau 'published'
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(material_id, slug)
);

-- Progress baca submateri per siswa
CREATE TABLE section_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    section_id INTEGER REFERENCES material_sections(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress', -- 'in_progress' atau 'completed'
    last_opened_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    UNIQUE(user_id, section_id)
);

-- Tabel quizzes
CREATE TABLE quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
    section_id INTEGER REFERENCES material_sections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',       -- 'draft' atau 'published'
    deadline_at TEXT,                  -- batas pengerjaan / acuan buka kunci
    answers_released_at TEXT,          -- waktu kunci jawaban boleh dilihat
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabel questions
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL,       -- 'multiple_choice', 'true_false', 'multi_response'
    question_text TEXT NOT NULL,       -- mendukung LaTeX
    options TEXT NOT NULL,             -- JSON array, opsi boleh berisi LaTeX
    correct_answer TEXT NOT NULL,      -- JSON: untuk MC [0], TF [true/false], MR [0,2]
    points INTEGER DEFAULT 1,
    explanation TEXT                   -- mendukung LaTeX
);

-- Tabel quiz attempts (jawaban siswa)
CREATE TABLE attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    quiz_id INTEGER REFERENCES quizzes(id),
    answers TEXT NOT NULL,             -- JSON: [{"q_id": 1, "answer": [0]}, ...]
    score INTEGER,
    total_points INTEGER,
    completed_at TEXT DEFAULT (datetime('now'))
);
```

---

## 5. Struktur Rute API

```typescript
// Auth
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/logout

// Materi (siswa)
GET    /api/categories                   // daftar kategori/topik
GET    /api/materials                    // daftar materi published
GET    /api/materials/:slug              // detail materi + daftar submateri published
GET    /api/materials/:slug/:sectionSlug // detail submateri/konten
POST   /api/sections/:id/progress        // update progress baca submateri
POST   /api/sections/:id/complete        // tandai submateri selesai

// Quiz (siswa)
GET    /api/quizzes                      // daftar quiz published
GET    /api/quizzes/:id                  // detail quiz + soal (tanpa kunci)
POST   /api/quizzes/:id/submit           // submit jawaban → simpan ke attempts
GET    /api/quizzes/:id/results/:attemptId  // lihat skor; kunci/pembahasan tampil setelah release time

// History
GET    /api/history                      // riwayat submateri dan quiz user login

// Admin
POST   /api/admin/categories             // buat kategori/topik
PUT    /api/admin/categories/:id         // edit kategori/topik
DELETE /api/admin/categories/:id         // hapus kategori/topik

POST   /api/admin/materials              // buat materi
PUT    /api/admin/materials/:id          // edit materi
DELETE /api/admin/materials/:id          // hapus materi
POST   /api/admin/materials/:id/publish  // publish/unpublish materi

POST   /api/admin/sections               // buat submateri/konten
PUT    /api/admin/sections/:id           // edit submateri/konten Markdown + LaTeX
DELETE /api/admin/sections/:id           // hapus submateri/konten
POST   /api/admin/sections/:id/publish   // publish/unpublish submateri

POST   /api/admin/quizzes                // buat quiz baru
PUT    /api/admin/quizzes/:id            // edit quiz
DELETE /api/admin/quizzes/:id            // hapus quiz
POST   /api/admin/questions              // tambah soal
PUT    /api/admin/questions/:id          // edit soal
DELETE /api/admin/questions/:id          // hapus soal

GET    /api/admin/history                // MVP: lihat history per siswa
```

---

## 6. Pendekatan Frontend

**Opsi A: Server-rendered HTML + vanilla JS** ← Pilihan MVP

- Elysia HTML plugin render template literal
- Form submit tradisional + sedikit `fetch()` untuk UX
- Tidak perlu build step
- File CSS tunggal, minimal
- Script kecil untuk render Markdown dan LaTeX setelah halaman dimuat

**Opsi B: HTMX**

- Lebih interaktif tanpa JS framework
- Tetap server-rendered
- Tambah library ~14 KB
- Cocok jika admin panel butuh edit inline tanpa SPA

**Opsi C: Alpine.js / Petite-Vue**

- Interaktivitas client-side ringan
- ~15 KB
- Belum perlu untuk MVP

Saran: **Opsi A**, upgrade ke B jika butuh interaktivitas lebih.

### Markdown + LaTeX

Materi ditulis sebagai Markdown agar admin tetap cepat membuat konten tanpa rich text editor. Markdown dirender menjadi HTML aman, lalu LaTeX dirender di browser.

Prioritas keamanan:

- Sanitasi HTML hasil render Markdown sebelum ditampilkan.
- Batasi tag HTML mentah di Markdown, atau nonaktifkan HTML mentah untuk MVP.
- Escape konten user-facing selain konten admin.

### Rendering LaTeX

Pilihan praktis:

- **KaTeX:** cepat, ringan, cocok untuk mayoritas rumus matematika sekolah.
- **MathJax:** lebih lengkap, lebih toleran untuk variasi sintaks LaTeX, tetapi lebih berat.

Rekomendasi awal: **KaTeX lokal** untuk materi dan quiz. Jika nanti ada rumus yang tidak didukung KaTeX, baru evaluasi MathJax.

Contoh konten materi:

```text
Rumus luas lingkaran adalah \(L = \pi r^2\).

Untuk persamaan kuadrat:
\[
ax^2 + bx + c = 0
\]
```

---

## 7. Deployment Plan

```bash
# 1. Gunakan direktori app saat ini
cd /home/pgun/gezylms

# 2. Init project bila belum ada
bun init
bun add elysia @elysiajs/html @elysiajs/cookie @elysiajs/static

# 3. Tambahkan asset LaTeX renderer lokal
# Contoh: simpan KaTeX CSS/JS/font ke public/vendor/katex

# 4. Develop & test (port 3001)
bun run --watch src/index.ts

# 5. Deploy via PM2
pm2 start src/index.ts \
  --name gezylms \
  --interpreter /home/pgun/.bun/bin/bun \
  --env PORT=3001

# 6. Nginx reverse proxy
# Tambahkan server block untuk lms.gezytech.web.id → localhost:3001
```

---

## 8. Timeline Estimasi

| Fase | Durasi | Deliverable |
|---|---|---|
| **Fase 1: Setup, Auth, Schema** | 1-2 jam | Project init, SQLite schema, login/register, role admin/student |
| **Fase 2: Modul Materi** | 2-3 jam | CRUD kategori, materi, submateri, halaman baca, progress siswa, Markdown + LaTeX |
| **Fase 3: Quiz Engine** | 2-3 jam | CRUD quiz/soal, halaman pengerjaan, scoring, LaTeX di soal |
| **Fase 4: Results & History** | 1-2 jam | Skor setelah submit, kunci setelah deadline, riwayat submateri/quiz |
| **Fase 5: Admin & Polish** | 1-2 jam | Admin panel sederhana, styling, validasi, UX dasar |
| **Fase 6: Deploy** | 1 jam | Nginx, PM2, production check |
| **Total** | **8-13 jam** | MVP LMS ringan |

---

## 9. Prioritas MVP

Urutan implementasi yang paling aman:

1. Auth sederhana: login, register opsional, session cookie.
2. Schema SQLite: users, categories, materials, material_sections, section_progress, quizzes, questions, attempts.
3. Halaman siswa: dashboard, daftar kategori/materi, baca submateri, daftar quiz, kerjakan quiz, hasil.
4. Rendering Markdown + LaTeX: aktif di submateri, soal, opsi, dan pembahasan.
5. Admin minimal: tambah/edit/publish kategori, materi, submateri, quiz, dan soal.
6. History: tampilkan submateri selesai dan attempt quiz per siswa.
7. Aturan review quiz: skor langsung, kunci jawaban/pembahasan setelah deadline atau `answers_released_at`.

---

## 10. Keputusan Final MVP

1. **Struktur materi**
   - [x] Sederhana dulu: kategori/topik → materi → submateri → konten

2. **Format penulisan materi**
   - [x] Markdown + LaTeX

3. **Siapa yang membuat materi dan soal**
   - [x] PakGun/admin
   - [x] Guru lain juga bisa menjadi admin
   - [ ] Siswa bisa submit, tetapi perlu approval

4. **Target pengguna**
   - [x] Siapa saja bisa akses (publik)

5. **Cara login**
   - [x] Akun siswa wajib agar progress dan nilai tersimpan per siswa

6. **Review jawaban quiz**
   - [x] Skor saja, kunci jawaban belakangan setelah deadline

7. **Statistik guru**
   - [x] Tidak perlu untuk MVP, cukup history per siswa

8. **Domain/URL**
   - [x] `lms.gezytech.web.id`

---

> Keputusan MVP sudah cukup untuk mulai implementasi: schema dan auth, lalu modul materi, kemudian quiz engine.
