import type { BrandingInput } from "@/lib/schemas";
import { recordAudit } from "../audit";
import { assertCan, type AuthContext } from "../context";
import { prisma } from "../db";
import { AppError } from "../errors";

const MAX_LOGO_BYTES = 150 * 1024;
const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

/** Raster formats only (SVG is refused: it can carry script). Magic bytes must match the declared type. */
export function validateLogo(dataUrl: string): void {
  const m = LOGO_RE.exec(dataUrl);
  if (!m) throw new AppError(400, "invalid_logo", "Logo must be a PNG, JPEG or WebP image");
  const bytes = Buffer.from(m[2]!, "base64");
  if (bytes.length > MAX_LOGO_BYTES) throw new AppError(400, "invalid_logo", "Logo must be smaller than 150 KB");
  const ok =
    (m[1] === "png" && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (m[1] === "jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8) ||
    (m[1] === "webp" && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP");
  if (!ok) throw new AppError(400, "invalid_logo", "Logo file content does not match its type");
}

export async function getBranding(tenantId: string) {
  return prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      name: true, phone: true, address: true, city: true, gstin: true, brandColor: true, logoDataUrl: true,
      bannerEnabled: true, bannerText: true, bannerTone: true,
    },
  });
}

export async function updateBranding(ctx: AuthContext, input: BrandingInput) {
  assertCan(ctx, "tenant:manage");
  if (input.logoDataUrl) validateLogo(input.logoDataUrl);
  await prisma.tenant.update({
    where: { id: ctx.tenantId }, // tenant comes from the session, never the request
    data: {
      name: input.name,
      phone: input.phone ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      gstin: input.gstin ?? null,
      brandColor: input.brandColor,
      bannerEnabled: input.bannerEnabled && !!input.bannerText,
      bannerText: input.bannerText ?? null,
      bannerTone: input.bannerTone,
      ...(input.logoDataUrl !== undefined ? { logoDataUrl: input.logoDataUrl } : {}),
    },
  });
  await recordAudit({
    tenantId: ctx.tenantId, actorUserId: ctx.userId, action: "tenant.branding_update", entityType: "Tenant",
    entityId: ctx.tenantId, metadata: { logoChanged: input.logoDataUrl !== undefined }, ip: ctx.ip, userAgent: ctx.userAgent,
  });
}
