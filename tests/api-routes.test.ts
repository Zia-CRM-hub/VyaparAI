import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/server/errors";
import type { AuthContext } from "@/server/context";
import { createCustomer } from "@/server/services/customers";
import { makeTenant, phone } from "./helpers";

// Replace session resolution only; everything below (services, scoped DB) is real.
let current: AuthContext | null = null;
vi.mock("@/server/session", () => ({
  getRequestContext: async () => {
    if (!current) throw new UnauthorizedError();
    return current;
  },
}));

const json = { "content-type": "application/json" };
const req = (method: string, url: string, body?: unknown, headers: Record<string, string> = json) =>
  new NextRequest(`http://localhost${url}`, { method, headers: { host: "localhost", ...headers }, body: body ? JSON.stringify(body) : undefined });

let A: Awaited<ReturnType<typeof makeTenant>>, B: Awaited<ReturnType<typeof makeTenant>>;
let bCustomerId: string;

beforeAll(async () => {
  A = await makeTenant("RA");
  B = await makeTenant("RB");
  bCustomerId = (await createCustomer(B.ctx, { name: "Bob", phone: phone() as never, preferredLanguage: "en" })).id;
});

describe("HTTP API", () => {
  it("401 without a session", async () => {
    current = null;
    const { GET } = await import("@/app/api/customers/route");
    const res = await GET(req("GET", "/api/customers"), { params: Promise.resolve({}) as never });
    expect(res.status).toBe(401);
  });

  it("Tenant A gets 404 on B's customer for GET, PATCH and DELETE", async () => {
    current = A.ctx;
    const { GET, PATCH, DELETE } = await import("@/app/api/customers/[id]/route");
    const p = { params: Promise.resolve({ id: bCustomerId }) };
    expect((await GET(req("GET", `/x`), p)).status).toBe(404);
    expect((await PATCH(req("PATCH", `/x`, { name: "pwn" }), p)).status).toBe(404);
    expect((await DELETE(req("DELETE", `/x`), p)).status).toBe(404);
  });

  it("a client-supplied tenantId in the body is rejected, never honoured", async () => {
    current = A.ctx;
    const { POST } = await import("@/app/api/customers/route");
    const res = await POST(
      req("POST", "/api/customers", { name: "Zed", phone: phone(), tenantId: B.tenantId }),
      { params: Promise.resolve({}) as never },
    );
    expect(res.status).toBe(201); // unknown key stripped by Zod
    const body = await res.json();
    expect(body.data.tenantId).toBe(A.tenantId);
  });

  it("validation errors return 400 with issues", async () => {
    current = A.ctx;
    const { POST } = await import("@/app/api/customers/route");
    const res = await POST(req("POST", "/api/customers", { name: "x", phone: "123" }), { params: Promise.resolve({}) as never });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("validation_error");
  });

  it("blocks cross-origin and non-JSON writes (CSRF)", async () => {
    current = A.ctx;
    const { POST } = await import("@/app/api/customers/route");
    const ctx = { params: Promise.resolve({}) as never };
    const cross = await POST(req("POST", "/api/customers", { name: "x", phone: phone() }, { ...json, origin: "http://evil.example" }), ctx);
    expect(cross.status).toBe(403);
    const form = await POST(req("POST", "/api/customers", { name: "x" }, { "content-type": "text/plain" }), ctx);
    expect(form.status).toBe(403);
  });

  it("403 when role lacks permission", async () => {
    const { addMember } = await import("./helpers");
    current = (await addMember(A.ctx, "TAILOR")).ctx;
    const { GET } = await import("@/app/api/customers/route");
    expect((await GET(req("GET", "/api/customers"), { params: Promise.resolve({}) as never })).status).toBe(403);
  });
});
