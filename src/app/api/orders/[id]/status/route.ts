import { NextResponse } from "next/server";
import { idParamSchema, orderStatusSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { getOrder, transitionOrder } from "@/server/services/orders";
import { getRequestContext } from "@/server/session";

export const POST = secured<{ id: string }>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  const { to, note } = await readJson(req, orderStatusSchema);
  await transitionOrder(ctx, id, to, note);
  return NextResponse.json({ data: await getOrder(ctx, id) });
});
