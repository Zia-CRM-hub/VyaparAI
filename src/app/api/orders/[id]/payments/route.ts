import { NextResponse } from "next/server";
import { idParamSchema, paymentCreateSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { addPayment, getOrder } from "@/server/services/orders";
import { getRequestContext } from "@/server/session";

export const POST = secured<{ id: string }>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  await addPayment(ctx, id, await readJson(req, paymentCreateSchema));
  return NextResponse.json({ data: await getOrder(ctx, id) }, { status: 201 });
});
