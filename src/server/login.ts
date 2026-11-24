import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/schemas";
import { recordAudit } from "./audit";
import { prisma } from "./db";
import { RateLimitError } from "./errors";
import { rateLimit } from "./rate-limit";

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
// Valid bcrypt hash of a random string: used so unknown emails cost the same time as known ones.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5Y2pS1Yw0lE3Tn5GJp2l5H3V1qQ0b9y";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  membershipId: string;
}

/** Verifies credentials. Returns null on any failure (never reveals which part was wrong). */
export async function authenticate(
  raw: unknown,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<AuthenticatedUser | null> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  try {
    rateLimit(`login:ip:${meta.ip ?? "unknown"}`, 30, 60_000);
    rateLimit(`login:email:${email}`, 10, 60_000);
  } catch (e) {
    if (e instanceof RateLimitError) return null;
    throw e;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const locked = !!user?.lockedUntil && user.lockedUntil > new Date();
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || locked || !ok) {
    if (user && !locked) {
      const failures = user.failedLogins + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: failures >= MAX_FAILURES
          ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) }
          : { failedLogins: failures },
      });
    }
    await recordAudit({
      tenantId: null, actorUserId: user?.id ?? null, action: locked ? "auth.login_locked" : "auth.login_failed",
      entityType: "User", entityId: user?.id ?? null, ...meta,
    });
    return null;
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, status: "ACTIVE", tenant: { status: "ACTIVE" } },
    orderBy: { createdAt: "asc" },
  });
  if (!membership && !user.isPlatformAdmin) return null; // platform admins need no tenant

  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await recordAudit({
    tenantId: membership?.tenantId ?? null, actorUserId: user.id, action: "auth.login", entityType: "User", entityId: user.id, ...meta,
  });
  return { id: user.id, email: user.email, name: user.name, membershipId: membership?.id ?? "" };
}
