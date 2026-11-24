import { headers } from "next/headers";
import { auth } from "@/auth";
import { loadContext, type AuthContext } from "./context";
import { loadPlatformContext, type PlatformContext } from "./services/platform";

async function requestMeta() {
  const h = await headers();
  return { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, userAgent: h.get("user-agent") };
}

/** Resolves the authenticated tenant context for the current request (throws 401 if none). */
export async function getRequestContext(): Promise<AuthContext> {
  const [session, meta] = await Promise.all([auth(), requestMeta()]);
  return { ...(await loadContext(session)), ...meta };
}

/** Resolves the platform (Super Admin) context. 401 if signed out, 403 if not a platform admin. */
export async function getPlatformContext(): Promise<PlatformContext> {
  const [session, meta] = await Promise.all([auth(), requestMeta()]);
  return { ...(await loadPlatformContext(session)), ...meta };
}
