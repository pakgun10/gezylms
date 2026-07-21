import { Elysia, t } from "elysia";
import { jwtPlugin } from "../auth";
import db from "../db";

const bcrypt = await import("bcrypt-ts");

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(jwtPlugin)

  // ── Register ──
  .post(
    "/register",
    async ({ body, status }) => {
      const { username, password, full_name } = body;

      const existing = db.query("SELECT id FROM users WHERE username = ?").get(username);
      if (existing) return status(409, { error: "Username already taken" });

      const passwordHash = bcrypt.hashSync(password, 12);
      db.query(
        "INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)"
      ).run(username, passwordHash, full_name);

      return { success: true, message: "Registration successful. Please log in." };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 30 }),
        password: t.String({ minLength: 6, maxLength: 100 }),
        full_name: t.String({ minLength: 1, maxLength: 100 }),
      }),
    }
  )

  // ── Login ──
  .post(
    "/login",
    async ({ body, jwt, cookie, status }) => {
      const { username, password } = body;

      const user = db
        .query("SELECT id, username, password_hash, full_name, role FROM users WHERE username = ?")
        .get(username) as any;

      if (!user) return status(401, { error: "Invalid username or password" });

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) return status(401, { error: "Invalid username or password" });

      const token = await jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      cookie.gezylms_token?.set({
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )

  // ── Logout ──
  .get("/logout", async ({ cookie }) => {
    cookie.gezylms_token?.remove();
    return { success: true, message: "Logged out" };
  })

  // ── Current user ──
  .get("/me", async ({ jwt, cookie }) => {
    const token = cookie?.gezylms_token?.value as string | undefined;
    if (!token) return { user: null };

    const payload = await jwt.verify(token) as any;
    if (!payload) return { user: null };

    const user = db
      .query("SELECT id, username, full_name, role FROM users WHERE id = ?")
      .get(payload.userId) as any;
    if (!user) return { user: null };

    return { user };
  });
