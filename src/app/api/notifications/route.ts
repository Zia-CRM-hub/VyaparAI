import { NextResponse } from "next/server";
import { secured } from "@/server/api";
import { getNotifications } from "@/server/services/orders";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ ctx }) => NextResponse.json({ data: await getNotifications(ctx) }));
