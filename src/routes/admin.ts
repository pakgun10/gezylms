import { Elysia, t } from "elysia";
import { jwtPlugin, requireAdminUser } from "../auth";
import db from "../db";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(jwtPlugin)

  // ── Categories ──
  .post(
    "/categories",
    async (ctx: any) => {
      const admin = await requireAdminUser(ctx);
      if (!("userId" in admin)) return admin;
      const { body } = ctx;
      db.query(
        "INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)"
      ).run(body.name, body.slug, body.description || "", body.sort_order || 0);
      return { success: true };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        slug: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        sort_order: t.Optional(t.Number()),
      }),
    }
  )
  .get("/categories", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    return db.query("SELECT * FROM categories ORDER BY sort_order").all();
  })
  .put(
    "/categories/:id",
    async (ctx: any) => {
      const admin = await requireAdminUser(ctx);
      if (!("userId" in admin)) return admin;
      const { params, body } = ctx;
      db.query(
        "UPDATE categories SET name=?, slug=?, description=?, sort_order=? WHERE id=?"
      ).run(body.name, body.slug, body.description || "", body.sort_order || 0, params.id);
      return { success: true };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        slug: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        sort_order: t.Optional(t.Number()),
      }),
    }
  )
  .delete("/categories/:id", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    const { params } = ctx;
    db.query("DELETE FROM categories WHERE id=?").run(params.id);
    return { success: true };
  })

  // ── Materials ──
  .post(
    "/materials",
    async (ctx: any) => {
      const user = await requireAdminUser(ctx);
      if (!("userId" in user)) return user;
      const { body } = ctx;
      db.query(
        `INSERT INTO materials (category_id, title, slug, summary, status, sort_order, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(body.category_id, body.title, body.slug, body.summary || "", body.status || "draft", body.sort_order || 0, user?.userId);
      return { success: true };
    },
    {
      body: t.Object({
        category_id: t.Number(),
        title: t.String({ minLength: 1 }),
        slug: t.String({ minLength: 1 }),
        summary: t.Optional(t.String()),
        status: t.Optional(t.String()),
        sort_order: t.Optional(t.Number()),
      }),
    }
  )
  .get("/materials", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    return db.query(`
      SELECT m.*, c.name as category_name
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.sort_order
    `).all();
  })
  .put(
    "/materials/:id",
    async (ctx: any) => {
      const admin = await requireAdminUser(ctx);
      if (!("userId" in admin)) return admin;
      const { params, body } = ctx;
      db.query(
        `UPDATE materials SET category_id=?, title=?, slug=?, summary=?, status=?, sort_order=?, updated_at=datetime('now')
         WHERE id=?`
      ).run(body.category_id, body.title, body.slug, body.summary || "", body.status || "draft", body.sort_order || 0, params.id);
      return { success: true };
    },
    {
      body: t.Object({
        category_id: t.Number(),
        title: t.String({ minLength: 1 }),
        slug: t.String({ minLength: 1 }),
        summary: t.Optional(t.String()),
        status: t.Optional(t.String()),
        sort_order: t.Optional(t.Number()),
      }),
    }
  )
  .delete("/materials/:id", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    const { params } = ctx;
    db.query("DELETE FROM materials WHERE id=?").run(params.id);
    return { success: true };
  })

  // ── Sections ──
  .post(
    "/sections",
    async (ctx: any) => {
      const admin = await requireAdminUser(ctx);
      if (!("userId" in admin)) return admin;
      const { body } = ctx;
      db.query(
        `INSERT INTO material_sections (material_id, title, slug, content_markdown, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(body.material_id, body.title, body.slug, body.content_markdown || "", body.status || "draft", body.sort_order || 0);
      return { success: true };
    },
    {
      body: t.Object({
        material_id: t.Number(),
        title: t.String({ minLength: 1 }),
        slug: t.String({ minLength: 1 }),
        content_markdown: t.Optional(t.String()),
        status: t.Optional(t.String()),
        sort_order: t.Optional(t.Number()),
      }),
    }
  )
  .get("/materials/:materialId/sections", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    const { params } = ctx;
    return db.query(
      "SELECT * FROM material_sections WHERE material_id=? ORDER BY sort_order"
    ).all(params.materialId);
  })
  .put(
    "/sections/:id",
    async (ctx: any) => {
      const admin = await requireAdminUser(ctx);
      if (!("userId" in admin)) return admin;
      const { params, body } = ctx;
      db.query(
        `UPDATE material_sections SET title=?, slug=?, content_markdown=?, status=?, sort_order=?, updated_at=datetime('now')
         WHERE id=?`
      ).run(body.title, body.slug, body.content_markdown || "", body.status || "draft", body.sort_order || 0, params.id);
      return { success: true };
    },
    {
      body: t.Object({
        material_id: t.Number(),
        title: t.String({ minLength: 1 }),
        slug: t.String({ minLength: 1 }),
        content_markdown: t.Optional(t.String()),
        status: t.Optional(t.String()),
        sort_order: t.Optional(t.Number()),
      }),
    }
  )
  .delete("/sections/:id", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    const { params } = ctx;
    db.query("DELETE FROM material_sections WHERE id=?").run(params.id);
    return { success: true };
  })

  // ── Quizzes ──
  .post(
    "/quizzes",
    async (ctx: any) => {
      const user = await requireAdminUser(ctx);
      if (!("userId" in user)) return user;
      const { body } = ctx;
      db.query(
        `INSERT INTO quizzes (material_id, section_id, title, description, status, deadline_at, answers_released_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        body.material_id || null, body.section_id || null, body.title, body.description || "",
        body.status || "draft", body.deadline_at || null, body.answers_released_at || null, user?.userId
      );
      return { success: true };
    },
    {
      body: t.Object({
        material_id: t.Optional(t.Number()),
        section_id: t.Optional(t.Number()),
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        status: t.Optional(t.String()),
        deadline_at: t.Optional(t.String()),
        answers_released_at: t.Optional(t.String()),
      }),
    }
  )
  .get("/quizzes", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    return db.query("SELECT * FROM quizzes ORDER BY created_at DESC").all();
  })
  .put(
    "/quizzes/:id",
    async (ctx: any) => {
      const admin = await requireAdminUser(ctx);
      if (!("userId" in admin)) return admin;
      const { params, body } = ctx;
      db.query(
        `UPDATE quizzes SET material_id=?, section_id=?, title=?, description=?, status=?,
         deadline_at=?, answers_released_at=?, updated_at=datetime('now') WHERE id=?`
      ).run(
        body.material_id || null, body.section_id || null, body.title, body.description || "",
        body.status || "draft", body.deadline_at || null, body.answers_released_at || null, params.id
      );
      return { success: true };
    },
    {
      body: t.Object({
        material_id: t.Optional(t.Number()),
        section_id: t.Optional(t.Number()),
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        status: t.Optional(t.String()),
        deadline_at: t.Optional(t.String()),
        answers_released_at: t.Optional(t.String()),
      }),
    }
  )
  .delete("/quizzes/:id", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    const { params } = ctx;
    db.query("DELETE FROM quizzes WHERE id=?").run(params.id);
    return { success: true };
  })

  // ── Questions ──
  .post(
    "/questions",
    async (ctx: any) => {
      const admin = await requireAdminUser(ctx);
      if (!("userId" in admin)) return admin;
      const { body } = ctx;
      db.query(
        `INSERT INTO questions (quiz_id, question_type, question_text, options, correct_answer, points, sort_order, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        body.quiz_id, body.question_type, body.question_text,
        JSON.stringify(body.options), JSON.stringify(body.correct_answer),
        body.points || 1, body.sort_order || 0, body.explanation || ""
      );
      return { success: true };
    },
    {
      body: t.Object({
        quiz_id: t.Number(),
        question_type: t.String(),
        question_text: t.String({ minLength: 1 }),
        options: t.Array(t.String()),
        correct_answer: t.Union([t.Array(t.Number()), t.String()]),
        points: t.Optional(t.Number()),
        sort_order: t.Optional(t.Number()),
        explanation: t.Optional(t.String()),
      }),
    }
  )
  .get("/quizzes/:quizId/questions", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    const { params } = ctx;
    const questions = db.query(
      "SELECT * FROM questions WHERE quiz_id=? ORDER BY sort_order"
    ).all(params.quizId) as any[];
    return questions.map(q => ({
      ...q,
      options: JSON.parse(q.options),
      correct_answer: JSON.parse(q.correct_answer),
    }));
  })
  .put(
    "/questions/:id",
    async (ctx: any) => {
      const admin = await requireAdminUser(ctx);
      if (!("userId" in admin)) return admin;
      const { params, body } = ctx;
      db.query(
        `UPDATE questions SET question_type=?, question_text=?, options=?, correct_answer=?,
         points=?, sort_order=?, explanation=? WHERE id=?`
      ).run(
        body.question_type, body.question_text,
        JSON.stringify(body.options), JSON.stringify(body.correct_answer),
        body.points || 1, body.sort_order || 0, body.explanation || "", params.id
      );
      return { success: true };
    },
    {
      body: t.Object({
        quiz_id: t.Number(),
        question_type: t.String(),
        question_text: t.String({ minLength: 1 }),
        options: t.Array(t.String()),
        correct_answer: t.Union([t.Array(t.Number()), t.String()]),
        points: t.Optional(t.Number()),
        sort_order: t.Optional(t.Number()),
        explanation: t.Optional(t.String()),
      }),
    }
  )
  .delete("/questions/:id", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    const { params } = ctx;
    db.query("DELETE FROM questions WHERE id=?").run(params.id);
    return { success: true };
  })

  // ── Student history (view) ──
  .get("/students", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    return db.query("SELECT id, username, full_name, role, created_at FROM users WHERE role='student' ORDER BY created_at DESC").all();
  })
  .get("/students/:id/history", async (ctx: any) => {
    const admin = await requireAdminUser(ctx);
    if (!("userId" in admin)) return admin;
    const { params } = ctx;
    const sections = db.query(`
      SELECT sp.*, ms.title as section_title, m.title as material_title, m.slug as material_slug
      FROM section_progress sp
      JOIN material_sections ms ON sp.section_id = ms.id
      JOIN materials m ON ms.material_id = m.id
      WHERE sp.user_id = ?
      ORDER BY sp.last_opened_at DESC
    `).all(params.id);

    const attempts = db.query(`
      SELECT a.*, q.title as quiz_title
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.user_id = ?
      ORDER BY a.completed_at DESC
    `).all(params.id);

    return { sections, attempts };
  });
