/* End-to-end smoke test against a production build: npm run build && npx tsx scripts/smoke.ts */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startEmbeddedPg } from "./embedded-pg";

const base = "http://localhost:3055";

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vyapar-smoke-"));
  const pg = await startEmbeddedPg({ dir, port: 54330, database: "smoke", persistent: false });
  const env = { ...process.env, DATABASE_URL: pg.url, AUTH_SECRET: "smoke-secret-0123456789abcdef0123", AUTH_TRUST_HOST: "true" };
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  console.log(execSync("npx tsx prisma/seed.ts", { env }).toString());
  const srv = spawn("npx", ["next", "start", "-p", "3055"], { env, shell: true, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 9000));

  for (const p of ["/api/health", "/login", "/dashboard", "/api/me"]) {
    const r = await fetch(base + p, { redirect: "manual" });
    console.log(p, "->", r.status, r.headers.get("location") ?? "");
  }
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const cookies = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]);
  const login = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookies.join("; ") },
    body: new URLSearchParams({ csrfToken, email: "owner@rangoli.demo.test", password: "ChangeMe!12345" }),
  });
  const session = [...login.headers.getSetCookie().map((c) => c.split(";")[0]), ...cookies].join("; ");
  console.log("login ->", login.status);
  const me = await fetch(`${base}/api/me`, { headers: { cookie: session } });
  const meJson = (await me.json()) as { tenant?: { name: string }; role?: string };
  console.log("/api/me ->", me.status, meJson.tenant?.name, meJson.role);
  const dash = await fetch(`${base}/dashboard`, { headers: { cookie: session } });
  console.log("/dashboard (authed) ->", dash.status, "shows tenant:", (await dash.text()).includes("Rangoli Boutique"));
  srv.kill();
  await pg.stop();
  fs.rmSync(dir, { recursive: true, force: true });
  process.exit(0);
}

main().catch((e) => {
  console.error(e?.stderr ? String(e.stderr).slice(-900) : e);
  process.exit(1);
});
