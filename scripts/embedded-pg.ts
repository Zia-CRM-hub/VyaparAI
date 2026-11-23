import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";

export interface LocalPg {
  url: string;
  stop: () => Promise<void>;
}

/** Starts an embedded PostgreSQL (no Docker needed). Used for local dev and tests. */
export async function startEmbeddedPg(opts: {
  dir: string;
  port: number;
  database: string;
  persistent: boolean;
}): Promise<LocalPg> {
  const user = "vyapar";
  const password = "vyapar";
  const fresh = !fs.existsSync(`${opts.dir}/PG_VERSION`);
  const pg = new EmbeddedPostgres({
    databaseDir: opts.dir,
    user,
    password,
    port: opts.port,
    persistent: opts.persistent,
    onLog: () => {},
    onError: () => {},
  });
  if (fresh) await pg.initialise();
  await pg.start();
  if (fresh) await pg.createDatabase(opts.database);
  return {
    url: `postgresql://${user}:${password}@localhost:${opts.port}/${opts.database}?schema=public`,
    stop: () => pg.stop(),
  };
}
