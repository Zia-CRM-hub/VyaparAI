import { NextResponse } from "next/server";
import { orderCreateSchema } from "@/lib/schemas";
import type { OrderStatus } from "@/lib/orders";
import { readJson, secured } from "@/server/api";
import { createOrder, listOrders } from "@/server/services/orders";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ req, ctx }) => {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const data = await listOrders(ctx, {
    q: sp.get("q") ?? undefined,
    statuses: status ? (status.split(",") as OrderStatus[]) : undefined,
    overdue: sp.get("overdue") === "1",
    unpaid: sp.get("unpaid") === "1",
    mine: sp.get("mine") === "1",
    customerId: sp.get("customerId") ?? undefined,
  });
  return NextResponse.json({ data });
});

export const POST = secured(getRequestContext, async ({ req, ctx }) =>
  NextResponse.json({ data: await createOrder(ctx, await readJson(req, orderCreateSchema)) }, { status: 201 }),
);
