import { NextResponse, type NextRequest } from "next/server";
import { assertSameOriginJson, errorResponse, readJson } from "@/server/api";
import { rateLimit } from "@/server/rate-limit";
import { provisionTenant } from "@/server/tenancy";
import { signupSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    assertSameOriginJson(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    rateLimit(`signup:${ip}`, 5, 60 * 60_000);
    const input = await readJson(req, signupSchema);
    const { tenant } = await provisionTenant(input, { ip, userAgent: req.headers.get("user-agent") });
    return NextResponse.json({ tenantId: tenant.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
