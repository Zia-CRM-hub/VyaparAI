import { NextResponse } from "next/server";
import { customerUpdateSchema, idParamSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { deleteCustomer, getCustomer, updateCustomer } from "@/server/services/customers";
import { getRequestContext } from "@/server/session";

type P = { id: string };

export const GET = secured<P>(getRequestContext, async ({ ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  return NextResponse.json({ data: await getCustomer(ctx, id) });
});

export const PATCH = secured<P>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  return NextResponse.json({ data: await updateCustomer(ctx, id, await readJson(req, customerUpdateSchema)) });
});

export const DELETE = secured<P>(getRequestContext, async ({ ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  await deleteCustomer(ctx, id);
  return new NextResponse(null, { status: 204 });
});
