import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * UNSCOPED client. Only identity/bootstrap code (login, signup, seed, audit writes)
 * may import this. Everything tenant-owned must go through tenantDb(tenantId).
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
