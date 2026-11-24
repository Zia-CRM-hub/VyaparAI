import { NextResponse } from "next/server";
import { familyMemberCreateSchema, idParamSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { addFamilyMember, listFamily } from "@/server/services/family";
import { getRequestContext } from "@/server/session";

type P = { id: string };

export const GET = secured<P>(getRequestContext, async ({ ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  return NextResponse.json({ data: await listFamily(ctx, id) });
});

export const POST = secured<P>(getRequestContext, async ({ req, ctx, params }) => {
  const { id } = idParamSchema.parse(params);
  return NextResponse.json({ data: await addFamilyMember(ctx, id, await readJson(req, familyMemberCreateSchema)) }, { status: 201 });
});
