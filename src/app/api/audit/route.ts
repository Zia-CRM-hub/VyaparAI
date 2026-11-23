import { NextResponse } from "next/server";
import { secured } from "@/server/api";
import { listAudit } from "@/server/services/overview";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ ctx }) => NextResponse.json({ data: await listAudit(ctx) }));
