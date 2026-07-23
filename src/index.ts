import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { jwtPlugin } from "./auth";
import { authRoutes } from "./routes/auth";
import { materialRoutes } from "./routes/materials";
import { quizRoutes } from "./routes/quizzes";
import { adminRoutes } from "./routes/admin";

const PORT = parseInt(process.env.PORT || "3001");
const ASSET_VERSION = "20260723-0735";

const nav = (hasToken: boolean) => `
  <nav class="navbar">
    <div class="container">
      <div class="brand-wrapper">
        <a href="/" class="brand">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="10" fill="url(#brand-grad)" />
            <path d="M10 16L14 20L22 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stop-color="#3B82F6"/>
                <stop offset="0.5" stop-color="#8B5CF6"/>
                <stop offset="1" stop-color="#EC4899"/>
              </linearGradient>
            </defs>
          </svg>
          GezyLMS
        </a>
        <span class="brand-badge">PRO</span>
      </div>
      <button class="nav-toggle" onclick="GezyLMS.toggleNav()" aria-label="Toggle Navigation">
        ☰
      </button>
      <div class="nav-links">
        <a href="/materi">Materi</a>
        <a href="/quiz">Quiz</a>
        ${hasToken ? `
          <a href="/history">Riwayat</a>
          <a href="/admin">Admin</a>
          <a href="/api/auth/logout" class="nav-cta">Logout</a>
        ` : `
          <a href="/login">Login</a>
          <a href="/register" class="nav-cta">Daftar</a>
        `}
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
  <script src="/app.js?v=${ASSET_VERSION}"></script>
  ${math ? '<script>window.MathJax={tex:{inlineMath:[[\'\\\\(\',\'\\\\)\']],displayMath:[[\'\\\\[\',\'\\\\]\']]}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>' : ""}
</head>
<body>
  ${nav(hasToken)}
  ${body}
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
        <div class="container animate-fade-in">
          <p class="eyebrow">✨ Platform Pembelajaran Digital Terpadu</p>
          <h1>Belajar Lebih Interaktif dengan <span class="gradient-text">GezyLMS</span></h1>
          <p>Materi pembelajaran terstruktur dengan LaTeX, latihan quiz interaktif, dan pemantauan nilai real-time dalam satu platform modern.</p>
          <div class="hero-buttons">
            <a href="/materi" class="btn btn-primary">🚀 Mulai Belajar Sekarang</a>
            ${hasToken ? '<a href="/quiz" class="btn btn-secondary">🎯 Kerjakan Quiz</a>' : '<a href="/register" class="btn btn-secondary">✨ Daftar Gratis</a>'}
          </div>
        </div>
      </header>
      <main class="container">
        <section class="features">
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>Materi Bertahap</h3>
            <p>Kategori, materi, submateri, dan konten belajar tersusun rapi dengan dukungan Markdown & sintaks matematis LaTeX.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Quiz Interaktif</h3>
            <p>Pilihan ganda, benar-salah, dan multi-response dengan pengolahan skor otomatis secara instan.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Progress Real-Time</h3>
            <p>Riwayat materi yang selesai dan hasil evaluasi quiz tersimpan dengan aman pada profil siswa.</p>
          </div>
        </section>
      </main>
      <footer>
        <div class="container">GezyLMS &copy; 2026 &bull; Powered by Bun + Elysia</div>
      </footer>`,
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
        <form id="category-form" class="card"><h3 id="category-form-title">Kategori</h3><input type="hidden" name="id"><input name="name" placeholder="Nama" required><input name="slug" placeholder="slug" required><textarea name="description" placeholder="Deskripsi"></textarea><input name="sort_order" type="number" placeholder="Urutan" value="0"><div class="action-row compact"><button id="category-submit" class="btn btn-primary">Tambah</button><button id="category-cancel" class="btn btn-secondary" type="button" style="display:none">Batal edit</button></div></form>
        <form id="material-form" class="card"><h3 id="material-form-title">Materi</h3><input type="hidden" name="id"><select name="category_id" required></select><input name="title" placeholder="Judul" required><input name="slug" placeholder="slug" required><textarea name="summary" placeholder="Ringkasan"></textarea><input name="sort_order" type="number" placeholder="Urutan" value="0"><select name="status"><option>draft</option><option>published</option></select><div class="action-row compact"><button id="material-submit" class="btn btn-primary">Tambah</button><button id="material-cancel" class="btn btn-secondary" type="button" style="display:none">Batal edit</button></div></form>
        <form id="section-form" class="card wide"><h3 id="section-form-title">Submateri</h3><input type="hidden" name="id"><select name="material_id" required></select><input name="title" placeholder="Judul" required><input name="slug" placeholder="slug" required><input name="sort_order" type="number" placeholder="Urutan" value="0"><select name="status"><option>draft</option><option>published</option></select><textarea name="content_markdown" class="code-input" placeholder="Markdown + LaTeX"></textarea><div class="action-row compact"><button id="section-submit" class="btn btn-primary">Tambah</button><button id="section-cancel" class="btn btn-secondary" type="button" style="display:none">Batal edit</button></div></form>
        <form id="quiz-form" class="card"><h3 id="quiz-form-title">Quiz</h3><input type="hidden" name="id"><select name="material_id"></select><select name="section_id"></select><input name="title" placeholder="Judul quiz" required><textarea name="description" placeholder="Deskripsi"></textarea><input name="deadline_at" placeholder="Deadline: 2026-07-22T08:00:00"><input name="answers_released_at" placeholder="Release kunci: 2026-07-22T08:00:00"><select name="status"><option>draft</option><option>published</option></select><div class="action-row compact"><button id="quiz-submit" class="btn btn-primary">Tambah</button><button id="quiz-cancel" class="btn btn-secondary" type="button" style="display:none">Batal edit</button></div></form>
        <form id="question-form" class="card wide"><h3 id="question-form-title">Soal</h3><input type="hidden" name="id"><select name="quiz_id" required></select><select name="question_type"><option value="multiple_choice">multiple_choice</option><option value="true_false">true_false</option><option value="multi_response">multi_response</option></select><textarea name="question_text" placeholder="Teks soal + LaTeX" required></textarea><textarea name="options" placeholder='["Opsi A","Opsi B"]' required></textarea><input name="correct_answer" placeholder="[0]" required><input name="points" type="number" value="1"><input name="sort_order" type="number" placeholder="Urutan" value="0"><textarea name="explanation" placeholder="Pembahasan"></textarea><div class="action-row compact"><button id="question-submit" class="btn btn-primary">Tambah</button><button id="question-cancel" class="btn btn-secondary" type="button" style="display:none">Batal edit</button></div></form>
      </section>
      <section class="card"><h3>Data Saat Ini</h3><div id="admin-data"></div></section>
    </main>
    <script>
      let adminState = { categories: [], materials: [], quizzes: [], sections: [], questions: [], selectedMaterialId: null, selectedQuizId: null };
      const fill = (select, rows, label) => { select.innerHTML = '<option value="">- pilih -</option>' + rows.map(r => '<option value="' + r.id + '">' + GezyLMS.escapeHtml(label(r)) + '</option>').join(''); };
      const categoryPayload = d => ({ name: d.name, slug: d.slug, description: d.description || '', sort_order: Number(d.sort_order || 0) });
      const materialPayload = d => ({ category_id: Number(d.category_id), title: d.title, slug: d.slug, summary: d.summary, status: d.status, sort_order: Number(d.sort_order || 0) });
      const sectionPayload = d => ({ material_id: Number(d.material_id), title: d.title, slug: d.slug, content_markdown: d.content_markdown, status: d.status, sort_order: Number(d.sort_order || 0) });
      const quizPayload = d => ({ material_id: d.material_id ? Number(d.material_id) : undefined, section_id: d.section_id ? Number(d.section_id) : undefined, title: d.title, description: d.description || '', deadline_at: d.deadline_at || undefined, answers_released_at: d.answers_released_at || undefined, status: d.status });
      const questionPayload = d => ({ quiz_id: Number(d.quiz_id), question_type: d.question_type, question_text: d.question_text, options: JSON.parse(d.options), correct_answer: JSON.parse(d.correct_answer), points: Number(d.points || 1), sort_order: Number(d.sort_order || 0), explanation: d.explanation || '' });
      const labelById = (rows, id, fallback = '-') => {
        const row = rows.find(r => r.id === id);
        return row?.title || row?.name || fallback;
      };
      const loadQuizSections = async (materialId, selectedSectionId = '') => {
        const select = document.querySelector('#quiz-form [name=section_id]');
        if (!materialId) {
          select.innerHTML = '<option value="">- opsional -</option>';
          return;
        }
        const rows = await GezyLMS.api('/api/admin/materials/' + materialId + '/sections');
        select.innerHTML = '<option value="">- opsional -</option>' + rows.map(r => '<option value="' + r.id + '">' + GezyLMS.escapeHtml(r.title) + '</option>').join('');
        select.value = selectedSectionId || '';
      };
      const resetCategoryForm = () => {
        const form = document.getElementById('category-form');
        form.reset();
        form.elements.id.value = '';
        form.elements.sort_order.value = '0';
        document.getElementById('category-form-title').textContent = 'Kategori';
        document.getElementById('category-submit').textContent = 'Tambah';
        document.getElementById('category-cancel').style.display = 'none';
      };
      const resetMaterialForm = () => {
        const form = document.getElementById('material-form');
        form.reset();
        form.elements.id.value = '';
        form.elements.sort_order.value = '0';
        document.getElementById('material-form-title').textContent = 'Materi';
        document.getElementById('material-submit').textContent = 'Tambah';
        document.getElementById('material-cancel').style.display = 'none';
      };
      const resetSectionForm = (keepMaterial = true) => {
        const form = document.getElementById('section-form');
        const materialId = keepMaterial ? form.elements.material_id.value : '';
        form.reset();
        form.elements.id.value = '';
        form.elements.sort_order.value = '0';
        if (keepMaterial) form.elements.material_id.value = materialId;
        document.getElementById('section-form-title').textContent = 'Submateri';
        document.getElementById('section-submit').textContent = 'Tambah';
        document.getElementById('section-cancel').style.display = 'none';
      };
      const resetQuizForm = () => {
        const form = document.getElementById('quiz-form');
        form.reset();
        form.elements.id.value = '';
        document.querySelector('#quiz-form [name=section_id]').innerHTML = '<option value="">- opsional -</option>';
        document.getElementById('quiz-form-title').textContent = 'Quiz';
        document.getElementById('quiz-submit').textContent = 'Tambah';
        document.getElementById('quiz-cancel').style.display = 'none';
      };
      const resetQuestionForm = (keepQuiz = true) => {
        const form = document.getElementById('question-form');
        const quizId = keepQuiz ? form.elements.quiz_id.value : '';
        form.reset();
        form.elements.id.value = '';
        form.elements.points.value = '1';
        form.elements.sort_order.value = '0';
        if (keepQuiz) form.elements.quiz_id.value = quizId;
        document.getElementById('question-form-title').textContent = 'Soal';
        document.getElementById('question-submit').textContent = 'Tambah';
        document.getElementById('question-cancel').style.display = 'none';
      };
      const loadSections = async materialId => {
        adminState.selectedMaterialId = materialId || null;
        adminState.sections = materialId ? await GezyLMS.api('/api/admin/materials/' + materialId + '/sections') : [];
        renderAdminData();
      };
      const loadQuestions = async quizId => {
        adminState.selectedQuizId = quizId || null;
        adminState.questions = quizId ? await GezyLMS.api('/api/admin/quizzes/' + quizId + '/questions') : [];
        renderAdminData();
      };
      const editCategory = id => {
        const category = adminState.categories.find(c => c.id === id);
        if (!category) return;
        const form = document.getElementById('category-form');
        form.elements.id.value = category.id;
        form.elements.name.value = category.name || '';
        form.elements.slug.value = category.slug || '';
        form.elements.description.value = category.description || '';
        form.elements.sort_order.value = category.sort_order || 0;
        document.getElementById('category-form-title').textContent = 'Edit Kategori';
        document.getElementById('category-submit').textContent = 'Simpan';
        document.getElementById('category-cancel').style.display = 'inline-block';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      const deleteCategory = async id => {
        const category = adminState.categories.find(c => c.id === id);
        if (!category) return;
        if (!confirm('Hapus kategori "' + category.name + '"? Materi terkait akan menjadi tanpa kategori.')) return;
        try {
          await GezyLMS.api('/api/admin/categories/' + id, { method: 'DELETE' });
          resetCategoryForm();
          await loadAdmin();
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      };
      const editMaterial = async id => {
        const material = adminState.materials.find(m => m.id === id);
        if (!material) return;
        const form = document.getElementById('material-form');
        form.elements.id.value = material.id;
        form.elements.category_id.value = material.category_id || '';
        form.elements.title.value = material.title || '';
        form.elements.slug.value = material.slug || '';
        form.elements.summary.value = material.summary || '';
        form.elements.sort_order.value = material.sort_order || 0;
        form.elements.status.value = material.status || 'draft';
        document.getElementById('material-form-title').textContent = 'Edit Materi';
        document.getElementById('material-submit').textContent = 'Simpan';
        document.getElementById('material-cancel').style.display = 'inline-block';
        document.querySelector('#section-form [name=material_id]').value = material.id;
        resetSectionForm(true);
        await loadSections(material.id);
        if (adminState.sections.length === 1) editSection(adminState.sections[0].id);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      const editSection = id => {
        const section = adminState.sections.find(s => s.id === id);
        if (!section) return;
        const form = document.getElementById('section-form');
        form.elements.id.value = section.id;
        form.elements.material_id.value = section.material_id || adminState.selectedMaterialId || '';
        form.elements.title.value = section.title || '';
        form.elements.slug.value = section.slug || '';
        form.elements.sort_order.value = section.sort_order || 0;
        form.elements.status.value = section.status || 'draft';
        form.elements.content_markdown.value = section.content_markdown || '';
        document.getElementById('section-form-title').textContent = 'Edit Submateri';
        document.getElementById('section-submit').textContent = 'Simpan';
        document.getElementById('section-cancel').style.display = 'inline-block';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      const deleteSection = async id => {
        const section = adminState.sections.find(s => s.id === id);
        if (!section) return;
        if (!confirm('Hapus submateri "' + section.title + '"?')) return;
        try {
          await GezyLMS.api('/api/admin/sections/' + id, { method: 'DELETE' });
          resetSectionForm(true);
          await loadSections(adminState.selectedMaterialId);
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      };
      const deleteMaterial = async id => {
        const material = adminState.materials.find(m => m.id === id);
        if (!material) return;
        if (!confirm('Hapus materi "' + material.title + '"? Submateri terkait juga akan terhapus.')) return;
        try {
          await GezyLMS.api('/api/admin/materials/' + id, { method: 'DELETE' });
          await loadAdmin();
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      };
      const editQuiz = async id => {
        const quiz = adminState.quizzes.find(q => q.id === id);
        if (!quiz) return;
        const form = document.getElementById('quiz-form');
        form.elements.id.value = quiz.id;
        form.elements.material_id.value = quiz.material_id || '';
        await loadQuizSections(quiz.material_id || '', quiz.section_id || '');
        form.elements.title.value = quiz.title || '';
        form.elements.description.value = quiz.description || '';
        form.elements.deadline_at.value = quiz.deadline_at || '';
        form.elements.answers_released_at.value = quiz.answers_released_at || '';
        form.elements.status.value = quiz.status || 'draft';
        document.getElementById('quiz-form-title').textContent = 'Edit Quiz';
        document.getElementById('quiz-submit').textContent = 'Simpan';
        document.getElementById('quiz-cancel').style.display = 'inline-block';
        document.querySelector('#question-form [name=quiz_id]').value = quiz.id;
        resetQuestionForm(true);
        await loadQuestions(quiz.id);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      const deleteQuiz = async id => {
        const quiz = adminState.quizzes.find(q => q.id === id);
        if (!quiz) return;
        if (!confirm('Hapus quiz "' + quiz.title + '"? Semua soal dan attempt terkait akan terhapus.')) return;
        try {
          await GezyLMS.api('/api/admin/quizzes/' + id, { method: 'DELETE' });
          resetQuizForm();
          resetQuestionForm(false);
          adminState.selectedQuizId = null;
          adminState.questions = [];
          await loadAdmin();
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      };
      const editQuestion = id => {
        const question = adminState.questions.find(q => q.id === id);
        if (!question) return;
        const form = document.getElementById('question-form');
        form.elements.id.value = question.id;
        form.elements.quiz_id.value = question.quiz_id || adminState.selectedQuizId || '';
        form.elements.question_type.value = question.question_type || 'multiple_choice';
        form.elements.question_text.value = question.question_text || '';
        form.elements.options.value = JSON.stringify(question.options || []);
        form.elements.correct_answer.value = JSON.stringify(question.correct_answer || []);
        form.elements.points.value = question.points || 1;
        form.elements.sort_order.value = question.sort_order || 0;
        form.elements.explanation.value = question.explanation || '';
        document.getElementById('question-form-title').textContent = 'Edit Soal';
        document.getElementById('question-submit').textContent = 'Simpan';
        document.getElementById('question-cancel').style.display = 'inline-block';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      const deleteQuestion = async id => {
        const question = adminState.questions.find(q => q.id === id);
        if (!question) return;
        if (!confirm('Hapus soal ini?')) return;
        try {
          await GezyLMS.api('/api/admin/questions/' + id, { method: 'DELETE' });
          resetQuestionForm(true);
          await loadQuestions(adminState.selectedQuizId);
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      };
      const renderAdminData = () => {
        const selectedMaterial = adminState.materials.find(m => m.id === adminState.selectedMaterialId);
        const selectedQuiz = adminState.quizzes.find(q => q.id === adminState.selectedQuizId);
        document.getElementById('admin-data').innerHTML =
          '<p><strong>Kategori:</strong> ' + adminState.categories.length + '</p><p><strong>Materi:</strong> ' + adminState.materials.length + '</p><p><strong>Quiz:</strong> ' + adminState.quizzes.length + '</p>' +
          '<h4 class="section-title">Kategori</h4>' +
          (adminState.categories.length ? adminState.categories.map(c => '<div class="mini-row admin-row"><div><strong>' + GezyLMS.escapeHtml(c.name) + '</strong><div class="muted">' + GezyLMS.escapeHtml(c.slug) + ' / urutan ' + GezyLMS.escapeHtml(c.sort_order ?? 0) + '</div></div><div class="row-actions"><button class="btn btn-secondary btn-small" type="button" data-edit-category="' + c.id + '">Edit</button><button class="btn btn-danger btn-small" type="button" data-delete-category="' + c.id + '">Hapus</button></div></div>').join('') : '<div class="notice">Belum ada kategori.</div>') +
          '<h4 class="section-title">Materi</h4>' +
          (adminState.materials.length ? adminState.materials.map(m => '<div class="mini-row admin-row"><div><strong>' + GezyLMS.escapeHtml(m.title) + '</strong><div class="muted">' + GezyLMS.escapeHtml(m.category_name || 'Tanpa kategori') + ' / ' + GezyLMS.escapeHtml(m.slug) + '</div></div><div class="row-actions"><span class="badge">' + GezyLMS.escapeHtml(m.status) + '</span><button class="btn btn-secondary btn-small" type="button" data-edit-material="' + m.id + '">Edit</button><button class="btn btn-danger btn-small" type="button" data-delete-material="' + m.id + '">Hapus</button></div></div>').join('') : '<div class="notice">Belum ada materi.</div>') +
          '<h4 class="section-title">Submateri' + (selectedMaterial ? ' - ' + GezyLMS.escapeHtml(selectedMaterial.title) : '') + '</h4>' +
          (selectedMaterial
            ? (adminState.sections.length ? adminState.sections.map(s => '<div class="mini-row admin-row"><div><strong>' + GezyLMS.escapeHtml(s.title) + '</strong><div class="muted">' + GezyLMS.escapeHtml(s.slug) + ' / urutan ' + GezyLMS.escapeHtml(s.sort_order ?? 0) + '</div></div><div class="row-actions"><span class="badge">' + GezyLMS.escapeHtml(s.status) + '</span><button class="btn btn-secondary btn-small" type="button" data-edit-section="' + s.id + '">Edit</button><button class="btn btn-danger btn-small" type="button" data-delete-section="' + s.id + '">Hapus</button></div></div>').join('') : '<div class="notice">Materi ini belum punya submateri.</div>')
            : '<div class="notice">Klik Edit pada salah satu materi untuk melihat dan mengedit submaterinya.</div>') +
          '<h4 class="section-title">Quiz</h4>' +
          (adminState.quizzes.length ? adminState.quizzes.map(q => '<div class="mini-row admin-row"><div><strong>' + GezyLMS.escapeHtml(q.title) + '</strong><div class="muted">' + GezyLMS.escapeHtml(labelById(adminState.materials, q.material_id, 'Tanpa materi')) + ' / ' + GezyLMS.escapeHtml(labelById(adminState.sections, q.section_id, 'Tanpa submateri')) + '</div></div><div class="row-actions"><span class="badge">' + GezyLMS.escapeHtml(q.status) + '</span><button class="btn btn-secondary btn-small" type="button" data-edit-quiz="' + q.id + '">Edit</button><button class="btn btn-danger btn-small" type="button" data-delete-quiz="' + q.id + '">Hapus</button></div></div>').join('') : '<div class="notice">Belum ada quiz.</div>') +
          '<h4 class="section-title">Soal' + (selectedQuiz ? ' - ' + GezyLMS.escapeHtml(selectedQuiz.title) : '') + '</h4>' +
          (selectedQuiz
            ? (adminState.questions.length ? adminState.questions.map((q, idx) => '<div class="mini-row admin-row"><div><strong>Soal ' + (idx + 1) + '</strong><div class="muted">' + GezyLMS.escapeHtml(q.question_type) + ' / poin ' + GezyLMS.escapeHtml(q.points ?? 1) + ' / urutan ' + GezyLMS.escapeHtml(q.sort_order ?? 0) + '</div><div class="muted">' + GezyLMS.escapeHtml((q.question_text || '').slice(0, 120)) + '</div></div><div class="row-actions"><button class="btn btn-secondary btn-small" type="button" data-edit-question="' + q.id + '">Edit</button><button class="btn btn-danger btn-small" type="button" data-delete-question="' + q.id + '">Hapus</button></div></div>').join('') : '<div class="notice">Quiz ini belum punya soal.</div>')
            : '<div class="notice">Klik Edit pada salah satu quiz untuk melihat dan mengedit soalnya.</div>');
        document.querySelectorAll('[data-edit-category]').forEach(btn => btn.addEventListener('click', () => editCategory(Number(btn.dataset.editCategory))));
        document.querySelectorAll('[data-delete-category]').forEach(btn => btn.addEventListener('click', () => deleteCategory(Number(btn.dataset.deleteCategory))));
        document.querySelectorAll('[data-edit-material]').forEach(btn => btn.addEventListener('click', () => editMaterial(Number(btn.dataset.editMaterial))));
        document.querySelectorAll('[data-delete-material]').forEach(btn => btn.addEventListener('click', () => deleteMaterial(Number(btn.dataset.deleteMaterial))));
        document.querySelectorAll('[data-edit-section]').forEach(btn => btn.addEventListener('click', () => editSection(Number(btn.dataset.editSection))));
        document.querySelectorAll('[data-delete-section]').forEach(btn => btn.addEventListener('click', () => deleteSection(Number(btn.dataset.deleteSection))));
        document.querySelectorAll('[data-edit-quiz]').forEach(btn => btn.addEventListener('click', () => editQuiz(Number(btn.dataset.editQuiz))));
        document.querySelectorAll('[data-delete-quiz]').forEach(btn => btn.addEventListener('click', () => deleteQuiz(Number(btn.dataset.deleteQuiz))));
        document.querySelectorAll('[data-edit-question]').forEach(btn => btn.addEventListener('click', () => editQuestion(Number(btn.dataset.editQuestion))));
        document.querySelectorAll('[data-delete-question]').forEach(btn => btn.addEventListener('click', () => deleteQuestion(Number(btn.dataset.deleteQuestion))));
      };
      async function loadAdmin() {
        try {
          const [categories, materials, quizzes] = await Promise.all([
            GezyLMS.api('/api/admin/categories'),
            GezyLMS.api('/api/admin/materials'),
            GezyLMS.api('/api/admin/quizzes')
          ]);
          adminState = { ...adminState, categories, materials, quizzes };
          fill(document.querySelector('#material-form [name=category_id]'), categories, r => r.name);
          fill(document.querySelector('#section-form [name=material_id]'), materials, r => r.title);
          fill(document.querySelector('#quiz-form [name=material_id]'), materials, r => r.title);
          fill(document.querySelector('#question-form [name=quiz_id]'), quizzes, r => r.title);
          document.querySelector('#quiz-form [name=section_id]').innerHTML = '<option value="">- opsional -</option>';
          if (adminState.selectedMaterialId) {
            adminState.sections = await GezyLMS.api('/api/admin/materials/' + adminState.selectedMaterialId + '/sections');
          }
          if (adminState.selectedQuizId) {
            adminState.questions = await GezyLMS.api('/api/admin/quizzes/' + adminState.selectedQuizId + '/questions');
          }
          renderAdminData();
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
      document.getElementById('category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const editing = !!data.id;
        try {
          await GezyLMS.api(editing ? '/api/admin/categories/' + data.id : '/api/admin/categories', {
            method: editing ? 'PUT' : 'POST',
            body: JSON.stringify(categoryPayload(data))
          });
          resetCategoryForm();
          await loadAdmin();
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      });
      document.getElementById('category-cancel').addEventListener('click', resetCategoryForm);
      document.getElementById('material-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const editing = !!data.id;
        try {
          await GezyLMS.api(editing ? '/api/admin/materials/' + data.id : '/api/admin/materials', {
            method: editing ? 'PUT' : 'POST',
            body: JSON.stringify(materialPayload(data))
          });
          resetMaterialForm();
          await loadAdmin();
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      });
      document.getElementById('material-cancel').addEventListener('click', resetMaterialForm);
      document.querySelector('#section-form [name=material_id]').addEventListener('change', async (e) => {
        resetSectionForm(true);
        await loadSections(Number(e.target.value) || null);
      });
      document.getElementById('section-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const editing = !!data.id;
        try {
          await GezyLMS.api(editing ? '/api/admin/sections/' + data.id : '/api/admin/sections', {
            method: editing ? 'PUT' : 'POST',
            body: JSON.stringify(sectionPayload(data))
          });
          adminState.selectedMaterialId = Number(data.material_id);
          resetSectionForm(true);
          await loadAdmin();
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      });
      document.getElementById('section-cancel').addEventListener('click', () => resetSectionForm(true));
      document.querySelector('#quiz-form [name=material_id]').addEventListener('change', async (e) => {
        await loadQuizSections(Number(e.target.value) || null);
      });
      document.getElementById('quiz-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const editing = !!data.id;
        try {
          await GezyLMS.api(editing ? '/api/admin/quizzes/' + data.id : '/api/admin/quizzes', {
            method: editing ? 'PUT' : 'POST',
            body: JSON.stringify(quizPayload(data))
          });
          resetQuizForm();
          await loadAdmin();
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      });
      document.getElementById('quiz-cancel').addEventListener('click', resetQuizForm);
      document.querySelector('#question-form [name=quiz_id]').addEventListener('change', async (e) => {
        resetQuestionForm(true);
        await loadQuestions(Number(e.target.value) || null);
      });
      document.getElementById('question-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const editing = !!data.id;
        try {
          await GezyLMS.api(editing ? '/api/admin/questions/' + data.id : '/api/admin/questions', {
            method: editing ? 'PUT' : 'POST',
            body: JSON.stringify(questionPayload(data))
          });
          adminState.selectedQuizId = Number(data.quiz_id);
          resetQuestionForm(true);
          await loadAdmin();
        } catch (err) {
          GezyLMS.showError('#admin-error', err);
        }
      });
      document.getElementById('question-cancel').addEventListener('click', () => resetQuestionForm(true));
      loadAdmin();
    </script>`, !!cookie?.gezylms_token?.value))

  .listen(PORT);

console.log(`GezyLMS running at http://localhost:${PORT}`);
