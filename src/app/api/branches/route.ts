import { NextResponse } from "next/server";
import { branchCreateSchema } from "@/lib/schemas";
import { readJson, secured } from "@/server/api";
import { createBranch, listBranches } from "@/server/services/branches";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ ctx }) => NextResponse.json({ data: await listBranches(ctx) }));

export const POST = secured(getRequestContext, async ({ req, ctx }) =>
  NextResponse.json({ data: await createBranch(ctx, await readJson(req, branchCreateSchema)) }, { status: 201 }),
);
