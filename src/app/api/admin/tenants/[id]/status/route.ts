import { NextResponse } from "next/server";
import { z } from "zod";
import { idParamSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { setTenantStatus } from "@/server/services/platform";
import { getPlatformContext } from "@/server/session";

export const PATCH = secured<{ id: string }, Awaited<ReturnType<typeof getPlatformContext>>>(getPlatformContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  const { status } = await readJson(req, z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }));
  await setTenantStatus(ctx, id, status);
  return NextResponse.json({ ok: true });
});
