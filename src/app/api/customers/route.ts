import { NextResponse } from "next/server";
import { customerCreateSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { createCustomer, listCustomers } from "@/server/services/customers";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ req, ctx }) => {
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  return NextResponse.json({ data: await listCustomers(ctx, { q }) });
});

export const POST = secured(getRequestContext, async ({ req, ctx }) => {
  const input = await readJson(req, customerCreateSchema);
  return NextResponse.json({ data: await createCustomer(ctx, input) }, { status: 201 });
});
