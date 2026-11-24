import { NextResponse } from "next/server";
import { secured } from "@/server/api";
import { listAssignableStaff } from "@/server/services/orders";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ ctx }) => NextResponse.json({ data: await listAssignableStaff(ctx) }));
