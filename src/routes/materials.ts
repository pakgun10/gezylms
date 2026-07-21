import { Elysia } from "elysia";
import { jwtPlugin, requireSessionUser } from "../auth";
import db from "../db";

export const materialRoutes = new Elysia({ prefix: "/api/materials" })

  // ── List categories with published materials ──
  .get("/categories", async () => {
    return db.query(`
      SELECT c.*, (
        SELECT json_group_array(json_object('id', m.id, 'title', m.title, 'slug', m.slug, 'summary', m.summary))
        FROM materials m
        WHERE m.category_id = c.id AND m.status = 'published'
        ORDER BY m.sort_order
      ) as materials_json
      FROM categories c
      ORDER BY c.sort_order
    `).all();
  })

  // ── Single material with published sections ──
  .get("/:slug", async ({ params, status }) => {
    const material = db.query(
      "SELECT id, title, slug, summary, category_id FROM materials WHERE slug=? AND status='published'"
    ).get(params.slug) as any;
    if (!material) return status(404, { error: "Material not found" });

    const sections = db.query(
      "SELECT id, title, slug, sort_order FROM material_sections WHERE material_id=? AND status='published' ORDER BY sort_order"
    ).all(material.id);

    return { ...material, sections };
  })

  // ── Section content (Markdown + LaTeX) ──
  .get("/:slug/:sectionSlug", async ({ params, status }) => {
    const material = db.query(
      "SELECT id, title FROM materials WHERE slug=? AND status='published'"
    ).get(params.slug) as any;
    if (!material) return status(404, { error: "Material not found" });

    const section = db.query(
      "SELECT id, title, slug, content_markdown, sort_order FROM material_sections WHERE material_id=? AND slug=? AND status='published'"
    ).get(material.id, params.sectionSlug) as any;
    if (!section) return status(404, { error: "Section not found" });

    // Get prev/next for navigation
    const allSections = db.query(
      "SELECT slug, title FROM material_sections WHERE material_id=? AND status='published' ORDER BY sort_order"
    ).all(material.id) as any[];

    const currentIdx = allSections.findIndex((s: any) => s.slug === params.sectionSlug);
    const prev = currentIdx > 0 ? allSections[currentIdx - 1] : null;
    const next = currentIdx < allSections.length - 1 ? allSections[currentIdx + 1] : null;

    return {
      material: { slug: params.slug, title: material.title },
      section,
      navigation: { prev, next },
    };
  })

  // ── Progress tracking (auth required) ──
  .group("", app =>
    app.use(jwtPlugin)
      .post("/:slug/:sectionSlug/complete", async (ctx: any) => {
        const user = await requireSessionUser(ctx);
        if (!("userId" in user)) return user;
        const { params } = ctx;
        const section = db.query(`
          SELECT ms.id FROM material_sections ms
          JOIN materials m ON ms.material_id = m.id
          WHERE m.slug=? AND ms.slug=?
        `).get(params.slug, params.sectionSlug) as any;
        if (!section) return { error: "Section not found" };

        db.query(`
          INSERT INTO section_progress (user_id, section_id, status, completed_at)
          VALUES (?, ?, 'completed', datetime('now'))
          ON CONFLICT(user_id, section_id) DO UPDATE SET status='completed', completed_at=datetime('now')
        `).run(user.userId, section.id);
        return { success: true };
      })

      .get("/history", async (ctx: any) => {
        const user = await requireSessionUser(ctx);
        if (!("userId" in user)) return user;
        const sections = db.query(`
          SELECT sp.*, ms.title as section_title, ms.slug as section_slug,
                 m.title as material_title, m.slug as material_slug
          FROM section_progress sp
          JOIN material_sections ms ON sp.section_id = ms.id
          JOIN materials m ON ms.material_id = m.id
          WHERE sp.user_id = ?
          ORDER BY sp.last_opened_at DESC
        `).all(user.userId);

        const attempts = db.query(`
          SELECT a.*, q.title as quiz_title
          FROM attempts a
          JOIN quizzes q ON a.quiz_id = q.id
          WHERE a.user_id = ?
          ORDER BY a.completed_at DESC
        `).all(user.userId);

        return { sections, attempts };
      })
  );
