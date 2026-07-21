import { Elysia, t } from "elysia";
import { getSessionUser, jwtPlugin, requireSessionUser } from "../auth";
import db from "../db";

export const quizRoutes = new Elysia({ prefix: "/api/quizzes" })
  .use(jwtPlugin)
  .onBeforeHandle(async (ctx: any) => {
    const user = await getSessionUser(ctx);
    if (!user) return ctx.status(401, { error: "Authentication required" });
  })

  // ── List published quizzes ──
  .get("/", async (ctx: any) => {
    const user = await requireSessionUser(ctx);
    if (!("userId" in user)) return user;
    return db.query(
      "SELECT id, title, description, material_id, section_id, deadline_at, answers_released_at, created_at FROM quizzes WHERE status='published' ORDER BY created_at DESC"
    ).all();
  })

  // ── Quiz detail (without correct answers) ──
  .get("/:id", async (ctx: any) => {
    const user = await requireSessionUser(ctx);
    if (!("userId" in user)) return user;
    const { params, status } = ctx;
    const quiz = db.query(
      "SELECT id, title, description, deadline_at, answers_released_at FROM quizzes WHERE id=? AND status='published'"
    ).get(params.id) as any;
    if (!quiz) return status(404, { error: "Quiz not found" });

    const questions = db.query(
      "SELECT id, question_type, question_text, options, points FROM questions WHERE quiz_id=? ORDER BY sort_order"
    ).all(params.id) as any[];

    return {
      ...quiz,
      questions: questions.map(q => ({ ...q, options: JSON.parse(q.options) })),
    };
  })

  // ── Submit answers ──
  .post(
    "/:id/submit",
    async (ctx: any) => {
      const user = await requireSessionUser(ctx);
      if (!("userId" in user)) return user;
      const { params, body, status } = ctx;
      const quiz = db.query(
        "SELECT id FROM quizzes WHERE id=? AND status='published'"
      ).get(params.id) as any;
      if (!quiz) return status(404, { error: "Quiz not found" });

      const questions = db.query(
        "SELECT id, question_type, correct_answer, points FROM questions WHERE quiz_id=? ORDER BY sort_order"
      ).all(params.id) as any[];

      let score = 0;
      const totalPoints = questions.reduce((sum: number, q: any) => sum + q.points, 0);

      const gradedAnswers = body.answers.map((ans: any) => {
        const q = questions.find((q: any) => q.id === ans.question_id);
        if (!q) return { ...ans, correct: false, points_awarded: 0 };

        const correctAnswer = JSON.parse(q.correct_answer);
        let isCorrect = false;

        if (q.question_type === "multiple_choice" || q.question_type === "true_false") {
          // Single answer — compare arrays
          const userAns = Array.isArray(ans.answer) ? ans.answer : [ans.answer];
          isCorrect = JSON.stringify(userAns.sort()) === JSON.stringify(correctAnswer.sort());
        } else if (q.question_type === "multi_response") {
          // Partial scoring: proportional to correct selections (minus incorrect)
          const userAns = Array.isArray(ans.answer) ? ans.answer : [];
          const correctSet = new Set(correctAnswer);
          const userSet = new Set(userAns);

          let correctSelections = 0;
          let incorrectSelections = 0;
          for (const u of userAns) {
            if (correctSet.has(u)) correctSelections++;
            else incorrectSelections++;
          }

          const maxPossible = correctAnswer.length;
          const raw = correctSelections - incorrectSelections;
          const clamped = Math.max(0, raw);
          const partialRatio = maxPossible > 0 ? clamped / maxPossible : 0;
          const pointsAwarded = Math.round(q.points * partialRatio);

          score += pointsAwarded;
          return { ...ans, correct: partialRatio === 1, partial: partialRatio > 0 && partialRatio < 1, points_awarded: pointsAwarded };
        }

        if (isCorrect) score += q.points;
        return { ...ans, correct: isCorrect, points_awarded: isCorrect ? q.points : 0 };
      });

      if (gradedAnswers.every((a: any) => a.points_awarded !== undefined)) {
        // multi_response already handled scoring
      } else {
        // Recalculate for clarity — all answers scored
      }

      // Save attempt
      db.query(
        "INSERT INTO attempts (user_id, quiz_id, answers, score, total_points) VALUES (?, ?, ?, ?, ?)"
      ).run(user.userId, params.id, JSON.stringify(gradedAnswers), score, totalPoints);

      const attemptId = db.query("SELECT last_insert_rowid() as id").get() as any;

      return {
        attempt_id: attemptId.id,
        score,
        total_points: totalPoints,
        answers_released_at: (quiz as any).answers_released_at,
        per_question: (quiz as any).answers_released_at && new Date((quiz as any).answers_released_at) <= new Date()
          ? gradedAnswers
          : gradedAnswers.map((a: any) => ({ ...a, correct_answer: null, correct: null })),
      };
    },
    {
      body: t.Object({
        answers: t.Array(
          t.Object({
            question_id: t.Number(),
            answer: t.Union([t.Array(t.Number()), t.String()]),
          })
        ),
      }),
    }
  )

  // ── View result ──
  .get("/:id/results/:attemptId", async (ctx: any) => {
    const user = await requireSessionUser(ctx);
    if (!("userId" in user)) return user;
    const { params, status } = ctx;
    const attempt = db.query(
      "SELECT a.*, q.answers_released_at, q.title as quiz_title FROM attempts a JOIN quizzes q ON a.quiz_id = q.id WHERE a.id=? AND a.user_id=?"
    ).get(params.attemptId, user.userId) as any;
    if (!attempt) return status(404, { error: "Attempt not found" });

    const answers = JSON.parse(attempt.answers);
    const canReveal = attempt.answers_released_at && new Date(attempt.answers_released_at) <= new Date();

    if (!canReveal) {
      // Hide correct answers
      return {
        attempt_id: attempt.id,
        quiz_title: attempt.quiz_title,
        score: attempt.score,
        total_points: attempt.total_points,
        answers_released_at: attempt.answers_released_at,
        answers_revealed: false,
        per_question: answers.map((a: any) => ({
          question_id: a.question_id,
          correct: a.correct,
          points_awarded: a.points_awarded,
        })),
      };
    }

    // Reveal full answers with explanations
    const questionIds = answers.map((a: any) => a.question_id);
    const questions = db.query(
      `SELECT id, question_type, question_text, options, correct_answer, points, explanation
       FROM questions WHERE id IN (${questionIds.map(() => '?').join(',')})`
    ).all(...questionIds) as any[];

    const qMap = new Map(questions.map(q => [q.id, q]));

    return {
      attempt_id: attempt.id,
      quiz_title: attempt.quiz_title,
      score: attempt.score,
      total_points: attempt.total_points,
      answers_revealed: true,
      per_question: answers.map((a: any) => {
        const q = qMap.get(a.question_id);
        return {
          ...a,
          question_text: q?.question_text,
          options: q ? JSON.parse(q.options) : [],
          correct_answer: q ? JSON.parse(q.correct_answer) : null,
          explanation: q?.explanation || "",
        };
      }),
    };
  });
