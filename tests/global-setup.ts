import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startEmbeddedPg, type LocalPg } from "../scripts/embedded-pg";

let pg: LocalPg | undefined;
let dir: string | undefined;

/**
 * Tests need a real PostgreSQL. In CI, DATABASE_URL points at the service container.
 * Locally (no DATABASE_URL), an embedded throwaway PostgreSQL is started on port 54329.
 */
export default async function setup() {
  process.env.AUTH_SECRET ||= "test-secret-test-secret-test-secret-123";
  if (!process.env.DATABASE_URL) {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "vyapar-test-pg-"));
    pg = await startEmbeddedPg({ dir, port: 54329, database: "vyaparai_test", persistent: false });
    process.env.DATABASE_URL = pg.url;
  }
  execSync("npx prisma migrate deploy", { stdio: "pipe", env: process.env });

  return async () => {
    await pg?.stop();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  };
}
