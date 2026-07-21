# GezyLMS — Product Requirements Document

> **Version:** 1.0 | **Status:** Draft | **Date:** 2026-07-21
> **Owner:** Gunanto (PakGun)

---

## 1. Product Overview

### 1.1 Purpose
GezyLMS is a lightweight, public-facing Learning Management System (LMS) designed for SMP Negeri 1 Punggur students and the general public. It enables:
- Structured learning materials with Markdown + LaTeX support for mathematical content.
- Interactive quizzes (multiple choice, true/false, multi-response) with persistent score storage.
- Progress tracking across materials and quizzes per registered student.

### 1.2 Target Audience
| Role | Description |
|---|---|
| **Student** | Public users who register to access materials, take quizzes, and track progress |
| **Admin (Teacher)** | PakGun and authorized teachers who create and manage content |

### 1.3 Core Value Proposition
- Free, self-hosted alternative to commercial LMS platforms.
- Lightweight enough to run on a 2 GB RAM single-core VPS.
- Full LaTeX support for mathematical content — essential for math teachers.
- Progress persists across sessions — students never lose their work.

---

## 2. Functional Requirements

### FR-1: Authentication & User Management

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | User registration with username, password, full name | P0 |
| FR-1.2 | Login with username + password | P0 |
| FR-1.3 | Logout (clears token/session) | P0 |
| FR-1.4 | Role assignment: `student` (default) or `admin` (granted manually) | P0 |
| FR-1.5 | Password hashing with bcrypt or Bun's built-in | P0 |
| FR-1.6 | Session persistence via JWT (stateless, cookie-based) | P0 |

### FR-2: Category & Material Management

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Admin creates categories with name, slug, description, sort order | P0 |
| FR-2.2 | Admin creates materials under a category (title, slug, summary, status: draft/published) | P0 |
| FR-2.3 | Admin creates sections under a material (title, slug, Markdown + LaTeX content) | P0 |
| FR-2.4 | Admin can publish/unpublish categories, materials, and sections | P0 |
| FR-2.5 | Admin can edit and delete categories, materials, and sections | P1 |
| FR-2.6 | Students see only published content | P0 |
| FR-2.7 | Sections display rendered Markdown (sanitized HTML) + KaTeX-rendered LaTeX | P0 |
| FR-2.8 | LaTeX syntax: `\( ... \)` for inline, `\[ ... \]` for display | P0 |

### FR-3: Quiz & Question Management

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | Admin creates quizzes with title, description, optional material/section link | P0 |
| FR-3.2 | Quiz has `answers_released_at` — students see score immediately, but correct answers only after this time | P0 |
| FR-3.3 | Admin creates questions: multiple choice, true/false, multi-response | P0 |
| FR-3.4 | Each question has: type, text (supports LaTeX), options (JSON array, supports LaTeX), correct answer, points, optional explanation (supports LaTeX) | P0 |
| FR-3.5 | Multi-response questions award partial points proportional to correct selections | P1 |
| FR-3.6 | Admin can edit, reorder, and delete questions | P1 |

### FR-4: Quiz Taking & Scoring

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Student navigates from quiz list → quiz detail → start attempt | P0 |
| FR-4.2 | Questions display sequentially (one per page) or all at once (admin-configurable, MVP: all at once) | P2 |
| FR-4.3 | Student submits answers → system calculates score immediately | P0 |
| FR-4.4 | Result page shows: total score, per-question result (correct/incorrect), and explanation only if `answers_released_at` has passed | P0 |
| FR-4.5 | Student can retake a quiz unlimited times; each attempt is saved separately | P1 |
| FR-4.6 | Quiz timer is NOT required for MVP (no enforced time limit) | P3 |

### FR-5: Progress & History

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Reading a section marks it as `in_progress` for that student | P1 |
| FR-5.2 | Student can manually mark a section as `completed` | P1 |
| FR-5.3 | History page shows all completed sections and all quiz attempts with scores | P0 |
| FR-5.4 | Admin can view history per student (list view) | P1 |

### FR-6: Admin Panel

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Simple dashboard with list of categories, materials, quizzes | P1 |
| FR-6.2 | Form-based create/edit for each resource (no rich text — Markdown textarea) | P0 |
| FR-6.3 | Publish/unpublish toggle per resource | P1 |
| FR-6.4 | Admin can view student list and per-student history | P2 |

---

## 3. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | **Performance** — page load time | < 1s for content pages, < 2s for quiz results |
| NFR-2 | **RAM usage** — additional process memory | < 100 MB total (Bun + SQLite) |
| NFR-3 | **Disk usage** — initial code + database | < 50 MB code, database grows ~1 KB per attempt |
| NFR-4 | **Concurrency** — simultaneous quiz submissions | Handle 30 concurrent students without 503 errors |
| NFR-5 | **Security** — input sanitization | All Markdown output sanitized; no raw HTML injection |
| NFR-6 | **Security** — auth | Passwords bcrypt-hashed; JWT with 7-day expiry |
| NFR-7 | **Backup** — database backup | Daily file copy via cron at 02:00 UTC |
| NFR-8 | **Availability** | 24/7 via PM2 auto-restart |

---

## 4. Technical Architecture

### 4.1 Stack

```
Runtime:   Bun 1.3.14
Framework: Elysia (TypeScript)
Database:  SQLite via bun:sqlite (file: gezylms.db)
Auth:      JWT via @elysiajs/jwt + HttpOnly cookies
LaTeX:     KaTeX (local static assets, not CDN)
Proxy:     Nginx reverse proxy → localhost:3001
Process:   PM2 (name: gezylms, interpreter: bun)
```

### 4.2 Port Allocation

| App | Port | Process Name |
|---|---|---|
| Gezy (existing) | 3000 | gezytech |
| Gezy Platform (existing) | internal | platform-app |
| Gezy Public (existing) | internal | public-app |
| **GezyLMS** | **3001** | **gezylms** |

### 4.3 Database Schema

8 tables:
- `users` — authentication and role
- `categories` — topic grouping
- `materials` — learning units under categories
- `material_sections` — individual content pages under materials
- `section_progress` — per-student per-section reading progress
- `quizzes` — quiz metadata with release time
- `questions` — quiz questions with type, options, answer
- `attempts` — per-student quiz submissions with answers and scores

### 4.4 Route Structure

```
Public pages:
  GET  /                     Landing page
  GET  /login                Login form
  GET  /register             Registration form
  GET  /materi               Material list by category
  GET  /materi/:slug         Material detail + section list
  GET  /materi/:slug/:section Content page (Markdown + LaTeX)
  GET  /quiz                 Quiz list
  GET  /quiz/:id             Quiz detail + start attempt
  GET  /quiz/:id/result/:att Result after submission
  GET  /history              Student's learning history

API:
  POST /api/auth/login
  POST /api/auth/register
  GET  /api/auth/logout
  GET  /api/categories
  GET  /api/materials
  GET  /api/materials/:slug
  GET  /api/materials/:slug/:section
  POST /api/sections/:id/progress
  POST /api/sections/:id/complete
  GET  /api/quizzes
  GET  /api/quizzes/:id
  POST /api/quizzes/:id/submit
  GET  /api/quizzes/:id/results/:attemptId
  GET  /api/history

Admin API:
  POST/GET/PUT/DELETE /api/admin/categories
  POST/GET/PUT/DELETE /api/admin/materials
  POST/GET/PUT/DELETE /api/admin/sections
  POST/GET/PUT/DELETE /api/admin/quizzes
  POST/GET/PUT/DELETE /api/admin/questions
  GET  /api/admin/students/:id/history
```

### 4.5 Frontend Approach

- **Server-rendered HTML** via Elysia HTML plugin (template literals)
- **No SPA framework** — page navigation via full page loads
- **Minimal vanilla JS** for form validation and quiz submission UX
- **Single CSS file** — responsive, mobile-friendly
- **KaTeX** served locally from `/public/vendor/katex/`

---

## 5. User Stories

### US-1: Student Registration (P0)
> *As a new visitor, I want to create an account so I can save my progress.*

**Acceptance Criteria:**
- Registration form: username (unique), password (min 6 chars), full name
- Successful registration redirects to login
- Duplicate username shows error without leaking whether username exists
- Password stored as bcrypt hash only

### US-2: Student Login (P0)
> *As a registered student, I want to log in so I can access learning materials and quizzes.*

**Acceptance Criteria:**
- Form: username + password
- JWT token set as HttpOnly cookie on success
- Redirect to dashboard on success
- Error message on wrong credentials (generic: "Invalid username or password")

### US-3: Browse Materials (P0)
> *As a student, I want to browse materials by category so I can find relevant content.*

**Acceptance Criteria:**
- `/materi` shows published categories and their published materials
- Clicking a material shows its published sections
- Sections show rendered Markdown + LaTeX
- Only published content is visible

### US-4: Read Section & Track Progress (P1)
> *As a student, I want to mark sections as complete so I can track what I've learned.*

**Acceptance Criteria:**
- Opening a section sets progress to `in_progress`
- "Mark as complete" button at the bottom of each section
- History page shows completed sections with dates

### US-5: Take a Quiz (P0)
> *As a student, I want to answer quiz questions and see my score immediately.*

**Acceptance Criteria:**
- Quiz page shows all questions with their options
- Multiple choice: radio buttons
- True/false: two radio buttons (Benar/Salah)
- Multi-response: checkboxes
- Submit button at the bottom
- Score calculated and displayed immediately after submit
- Correct answers hidden until `answers_released_at`

### US-6: View Quiz Results (P0)
> *As a student, I want to review my quiz attempt so I can learn from mistakes.*

**Acceptance Criteria:**
- Result page shows: score (e.g., "7/10"), per-question correctness
- If `answers_released_at` has passed: show correct answer + explanation (rendered LaTeX)
- If not yet released: show "Kunci jawaban akan tersedia pada [date]"
- Each attempt is listed separately in history

### US-7: View History (P0)
> *As a student, I want to see my learning history so I can track overall progress.*

**Acceptance Criteria:**
- Tab/view for completed sections with dates
- Tab/view for quiz attempts with scores and dates
- Sorted newest first

### US-8: Admin Create Material (P0)
> *As an admin, I want to create materials with sections so students can learn.*

**Acceptance Criteria:**
- Admin panel: create category → create material under category → add sections
- Section content written in Markdown textarea
- Markdown renders correctly on student view
- LaTeX inline (`\(...\)`) and display (`\[...\]`) render correctly

### US-9: Admin Create Quiz (P0)
> *As an admin, I want to create quizzes with questions so students can test knowledge.*

**Acceptance Criteria:**
- Create quiz: title, description, answers_released_at
- Add questions: type selector, question text (Markdown + LaTeX), options, correct answer, points, explanation
- Multiple choice: select one correct option
- True/false: Benar or Salah
- Multi-response: select multiple correct options

### US-10: Admin View Student History (P2)
> *As an admin, I want to see a student's progress so I can monitor learning.*

**Acceptance Criteria:**
- Search or select a student
- Show completed sections and quiz attempts
- CSV export of quiz scores (P3, future)

---

## 6. Security Requirements

| ID | Requirement |
|---|---|
| SEC-1 | All passwords hashed with bcrypt (cost factor 12) |
| SEC-2 | JWTs signed with HS256, 7-day expiry, stored in HttpOnly + SameSite=Lax cookies |
| SEC-3 | All Markdown content sanitized (no raw HTML injection) |
| SEC-4 | SQL injection prevented by using parameterized queries (bun:sqlite built-in) |
| SEC-5 | Admin routes protected by role middleware |
| SEC-6 | API routes that read/write user data require authentication |
| SEC-7 | Public read-only routes (materials, quiz list) do NOT require auth |
| SEC-8 | Registration rate-limited (max 3 per IP per hour) |
| SEC-9 | Login rate-limited (max 10 per IP per minute) |

---

## 7. MVP Scope Boundaries

### IN Scope (Phase 1)
- ✅ Auth (register, login, logout)
- ✅ Category → Material → Section hierarchy
- ✅ Markdown + LaTeX content
- ✅ Quiz CRUD and taking
- ✅ Immediate scoring
- ✅ Delayed answer release
- ✅ Progress tracking per student
- ✅ History page
- ✅ Simple admin panel (forms, lists)
- ✅ Deployment on PM2 + Nginx

### OUT of Scope (Future Phases)
- ❌ Rich text editor for admin
- ❌ Drag-and-drop question reordering
- ❌ Quiz timer
- ❌ Student-submitted content
- ❌ Discussion/comments
- ❌ Video/audio content
- ❌ Advanced analytics dashboard
- ❌ Multi-language support
- ❌ Social login (Google, etc.)
- ❌ Email notifications
- ❌ CSV export

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Students registered in first month | 30 (SMPN 1 Punggur students) |
| Materials created in first week | 3-5 |
| Quizzes created in first week | 2-3 |
| Server uptime | > 99.5% |
| Average page load | < 1 second |
| Server crash incidents | 0 |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SQLite write contention under load | Low | Medium | Limit to 30 users; WAL mode enabled |
| LaTeX rendering issues with complex formulas | Medium | Low | Test with actual math content before launch; fallback to raw LaTeX text |
| Nginx misconfiguration | Low | High | Test proxy before going live; use existing Gezy nginx as template |
| Bun compatibility issues | Very Low | Medium | Pin Bun version; test on same server before deploy |
| Disk fills from database | Very Low | Low | SQLite is negligible; monitor disk weekly |

---

## 10. Timeline

| Phase | Hours | Deliverable |
|---|---|---|
| **1. Setup & Auth** | 1-2h | Project structure, SQLite schema, register/login/logout with JWT |
| **2. Material Module** | 2-3h | CRUD categories/materials/sections, public browse pages, Markdown + KaTeX |
| **3. Quiz Engine** | 2-3h | CRUD quizzes/questions, quiz taking, scoring, results with delayed answers |
| **4. History & Progress** | 1-2h | Section progress tracking, history page for students |
| **5. Admin Panel** | 1-2h | Admin routes for all CRUD, publish/unpublish, student history view |
| **6. Deploy & Polish** | 1h | PM2 config, Nginx proxy, CSS polish, backup cron, smoke test |
| **Total** | **8-13h** | |

---

## 11. Appendix

### 11.1 Key Decisions
| Decision | Rationale |
|---|---|
| JWT over session cookies | Simpler — no session store, stateless, Elysia has `@elysiajs/jwt` |
| KaTeX over MathJax | Faster render, smaller bundle (~300 KB vs 2+ MB), adequate for school math |
| No SPA framework | Server-rendered HTML is simpler, faster to develop, works without JS |
| No ORM | `bun:sqlite` is fast and simple; SQL is readable and explicit |

### 11.2 Environment Variables
```
PORT=3001
JWT_SECRET=<random-64-char>
DATABASE_PATH=./gezylms.db
PUBLIC_URL=https://lms.gezytech.web.id
```

### 11.3 Backup Cron
```bash
0 2 * * * cp /home/pgun/gezylms/gezylms.db /home/pgun/gezylms/backups/gezylms-$(date +\%Y\%m\%d).db
```

### 11.4 References
- [Elysia Documentation](https://elysiajs.com/)
- [Bun SQLite Guide](https://bun.sh/docs/api/sqlite)
- [KaTeX Documentation](https://katex.org/docs/api.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
