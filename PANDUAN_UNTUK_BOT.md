
# Panduan Untuk Bot Pembuat Materi dan Quiz GezyLMS

Dokumen ini wajib dibaca sebelum bot membuat, mengubah, atau mem-publish konten di GezyLMS. Tujuannya agar materi dan quiz konsisten, benar secara isi, sesuai format teknis aplikasi, dan aman ditampilkan di `lms.gezytech.web.id`.

## 1. Prinsip Utama

- Gunakan bahasa Indonesia yang jelas, runtut, dan edukatif.
- Jangan mengarang fakta, kutipan, referensi, rumus, istilah, tokoh, tanggal, atau sumber.
- Jika materi membutuhkan data terbaru, regulasi, harga, jadwal, berita, atau dokumen spesifik, verifikasi dari sumber primer/tepercaya sebelum menulis.
- Sesuaikan tingkat kedalaman dengan target siswa/peserta yang diminta user. Jika target tidak disebutkan, gunakan level pemula-menengah.
- Utamakan pemahaman konsep, bukan hanya definisi singkat.
- Hindari konten yang terlalu padat dalam satu submateri. Pecah menjadi beberapa submateri jika topik panjang.
- Jangan memasukkan HTML mentah, script, iframe, atau gaya CSS ke materi/quiz.
- Jangan mengubah schema database, route aplikasi, atau file kode kecuali user memang meminta perubahan aplikasi.
- Jangan menghapus materi/quiz lama tanpa instruksi eksplisit.

## 2. Konteks Teknis GezyLMS

GezyLMS memakai Bun + Elysia + SQLite. Konten utama disimpan di database `gezylms.db`.

Tabel penting:

- `categories`: kategori materi.
- `materials`: materi utama.
- `material_sections`: submateri dan isi konten.
- `quizzes`: metadata quiz.
- `questions`: soal quiz.

Field penting:

- `categories.slug` harus unik.
- `materials.slug` harus unik.
- `material_sections.slug` harus unik per `material_id`.
- `status` memakai `draft` atau `published`.
- Konten materi disimpan di `material_sections.content_markdown`.
- Quiz hanya tampil ke siswa jika `quizzes.status = 'published'`.
- Materi dan submateri hanya tampil ke siswa jika status masing-masing `published`.
- Urutan tampil memakai `sort_order` dari kecil ke besar.

Format waktu:

- Gunakan format ISO lokal sederhana seperti `2026-07-22T08:00:00` untuk `deadline_at` atau `answers_released_at`.
- Jika user tidak meminta jadwal rilis kunci jawaban, isi `answers_released_at` dengan `null` atau kosong saat lewat panel admin.

## 3. Format Slug dan Penamaan

Slug harus:

- Huruf kecil.
- Memakai tanda hubung `-`.
- Tanpa spasi.
- Tanpa karakter khusus.
- Singkat tetapi deskriptif.

Contoh slug yang benar:

- `persamaan-kuadrat`
- `rumus-abc`
- `pengertian-inkuiri-kolaboratif`

Contoh slug yang salah:

- `Persamaan Kuadrat`
- `rumus_abc`
- `materi#1`

Judul boleh memakai kapitalisasi normal bahasa Indonesia, misalnya `Bentuk Umum Persamaan Kuadrat`.

## 4. Format Markdown Materi

Renderer GezyLMS hanya mendukung Markdown sederhana:

- Heading `#`, `##`, `###`.
- Paragraf biasa.
- Bullet list dengan `-`.
- Bold dengan `**teks**`.
- Italic dengan `*teks*`.
- Inline code dengan backtick.
- Link HTTP/HTTPS dengan format `[teks](https://contoh.com)`.
- Code block dengan tiga backtick.
- LaTeX dengan MathJax.

Jangan bergantung pada fitur Markdown berikut karena belum tentu dirender:

- Tabel Markdown.
- Checklist.
- Footnote.
- Blockquote kompleks.
- HTML mentah.
- Gambar Markdown.
- Nested list bertingkat banyak.

Untuk rumus:

- Inline math gunakan `\( ... \)`.
- Display math gunakan:

```markdown
\[
ax^2 + bx + c = 0
\]
```

Jangan pakai single dollar `$...$` karena konfigurasi MathJax aplikasi memakai `\(...\)` dan `\[...\]`.

## 5. Struktur Materi yang Disarankan

Satu materi utama sebaiknya berisi beberapa submateri. Setiap submateri idealnya memuat:

- Judul yang spesifik.
- Tujuan belajar singkat.
- Penjelasan konsep inti.
- Contoh atau ilustrasi.
- Langkah penyelesaian jika topik prosedural.
- Kesalahan umum atau catatan penting.
- Ringkasan singkat.
- Latihan refleksi ringan jika relevan.

Template submateri:

```markdown
# Judul Submateri

Setelah mempelajari bagian ini, peserta diharapkan mampu ...

## Konsep Inti

Tulis penjelasan utama dengan kalimat pendek dan runtut.

## Contoh

Berikan contoh konkret.

## Langkah-Langkah

- Langkah pertama.
- Langkah kedua.
- Langkah ketiga.

## Catatan Penting

Tuliskan batasan, miskonsepsi, atau hal yang sering salah.

## Ringkasan

- Poin utama 1.
- Poin utama 2.
- Poin utama 3.
```

## 6. Standar Kualitas Materi

Materi yang baik harus:

- Memiliki alur dari mudah ke sulit.
- Menjelaskan istilah baru sebelum digunakan.
- Memberi contoh yang sesuai konteks siswa/peserta.
- Menghindari klaim absolut jika topik sebenarnya kontekstual.
- Menyebutkan sumber jika menggunakan rujukan eksternal.
- Tidak sekadar menyalin panjang dari sumber lain.
- Tidak mencampur ejaan Indonesia dan Inggris tanpa alasan.
- Menggunakan istilah teknis secara konsisten.

Untuk materi matematika/sains:

- Tulis simbol dan rumus dengan LaTeX.
- Jelaskan arti setiap variabel.
- Periksa kembali operasi hitung.
- Pastikan jawaban contoh benar.

Untuk materi pedagogik/profesional:

- Bedakan definisi, tujuan, prinsip, langkah, dan contoh praktik.
- Sertakan contoh penerapan di kelas atau organisasi jika relevan.
- Jika menyebut kebijakan pendidikan, pastikan sumbernya jelas dan mutakhir.

## 7. Standar Quiz

Jenis soal yang didukung:

- `multiple_choice`: satu jawaban benar, tampil sebagai radio button.
- `true_false`: benar/salah, tampil sebagai radio button.
- `multi_response`: lebih dari satu jawaban benar, tampil sebagai checkbox.

Field soal:

- `question_text`: teks soal.
- `options`: array string, misalnya `["A", "B", "C", "D"]`.
- `correct_answer`: array indeks jawaban benar, misalnya `[0]` atau `[0,2]`.
- `points`: angka poin.
- `sort_order`: urutan soal.
- `explanation`: pembahasan singkat.

Aturan penting:

- Indeks jawaban dimulai dari `0`, bukan `1`.
- Untuk pilihan A, B, C, D, indeksnya adalah A=`0`, B=`1`, C=`2`, D=`3`.
- `multiple_choice` tetap harus memakai `correct_answer` berupa array, misalnya `[2]`.
- `true_false` gunakan `options` persis seperti `["Benar","Salah"]` kecuali user meminta istilah lain.
- `multi_response` harus memiliki minimal dua jawaban benar.
- Jangan membuat opsi "Semua benar" atau "Semua salah" kecuali benar-benar diperlukan, karena sering membuat penilaian ambigu.
- Jangan membuat dua opsi yang sama-sama benar pada `multiple_choice`.
- Jangan membuat soal yang jawabannya bergantung pada opini tanpa kriteria jelas.
- Setiap soal wajib punya pembahasan yang menjelaskan alasan jawaban benar dan, jika perlu, alasan pengecoh salah.

Contoh soal pilihan ganda:

```json
{
  "question_type": "multiple_choice",
  "question_text": "Pada persamaan \\(3x^2 - 7x + 2 = 0\\), nilai \\(a\\) adalah ...",
  "options": ["3", "-7", "2", "0"],
  "correct_answer": [0],
  "points": 1,
  "sort_order": 1,
  "explanation": "Bentuk umum persamaan kuadrat adalah \\(ax^2 + bx + c = 0\\). Koefisien \\(x^2\\) adalah \\(a=3\\)."
}
```

Contoh benar/salah:

```json
{
  "question_type": "true_false",
  "question_text": "Persamaan \\(5x + 2 = 0\\) adalah persamaan kuadrat.",
  "options": ["Benar", "Salah"],
  "correct_answer": [1],
  "points": 1,
  "sort_order": 2,
  "explanation": "Persamaan tersebut berderajat satu, bukan dua, sehingga bukan persamaan kuadrat."
}
```

Contoh multi-response:

```json
{
  "question_type": "multi_response",
  "question_text": "Pilih pernyataan yang benar tentang diskriminan \\(D=b^2-4ac\\).",
  "options": [
    "Jika D > 0, ada dua akar real berbeda",
    "Jika D = 0, ada akar kembar",
    "Jika D < 0, ada dua akar real berbeda",
    "Diskriminan tidak berkaitan dengan akar"
  ],
  "correct_answer": [0, 1],
  "points": 2,
  "sort_order": 3,
  "explanation": "Diskriminan menentukan jenis akar. \\(D>0\\) menghasilkan dua akar real berbeda, sedangkan \\(D=0\\) menghasilkan akar kembar."
}
```

## 8. Tingkat Kesulitan Quiz

Jika user tidak menentukan komposisi, gunakan pola:

- 40% soal pemahaman konsep.
- 40% soal penerapan.
- 20% soal analisis atau jebakan miskonsepsi.

Untuk 10 soal:

- 4 mudah.
- 4 sedang.
- 2 menantang.

Quiz harus menguji materi yang sudah tersedia atau diminta user. Jangan memasukkan konsep yang belum dijelaskan kecuali quiz memang bertujuan diagnosis awal.

## 9. Cara Memasukkan Konten

Ada dua cara umum:

- Melalui panel admin di `/admin`.
- Melalui API/admin route atau query database jika user meminta dan bot memiliki akses.

Endpoint admin yang tersedia:

- `POST /api/admin/categories`
- `POST /api/admin/materials`
- `POST /api/admin/sections`
- `POST /api/admin/quizzes`
- `POST /api/admin/questions`

Contoh payload kategori:

```json
{
  "name": "Matematika",
  "slug": "matematika",
  "description": "Materi matematika dasar sampai lanjut.",
  "sort_order": 1
}
```

Contoh payload materi:

```json
{
  "category_id": 1,
  "title": "Persamaan Kuadrat",
  "slug": "persamaan-kuadrat",
  "summary": "Memahami bentuk umum, diskriminan, dan penyelesaian persamaan kuadrat.",
  "status": "published",
  "sort_order": 1
}
```

Contoh payload submateri:

```json
{
  "material_id": 1,
  "title": "Bentuk Umum Persamaan Kuadrat",
  "slug": "bentuk-umum",
  "content_markdown": "# Bentuk Umum\n\nPersamaan kuadrat adalah ...",
  "status": "published",
  "sort_order": 1
}
```

Contoh payload quiz:

```json
{
  "material_id": 1,
  "section_id": 2,
  "title": "Latihan Persamaan Kuadrat",
  "description": "Quiz singkat tentang bentuk umum dan rumus ABC.",
  "status": "published",
  "deadline_at": null,
  "answers_released_at": null
}
```

## 10. Checklist Sebelum Publish

Sebelum mengubah status menjadi `published`, periksa:

- Kategori, materi, dan submateri punya slug valid.
- `sort_order` sudah berurutan.
- Materi tidak kosong.
- Heading Markdown tidak loncat secara membingungkan.
- Rumus LaTeX memakai `\(...\)` atau `\[...\]`.
- Tidak ada HTML/script mentah.
- Tidak ada placeholder seperti `TODO`, `isi nanti`, atau `contoh di sini`.
- Fakta, rumus, dan jawaban sudah dicek.
- Semua soal punya opsi valid.
- Semua `correct_answer` memakai indeks yang benar.
- Pembahasan soal tidak membocorkan jawaban sebelum quiz dikerjakan, tetapi akan tampil saat kunci dirilis.
- Quiz terhubung ke `material_id` dan/atau `section_id` yang benar jika relevan.

## 11. Validasi Teknis Setelah Input

Jika bot mengedit database atau membuat konten lewat script, jalankan pemeriksaan dasar:

```bash
bun run check
```

Cek data di SQLite jika perlu:

```bash
sqlite3 gezylms.db "SELECT id,title,slug,status,sort_order FROM materials ORDER BY sort_order;"
sqlite3 gezylms.db "SELECT id,material_id,title,slug,status,sort_order FROM material_sections ORDER BY material_id,sort_order;"
sqlite3 gezylms.db "SELECT id,title,status,material_id,section_id FROM quizzes ORDER BY created_at DESC;"
sqlite3 gezylms.db "SELECT id,quiz_id,question_type,options,correct_answer,sort_order FROM questions ORDER BY quiz_id,sort_order;"
```

Jika aplikasi sedang berjalan, cek halaman:

- `/materi`
- `/materi/{slug}`
- `/materi/{slug}/{sectionSlug}`
- `/quiz`
- `/quiz/{id}`

## 12. Jika User Meminta Materi Baru

Langkah kerja bot:

1. Pahami topik, target peserta, jumlah submateri, dan kedalaman yang diminta.
2. Jika informasi kurang, pilih asumsi wajar dan sebutkan di respons akhir.
3. Cek kategori/materi yang sudah ada agar tidak membuat duplikasi.
4. Buat struktur materi utama dan submateri.
5. Tulis konten tiap submateri dengan Markdown sederhana.
6. Simpan sebagai `draft` jika user masih ingin review; gunakan `published` hanya jika user meminta langsung tampil atau konteksnya jelas.
7. Verifikasi tampilan dan urutan.

## 13. Jika User Meminta Quiz Baru

Langkah kerja bot:

1. Pastikan quiz mengacu ke materi/submateri yang tepat.
2. Tentukan jumlah soal dan distribusi tingkat kesulitan.
3. Buat soal yang menguji konsep penting, bukan detail remeh.
4. Pastikan opsi pengecoh masuk akal tetapi tidak menipu secara tidak adil.
5. Validasi indeks `correct_answer`.
6. Tulis pembahasan untuk setiap soal.
7. Simpan quiz sebagai `draft` jika perlu review; `published` jika user meminta siap dikerjakan.
8. Cek quiz dari sisi siswa agar opsi dan skor berjalan.

## 14. Larangan Kritis

- Jangan membuat jawaban benar yang tidak ada di `options`.
- Jangan memakai indeks jawaban mulai dari 1.
- Jangan memasukkan `correct_answer` sebagai teks opsi untuk soal pilihan, misalnya `"A"` atau `"Benar"`; gunakan array indeks seperti `[0]`.
- Jangan membuat `options` sebagai string biasa; harus array JSON.
- Jangan mem-publish materi tanpa submateri published.
- Jangan mem-publish quiz tanpa soal.
- Jangan membuat konten yang melanggar hak cipta dengan menyalin panjang dari buku, modul, artikel, atau website.
- Jangan mengubah password/admin/user tanpa instruksi eksplisit.
- Jangan menjalankan perintah destruktif seperti menghapus database atau reset git tanpa izin eksplisit.

## 15. Format Respons Akhir Bot ke User

Setelah selesai membuat atau mengubah konten, laporkan secara singkat:

- Materi/quiz apa yang dibuat atau diubah.
- Statusnya `draft` atau `published`.
- Lokasi/slug atau ID quiz.
- Validasi yang sudah dilakukan.
- Hal yang perlu direview user, jika ada.

Contoh respons:

```text
Materi "Persamaan Kuadrat" sudah dibuat dengan 3 submateri dan status published. Slug: /materi/persamaan-kuadrat.

Quiz "Latihan Persamaan Kuadrat" sudah dibuat dengan 10 soal, status draft, terhubung ke submateri "Rumus ABC". Validasi indeks jawaban dan format JSON sudah dicek.
```

Bot ke depan wajib mengikuti `PANDUAN_UNTUK_BOT.md`, terutama bagian validasi teknis setelah input. Intinya, setelah membuat materi/quiz baru, bot tidak boleh berhenti hanya setelah insert data. Bot harus langsung mengecek bahwa data yang dibuat kompatibel dengan admin CRUD.

Yang harus dilakukan bot setiap selesai membuat konten:

1. Pastikan format data benar:
`slug` valid, `status` benar, `sort_order` terisi, `options` berupa JSON array, dan `correct_answer` berupa array indeks seperti `[0]`, bukan teks.

2. Pastikan relasi benar:
`material_id`, `section_id`, dan `quiz_id` harus mengarah ke data yang benar. Quiz jangan dibuat tanpa soal jika akan dipublish.

3. Jalankan validasi teknis:
```bash
cd ~/gezylms
/home/pgun/.bun/bin/bun run check
```

4. Tes data admin via API atau SQLite:
```bash
sqlite3 gezylms.db "SELECT id,title,slug,status FROM materials ORDER BY id DESC LIMIT 5;"
sqlite3 gezylms.db "SELECT id,material_id,title,slug,status FROM material_sections ORDER BY id DESC LIMIT 5;"
sqlite3 gezylms.db "SELECT id,title,status,material_id,section_id FROM quizzes ORDER BY id DESC LIMIT 5;"
sqlite3 gezylms.db "SELECT id,quiz_id,question_type,options,correct_answer FROM questions ORDER BY id DESC LIMIT 10;"
```

5. Jika bot mengubah kode aplikasi, wajib restart:
```bash
pm2 restart gezylms --update-env
```

6. Cek halaman admin:
```bash
curl -I https://lms.gezytech.web.id/admin
```

Praktisnya, setiap prompt ke bot bisa ditutup dengan instruksi ini:

```text
Setelah membuat materi/quiz, pastikan data bisa di-CRUD dari /admin. Jalankan validasi format database, bun run check, cek relasi material/section/quiz/question, dan restart PM2 hanya jika ada perubahan kode.
