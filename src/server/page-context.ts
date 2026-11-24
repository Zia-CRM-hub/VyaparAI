import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can, type AuthContext } from "./context";
import { prisma } from "./db";
import { ForbiddenError, UnauthorizedError } from "./errors";
import type { Permission } from "./rbac";
import type { PlatformContext } from "./services/platform";
import { getPlatformContext, getRequestContext } from "./session";

/** For server components: session identity or redirect; optional permission gate. */
export async function requirePageContext(permission?: Permission): Promise<AuthContext> {
  let ctx: AuthContext;
  try {
    ctx = await getRequestContext();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      // A signed-in platform admin has no tenant: send them to the Super Admin area.
      const session = await auth();
      if (session?.userId) {
        const u = await prisma.user.findUnique({ where: { id: session.userId }, select: { isPlatformAdmin: true } });
        if (u?.isPlatformAdmin) redirect("/admin");
      }
      redirect("/login");
    }
    throw e;
  }
  if (permission && !can(ctx, permission)) redirect("/dashboard");
  return ctx;
}

export async function requirePlatformPage(): Promise<PlatformContext> {
  try {
    return await getPlatformContext();
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/login");
    if (e instanceof ForbiddenError) redirect("/dashboard");
    throw e;
  }
}
