import { NextResponse } from "next/server";
import { brandingSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { getBranding, updateBranding } from "@/server/services/branding";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ ctx }) => NextResponse.json({ data: await getBranding(ctx.tenantId) }));

export const PUT = secured(getRequestContext, async ({ req, ctx }) => {
  await updateBranding(ctx, await readJson(req, brandingSchema));
  return NextResponse.json({ data: await getBranding(ctx.tenantId) });
});
