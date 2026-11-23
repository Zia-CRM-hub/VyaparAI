import { headers } from "next/headers";
import { auth } from "@/auth";
import { loadContext, type AuthContext } from "./context";

/** Resolves the authenticated tenant context for the current request (throws 401 if none). */
export async function getRequestContext(): Promise<AuthContext> {
  const [session, h] = await Promise.all([auth(), headers()]);
  const ctx = await loadContext(session);
  return {
    ...ctx,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}
