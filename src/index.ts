import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { jwtPlugin } from "./auth";
import { authRoutes } from "./routes/auth";
import { materialRoutes } from "./routes/materials";
import { quizRoutes } from "./routes/quizzes";
import { adminRoutes } from "./routes/admin";

const PORT = parseInt(process.env.PORT || "3001");

const nav = (hasToken: boolean) => `
  <nav class="navbar">
    <div class="container">
      <a href="/" class="brand">GezyLMS</a>
      <div class="nav-links">
        <a href="/materi">Materi</a>
        <a href="/quiz">Quiz</a>
        ${hasToken ? '<a href="/history">Riwayat</a><a href="/admin">Admin</a><a href="/api/auth/logout">Logout</a>' : '<a href="/login">Login</a><a href="/register">Daftar</a>'}
      </div>
    </div>
  </nav>`;

const page = (title: string, body: string, hasToken = false, math = false) => `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - GezyLMS</title>
  <link rel="stylesheet" href="/style.css">
  ${math ? '<script>window.MathJax={tex:{inlineMath:[[\'\\\\(\',\'\\\\)\']],displayMath:[[\'\\\\[\',\'\\\\]\']]}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>' : ""}
</head>
<body>
  ${nav(hasToken)}
  ${body}
  <script src="/app.js"></script>
</body>
</html>`;

const app = new Elysia()
  .use(html())
  .use(staticPlugin({ assets: "public", prefix: "/" }))
  .use(jwtPlugin)
  .use(authRoutes)
  .use(materialRoutes)
  .use(quizRoutes)
  .use(adminRoutes)

  .get("/", ({ cookie }) => {
    const hasToken = !!cookie?.gezylms_token?.value;
    return page(
      "Beranda",
      `<header class="hero">
        <div class="container">
          <p class="eyebrow">LMS ringan untuk belajar mandiri</p>
          <h1>Materi, latihan, dan riwayat belajar dalam satu tempat.</h1>
          <p>GezyLMS mendukung materi Markdown + LaTeX, quiz interaktif, dan progress siswa yang tersimpan.</p>
          <div class="hero-buttons">
            <a href="/materi" class="btn btn-primary">Mulai Belajar</a>
            ${hasToken ? '<a href="/quiz" class="btn btn-secondary">Kerjakan Quiz</a>' : '<a href="/register" class="btn btn-secondary">Daftar Gratis</a>'}
          </div>
        </div>
      </header>
      <main class="container">
        <section class="features">
          <div class="feature-card"><h3>Materi Bertahap</h3><p>Kategori, materi, submateri, dan konten belajar tersusun sederhana.</p></div>
          <div class="feature-card"><h3>Quiz Interaktif</h3><p>Pilihan ganda, benar-salah, dan multi-response dengan skor otomatis.</p></div>
          <div class="feature-card"><h3>Progress Tersimpan</h3><p>Siswa wajib login agar riwayat belajar dan nilai bisa dilihat kembali.</p></div>
        </section>
      </main>
      <footer><div class="container">GezyLMS - powered by Bun + Elysia</div></footer>`,
      hasToken
    );
  })

  .get("/login", () => page("Login", `
    <main class="container narrow">
      <h2>Login</h2>
      <form id="login-form" class="card">
        <div class="form-group"><label for="username">Username</label><input id="username" required></div>
        <div class="form-group"><label for="password">Password</label><input id="password" type="password" required></div>
        <div id="error"></div>
        <button class="btn btn-primary" type="submit">Login</button>
      </form>
      <p class="center muted">Belum punya akun? <a href="/register">Daftar</a></p>
    </main>
    <script>
      document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await GezyLMS.api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: username.value, password: password.value })
          });
          location.href = '/';
        } catch (err) {
          GezyLMS.showError('#error', err);
        }
      });
    </script>`))

  .get("/register", () => page("Daftar", `
    <main class="container narrow">
      <h2>Daftar Akun Siswa</h2>
      <form id="register-form" class="card">
        <div class="form-group"><label for="full_name">Nama Lengkap</label><input id="full_name" required></div>
        <div class="form-group"><label for="username">Username</label><input id="username" required minlength="3"></div>
        <div class="form-group"><label for="password">Password</label><input id="password" type="password" required minlength="6"></div>
        <div id="error"></div>
        <button class="btn btn-primary" type="submit">Daftar</button>
      </form>
    </main>
    <script>
      document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await GezyLMS.api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ full_name: full_name.value, username: username.value, password: password.value })
          });
          location.href = '/login';
        } catch (err) {
          GezyLMS.showError('#error', err);
        }
      });
    </script>`))

  .get("/materi", ({ cookie }) => page("Materi", `
    <main class="container page-top">
      <div class="page-heading"><p class="eyebrow">Materi</p><h2>Daftar Materi</h2></div>
      <div id="materials" class="stack"></div>
    </main>
    <script>
      GezyLMS.api('/api/materials/categories').then(categories => {
        const el = document.getElementById('materials');
        const html = categories.map(c => {
          const mats = JSON.parse(c.materials_json || '[]');
          if (!mats.length) return '';
          return '<section class="category-section"><h3>' + GezyLMS.escapeHtml(c.name) + '</h3>' +
            mats.map(m => '<article class="card"><h4><a href="/materi/' + m.slug + '">' + GezyLMS.escapeHtml(m.title) + '</a></h4><p>' + GezyLMS.escapeHtml(m.summary || '') + '</p></article>').join('') +
            '</section>';
        }).join('');
        el.innerHTML = html || '<div class="notice">Belum ada materi published.</div>';
      }).catch(err => GezyLMS.showError('#materials', err));
    </script>`, !!cookie?.gezylms_token?.value))

  .get("/materi/:slug", ({ cookie }) => page("Detail Materi", `
    <main class="container page-top">
      <div id="material"></div>
    </main>
    <script>
      const slug = location.pathname.split('/').filter(Boolean)[1];
      GezyLMS.api('/api/materials/' + slug).then(m => {
        document.title = m.title + ' - GezyLMS';
        document.getElementById('material').innerHTML =
          '<div class="page-heading"><p class="eyebrow">Materi</p><h2>' + GezyLMS.escapeHtml(m.title) + '</h2><p>' + GezyLMS.escapeHtml(m.summary || '') + '</p></div>' +
          '<div class="stack">' + (m.sections.length ? m.sections.map((s, i) =>
            '<article class="card row-card"><div><span class="badge">Submateri ' + (i + 1) + '</span><h4><a href="/materi/' + m.slug + '/' + s.slug + '">' + GezyLMS.escapeHtml(s.title) + '</a></h4></div><a class="btn btn-secondary" href="/materi/' + m.slug + '/' + s.slug + '">Baca</a></article>'
          ).join('') : '<div class="notice">Belum ada submateri published.</div>') + '</div>';
      }).catch(err => GezyLMS.showError('#material', err));
    </script>`, !!cookie?.gezylms_token?.value, true))

  .get("/materi/:slug/:sectionSlug", ({ cookie }) => page("Submateri", `
    <main class="container page-top">
      <article id="section" class="content-card"></article>
    </main>
    <script>
      const parts = location.pathname.split('/').filter(Boolean);
      const slug = parts[1];
      const sectionSlug = parts[2];
      GezyLMS.api('/api/materials/' + slug + '/' + sectionSlug).then(data => {
        document.title = data.section.title + ' - GezyLMS';
        const nav = data.navigation;
        document.getElementById('section').innerHTML =
          '<p class="eyebrow">' + GezyLMS.escapeHtml(data.material.title) + '</p>' +
          '<h1>' + GezyLMS.escapeHtml(data.section.title) + '</h1>' +
          '<div class="content">' + GezyLMS.renderMarkdown(data.section.content_markdown || '') + '</div>' +
          '<div class="action-row"><button id="complete" class="btn btn-primary">Tandai Selesai</button>' +
          (nav.prev ? '<a class="btn btn-secondary" href="/materi/' + slug + '/' + nav.prev.slug + '">Sebelumnya</a>' : '') +
          (nav.next ? '<a class="btn btn-secondary" href="/materi/' + slug + '/' + nav.next.slug + '">Berikutnya</a>' : '') + '</div>';
        document.getElementById('complete').addEventListener('click', async () => {
          try {
            await GezyLMS.api('/api/materials/' + slug + '/' + sectionSlug + '/complete', { method: 'POST' });
            alert('Progress tersimpan.');
          } catch (err) {
            GezyLMS.showError('#section', err);
          }
        });
        GezyLMS.runMath();
      }).catch(err => GezyLMS.showError('#section', err));
    </script>`, !!cookie?.gezylms_token?.value, true))

  .get("/quiz", ({ cookie }) => page("Quiz", `
    <main class="container page-top">
      <div class="page-heading"><p class="eyebrow">Quiz</p><h2>Latihan Tersedia</h2></div>
      <div id="quizzes" class="stack"></div>
    </main>
    <script>
      GezyLMS.api('/api/quizzes/').then(quizzes => {
        document.getElementById('quizzes').innerHTML = quizzes.length ? quizzes.map(q =>
          '<article class="card row-card"><div><h4>' + GezyLMS.escapeHtml(q.title) + '</h4><p>' + GezyLMS.escapeHtml(q.description || '') + '</p></div><a class="btn btn-primary" href="/quiz/' + q.id + '">Kerjakan</a></article>'
        ).join('') : '<div class="notice">Belum ada quiz published.</div>';
      }).catch(err => GezyLMS.showError('#quizzes', err));
    </script>`, !!cookie?.gezylms_token?.value))

  .get("/quiz/:id", ({ cookie }) => page("Kerjakan Quiz", `
    <main class="container page-top">
      <div id="quiz"></div>
    </main>
    <script>
      const id = location.pathname.split('/').filter(Boolean)[1];
      GezyLMS.api('/api/quizzes/' + id).then(q => {
        document.title = q.title + ' - GezyLMS';
        document.getElementById('quiz').innerHTML =
          '<div class="page-heading"><p class="eyebrow">Quiz</p><h2>' + GezyLMS.escapeHtml(q.title) + '</h2><p>' + GezyLMS.escapeHtml(q.description || '') + '</p></div>' +
          '<form id="quiz-form">' + q.questions.map((question, idx) => {
            const type = question.question_type === 'multi_response' ? 'checkbox' : 'radio';
            return '<section class="quiz-question" data-qid="' + question.id + '" data-type="' + question.question_type + '">' +
              '<div class="q-text"><strong>' + (idx + 1) + '.</strong> ' + GezyLMS.escapeHtml(question.question_text) + '</div>' +
              '<div class="q-options">' + question.options.map((opt, optIdx) =>
                '<label><input name="q' + question.id + '" type="' + type + '" value="' + optIdx + '"> ' + GezyLMS.escapeHtml(opt) + '</label>'
              ).join('') + '</div></section>';
          }).join('') + '<button class="btn btn-primary" type="submit">Submit Jawaban</button></form>';
        document.getElementById('quiz-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const answers = q.questions.map(question => {
            const checked = [...document.querySelectorAll('input[name="q' + question.id + '"]:checked')].map(i => Number(i.value));
            return { question_id: question.id, answer: question.question_type === 'multi_response' ? checked : checked.slice(0, 1) };
          });
          try {
            const result = await GezyLMS.api('/api/quizzes/' + id + '/submit', { method: 'POST', body: JSON.stringify({ answers }) });
            location.href = '/quiz/' + id + '/result?attempt=' + result.attempt_id;
          } catch (err) {
            GezyLMS.showError('#quiz', err);
          }
        });
        GezyLMS.runMath();
      }).catch(err => GezyLMS.showError('#quiz', err));
    </script>`, !!cookie?.gezylms_token?.value, true))

  .get("/quiz/:id/result", ({ cookie }) => page("Hasil Quiz", `
    <main class="container page-top">
      <div id="result"></div>
    </main>
    <script>
      const id = location.pathname.split('/').filter(Boolean)[1];
      const attempt = new URLSearchParams(location.search).get('attempt');
      if (!attempt) document.getElementById('result').innerHTML = '<div class="notice error">Attempt tidak ditemukan.</div>';
      else GezyLMS.api('/api/quizzes/' + id + '/results/' + attempt).then(r => {
        document.getElementById('result').innerHTML =
          '<div class="result-box"><p class="eyebrow">Hasil Quiz</p><h2>' + GezyLMS.escapeHtml(r.quiz_title) + '</h2><p class="score">' + r.score + ' / ' + r.total_points + '</p>' +
          (r.answers_revealed ? '<p>Kunci jawaban sudah dibuka.</p>' : '<p>Kunci jawaban belum dibuka. Jadwal: ' + GezyLMS.escapeHtml(r.answers_released_at || 'belum ditentukan') + '</p>') + '</div>' +
          '<div class="stack">' + r.per_question.map((a, idx) =>
            '<article class="card"><h4>Soal ' + (idx + 1) + '</h4><p>Poin: ' + a.points_awarded + '</p>' +
            (r.answers_revealed ? '<p>' + GezyLMS.escapeHtml(a.question_text || '') + '</p><p><strong>Pembahasan:</strong> ' + GezyLMS.escapeHtml(a.explanation || '-') + '</p>' : '') + '</article>'
          ).join('') + '</div>';
        GezyLMS.runMath();
      }).catch(err => GezyLMS.showError('#result', err));
    </script>`, !!cookie?.gezylms_token?.value, true))

  .get("/history", ({ cookie }) => page("Riwayat", `
    <main class="container page-top">
      <div class="page-heading"><p class="eyebrow">Riwayat</p><h2>Progress Belajar</h2></div>
      <div id="history"></div>
    </main>
    <script>
      GezyLMS.api('/api/materials/history').then(h => {
        document.getElementById('history').innerHTML =
          '<h3>Submateri Selesai</h3><div class="stack">' + (h.sections.length ? h.sections.map(s => '<article class="card"><h4>' + GezyLMS.escapeHtml(s.material_title) + ' - ' + GezyLMS.escapeHtml(s.section_title) + '</h4><p>' + GezyLMS.escapeHtml(s.completed_at || s.last_opened_at || '') + '</p></article>').join('') : '<div class="notice">Belum ada progress materi.</div>') + '</div>' +
          '<h3 class="section-title">Quiz</h3><div class="stack">' + (h.attempts.length ? h.attempts.map(a => '<article class="card row-card"><div><h4>' + GezyLMS.escapeHtml(a.quiz_title) + '</h4><p>Skor: ' + a.score + ' / ' + a.total_points + '</p></div><span class="badge">' + GezyLMS.escapeHtml(a.completed_at || '') + '</span></article>').join('') : '<div class="notice">Belum ada attempt quiz.</div>') + '</div>';
      }).catch(err => GezyLMS.showError('#history', err));
    </script>`, !!cookie?.gezylms_token?.value))

  .get("/admin", ({ cookie }) => page("Admin", `
    <main class="container page-top">
      <div class="page-heading"><p class="eyebrow">Admin</p><h2>Kelola GezyLMS</h2><p>Panel sederhana untuk MVP. Gunakan status <code>published</code> agar konten tampil ke siswa.</p></div>
      <div id="admin-error"></div>
      <section class="admin-grid">
        <form id="category-form" class="card"><h3>Kategori</h3><input name="name" placeholder="Nama" required><input name="slug" placeholder="slug" required><textarea name="description" placeholder="Deskripsi"></textarea><button class="btn btn-primary">Tambah</button></form>
        <form id="material-form" class="card"><h3>Materi</h3><select name="category_id" required></select><input name="title" placeholder="Judul" required><input name="slug" placeholder="slug" required><textarea name="summary" placeholder="Ringkasan"></textarea><select name="status"><option>draft</option><option>published</option></select><button class="btn btn-primary">Tambah</button></form>
        <form id="section-form" class="card wide"><h3>Submateri</h3><select name="material_id" required></select><input name="title" placeholder="Judul" required><input name="slug" placeholder="slug" required><select name="status"><option>draft</option><option>published</option></select><textarea name="content_markdown" class="code-input" placeholder="Markdown + LaTeX"></textarea><button class="btn btn-primary">Tambah</button></form>
        <form id="quiz-form" class="card"><h3>Quiz</h3><select name="material_id"></select><select name="section_id"></select><input name="title" placeholder="Judul quiz" required><textarea name="description" placeholder="Deskripsi"></textarea><input name="answers_released_at" placeholder="Release kunci: 2026-07-22T08:00:00"><select name="status"><option>draft</option><option>published</option></select><button class="btn btn-primary">Tambah</button></form>
        <form id="question-form" class="card wide"><h3>Soal</h3><select name="quiz_id" required></select><select name="question_type"><option value="multiple_choice">multiple_choice</option><option value="true_false">true_false</option><option value="multi_response">multi_response</option></select><textarea name="question_text" placeholder="Teks soal + LaTeX" required></textarea><textarea name="options" placeholder='["Opsi A","Opsi B"]' required></textarea><input name="correct_answer" placeholder="[0]" required><input name="points" type="number" value="1"><textarea name="explanation" placeholder="Pembahasan"></textarea><button class="btn btn-primary">Tambah</button></form>
      </section>
      <section class="card"><h3>Data Saat Ini</h3><div id="admin-data"></div></section>
    </main>
    <script>
      const fill = (select, rows, label) => { select.innerHTML = '<option value="">- pilih -</option>' + rows.map(r => '<option value="' + r.id + '">' + GezyLMS.escapeHtml(label(r)) + '</option>').join(''); };
      async function loadAdmin() {
        try {
          const [categories, materials, quizzes] = await Promise.all([
            GezyLMS.api('/api/admin/categories'),
            GezyLMS.api('/api/admin/materials'),
            GezyLMS.api('/api/admin/quizzes')
          ]);
          fill(document.querySelector('#material-form [name=category_id]'), categories, r => r.name);
          fill(document.querySelector('#section-form [name=material_id]'), materials, r => r.title);
          fill(document.querySelector('#quiz-form [name=material_id]'), materials, r => r.title);
          fill(document.querySelector('#question-form [name=quiz_id]'), quizzes, r => r.title);
          document.querySelector('#quiz-form [name=section_id]').innerHTML = '<option value="">- opsional -</option>';
          document.getElementById('admin-data').innerHTML =
            '<p><strong>Kategori:</strong> ' + categories.length + '</p><p><strong>Materi:</strong> ' + materials.length + '</p><p><strong>Quiz:</strong> ' + quizzes.length + '</p>' +
            materials.map(m => '<div class="mini-row">' + GezyLMS.escapeHtml(m.title) + ' <span class="badge">' + GezyLMS.escapeHtml(m.status) + '</span></div>').join('');
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      }
      const bindJsonForm = (id, url, map) => {
        document.getElementById(id).addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target).entries());
          try {
            await GezyLMS.api(url, { method: 'POST', body: JSON.stringify(map(data)) });
            e.target.reset();
            await loadAdmin();
          } catch (err) {
            GezyLMS.showError('#admin-error', err);
          }
        });
      };
      bindJsonForm('category-form', '/api/admin/categories', d => ({ name: d.name, slug: d.slug, description: d.description }));
      bindJsonForm('material-form', '/api/admin/materials', d => ({ category_id: Number(d.category_id), title: d.title, slug: d.slug, summary: d.summary, status: d.status }));
      bindJsonForm('section-form', '/api/admin/sections', d => ({ material_id: Number(d.material_id), title: d.title, slug: d.slug, content_markdown: d.content_markdown, status: d.status }));
      bindJsonForm('quiz-form', '/api/admin/quizzes', d => ({ material_id: d.material_id ? Number(d.material_id) : undefined, section_id: d.section_id ? Number(d.section_id) : undefined, title: d.title, description: d.description, answers_released_at: d.answers_released_at || undefined, status: d.status }));
      bindJsonForm('question-form', '/api/admin/questions', d => ({ quiz_id: Number(d.quiz_id), question_type: d.question_type, question_text: d.question_text, options: JSON.parse(d.options), correct_answer: JSON.parse(d.correct_answer), points: Number(d.points || 1), explanation: d.explanation }));
      loadAdmin();
    </script>`, !!cookie?.gezylms_token?.value))

  .listen(PORT);

console.log(`GezyLMS running at http://localhost:${PORT}`);
