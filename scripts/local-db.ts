/* Runs a local PostgreSQL on :5432 (data in .pgdata) until Ctrl+C. No Docker required. */
import path from "node:path";
import { startEmbeddedPg } from "./embedded-pg";

async function main() {
  const pg = await startEmbeddedPg({
    dir: path.resolve(process.cwd(), ".pgdata"),
    port: 5432,
    database: "vyaparai",
    persistent: true,
  });
  console.log(`PostgreSQL ready: ${pg.url}`);
  console.log("Keep this terminal open. Press Ctrl+C to stop.");
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 1 << 30);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
