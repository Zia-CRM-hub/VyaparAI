/* End-to-end smoke test on a production build with a fresh seeded DB: npm run build && npx tsx scripts/smoke.ts */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startEmbeddedPg } from "./embedded-pg";

const base = "http://localhost:3055";
let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`);
};

async function login(email: string, password: string): Promise<string> {
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const cookies = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]);
  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookies.join("; ") },
    body: new URLSearchParams({ csrfToken, email, password }),
  });
  return [...res.headers.getSetCookie().map((c) => c.split(";")[0]), ...cookies].join("; ");
}

async function page(cookie: string, p: string) {
  const r = await fetch(base + p, { headers: { cookie }, redirect: "manual" });
  return { status: r.status, text: r.status === 200 ? await r.text() : "", location: r.headers.get("location") ?? "" };
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vyapar-smoke-"));
  const pg = await startEmbeddedPg({ dir, port: 54330, database: "smoke", persistent: false });
  const env = { ...process.env, DATABASE_URL: pg.url, AUTH_SECRET: "smoke-secret-0123456789abcdef0123", AUTH_TRUST_HOST: "true" };
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "pipe" });
  const srv = spawn("npx", ["next", "start", "-p", "3055"], { env, shell: true, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 9000));

  check("health", (await fetch(`${base}/api/health`)).status === 200);
  check("anonymous /dashboard redirects to login", (await page("", "/dashboard")).location.includes("/login"));
  check("anonymous API is 401", (await fetch(`${base}/api/orders`)).status === 401);

  const owner = await login("owner@rangoli.demo.test", "ChangeMe!12345");
  const pages: Array<[string, string]> = [
    ["/dashboard", "Production pipeline"], ["/orders", "Priya Nair"], ["/orders/new", "Who is it for"], ["/production", "Production board"],
    ["/delivery", "Ready for delivery"], ["/payments", "Balances to collect"], ["/customers", "Priya Nair"], ["/notifications", "Notifications"],
    ["/settings", "Business profile"], ["/team", "Tailor"], ["/audit", "Audit trail"], ["/menu", "Menu"],
  ];
  for (const [p, needle] of pages) {
    const r = await page(owner, p);
    check(`owner ${p}`, r.status === 200 && r.text.includes(needle), `(${r.status})`);
  }
  const dash = await page(owner, "/dashboard");
  check("tenant theme and banner applied", dash.text.includes("--brand:#7c2d5b") && dash.text.includes("Diwali"));
  const other = await login("owner@stitchstyle.demo.test", "ChangeMe!12345");
  const otherDash = await page(other, "/dashboard");
  check("second tenant has its own theme", otherDash.text.includes("--brand:#0f766e") && !otherDash.text.includes("Diwali"));
  const orders = await page(other, "/orders");
  check("tenant B cannot see tenant A customers", !orders.text.includes("Priya Nair") && orders.text.includes("Rahul Verma"));
  check("tenant user cannot open /admin", (await page(owner, "/admin")).location.includes("/dashboard"));

  const admin = await login("admin@vyaparai.demo.test", "PlatformAdmin!2345");
  const ov = await page(admin, "/admin");
  check("super admin overview", ov.status === 200 && ov.text.includes("Platform overview"), `(${ov.status})`);
  const list = await page(admin, "/admin/tenants");
  check("super admin sees both businesses", list.text.includes("Rangoli Boutique") && list.text.includes("Stitch &amp; Style Tailors"));
  check("super admin never sees customer names", !list.text.includes("Priya Nair") && !ov.text.includes("Priya Nair"));
  check("super admin landing redirect", (await page(admin, "/dashboard")).location.includes("/admin"));

  srv.kill();
  await pg.stop();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll smoke checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e?.stderr ? String(e.stderr).slice(-900) : e);
  process.exit(1);
});
