import { NextResponse } from "next/server";
import { z } from "zod";
import { idParamSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { attachMeasurement } from "@/server/services/orders";
import { getRequestContext } from "@/server/session";

const body = z.object({
  values: z.record(z.string().max(40), z.union([z.number(), z.string()])),
  notes: z.string().trim().max(500).optional(),
});

export const POST = secured<{ id: string }>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  const { values, notes } = await readJson(req, body);
  return NextResponse.json({ data: await attachMeasurement(ctx, id, values, notes) }, { status: 201 });
});
