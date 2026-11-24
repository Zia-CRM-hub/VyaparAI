import { NextResponse } from "next/server";
import { idParamSchema, orderUpdateSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { getOrder, updateOrder } from "@/server/services/orders";
import { getRequestContext } from "@/server/session";

type P = { id: string };

export const GET = secured<P>(getRequestContext, async ({ ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  return NextResponse.json({ data: await getOrder(ctx, id) });
});

export const PATCH = secured<P>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  await updateOrder(ctx, id, await readJson(req, orderUpdateSchema));
  return NextResponse.json({ data: await getOrder(ctx, id) });
});
