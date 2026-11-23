import { NextResponse } from "next/server";
import { secured } from "@/server/api";
import { getRequestContext } from "@/server/session";

export const GET = secured(getRequestContext, async ({ ctx }) =>
  NextResponse.json({
    user: { id: ctx.userId, name: ctx.userName, email: ctx.email },
    tenant: { id: ctx.tenantId, name: ctx.tenantName },
    role: ctx.roleKey,
    permissions: [...ctx.permissions],
    allBranches: ctx.allBranches,
    branchIds: ctx.branchIds,
  }),
);
