import { redirect } from "next/navigation";
import { can, type AuthContext } from "./context";
import { UnauthorizedError } from "./errors";
import type { Permission } from "./rbac";
import { getRequestContext } from "./session";

/** For server components: session identity or redirect to /login; optional permission gate. */
export async function requirePageContext(permission?: Permission): Promise<AuthContext> {
  let ctx: AuthContext;
  try {
    ctx = await getRequestContext();
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/login");
    throw e;
  }
  if (permission && !can(ctx, permission)) redirect("/dashboard");
  return ctx;
}
