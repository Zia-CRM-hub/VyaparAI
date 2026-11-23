import { NextResponse } from "next/server";
import { memberCreateSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { createMember, listMembers } from "@/server/services/team";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ ctx }) => NextResponse.json({ data: await listMembers(ctx) }));

export const POST = secured(getRequestContext, async ({ req, ctx }) =>
  NextResponse.json({ data: await createMember(ctx, await readJson(req, memberCreateSchema)) }, { status: 201 }),
);
