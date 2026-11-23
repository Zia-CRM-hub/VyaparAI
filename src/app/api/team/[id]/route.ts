import { NextResponse } from "next/server";
import { z } from "zod";
import { idParamSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { setMemberStatus } from "@/server/services/team";
import { getRequestContext } from "@/server/session";

export const PATCH = secured<{ id: string }>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  const { status } = await readJson(req, z.object({ status: z.enum(["ACTIVE", "DISABLED"]) }));
  await setMemberStatus(ctx, id, status);
  return NextResponse.json({ ok: true });
});
