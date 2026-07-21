import jwt from "@elysiajs/jwt";
import { Elysia } from "elysia";

// Generate a random secret if none provided
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomUUID() + crypto.randomUUID();
const JWT_EXPIRY = "7d";

const jwtPlugin = jwt({
  name: "jwt",
  secret: JWT_SECRET,
  exp: JWT_EXPIRY,
});

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

export const getSessionUser = async ({ jwt, cookie }: any): Promise<JwtPayload | null> => {
  const token = cookie?.gezylms_token?.value as string | undefined;
  if (!token) return null;

  const payload = await jwt.verify(token) as JwtPayload | false;
  return payload || null;
};

export const requireSessionUser = async (ctx: any) => {
  const user = await getSessionUser(ctx);
  if (!user) return ctx.status(401, { error: "Authentication required" });
  return user;
};

export const requireAdminUser = async (ctx: any) => {
  const user = await requireSessionUser(ctx);
  if ("userId" in user && user.role !== "admin") {
    return ctx.status(403, { error: "Admin access required" });
  }
  return user;
};

// ── Auth guard middleware ──
export const authGuard = new Elysia()
  .use(jwtPlugin)
  .onBeforeHandle(async (ctx: any) => {
    const user = await getSessionUser(ctx);
    if (!user) return ctx.status(401, { error: "Authentication required" });
  });

// ── Admin guard middleware ──
export const adminGuard = new Elysia()
  .use(jwtPlugin)
  .onBeforeHandle(async (ctx: any) => {
    const user = await getSessionUser(ctx);
    if (!user) return ctx.status(401, { error: "Authentication required" });
    if (user.role !== "admin") {
      return ctx.status(403, { error: "Admin access required" });
    }
  });

export { jwtPlugin, JWT_SECRET };
