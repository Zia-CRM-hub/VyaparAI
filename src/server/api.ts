import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import type { AuthContext } from "./context";
import { AppError, ForbiddenError } from "./errors";
import { rateLimit } from "./rate-limit";

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "Invalid input", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } },
      { status: 400 },
    );
  }
  if (e instanceof AppError) {
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  }
  console.error("[api] unhandled error", e);
  return NextResponse.json({ error: { code: "internal", message: "Something went wrong" } }, { status: 500 });
}

/**
 * CSRF defence for cookie-authenticated JSON endpoints (on top of SameSite=Lax session cookies):
 * state-changing requests must be same-origin and send JSON.
 */
export function assertSameOriginJson(req: NextRequest): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) throw new ForbiddenError("Cross-origin request blocked");
  if (req.method !== "DELETE" && !req.headers.get("content-type")?.includes("application/json")) {
    throw new ForbiddenError("Content-Type must be application/json");
  }
}

export async function readJson<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError(400, "bad_json", "Request body must be valid JSON");
  }
  return schema.parse(body);
}

type Handler<P> = (args: { req: NextRequest; ctx: AuthContext; params: P }) => Promise<NextResponse | Response>;

/** Standard wrapper: CSRF check → session context → per-user rate limit → handler → uniform errors. */
export function secured<P = Record<string, never>>(
  getCtx: () => Promise<AuthContext>,
  handler: Handler<P>,
) {
  return async (req: NextRequest, route: { params: Promise<P> }) => {
    try {
      assertSameOriginJson(req);
      const ctx = await getCtx();
      rateLimit(`api:${ctx.userId}`, 120, 60_000);
      return await handler({ req, ctx, params: await route.params });
    } catch (e) {
      return errorResponse(e);
    }
  };
}
