import { readdirSync } from "node:fs";
import { join } from "node:path";
import { system } from "../db";
import { envChecks, dbChecks, summarise, isLiveSite, type Check } from "../../../scripts/launch-checks.mjs";

export type { Check };
export { isLiveSite };

function expectedMigrations() {
  try { return readdirSync(join(process.cwd(), "db/migrations")).filter((f) => f.endsWith(".sql")).length; } catch { return 5; }
}

/** Every launch check, settings and database, for the ops Launch page and the health check. */
export async function launchReport() {
  let checks: Check[] = envChecks(process.env);
  try {
    checks = checks.concat(await system((c) => dbChecks(async (sql, p = []) => (await c.query(sql, p)).rows, expectedMigrations())));
  } catch (e) {
    checks.push({ id: "db_reachable", area: "Database", label: "Database answers", ok: false, severity: "blocker", detail: (e as Error).message, fix: "Check DATABASE_URL and that the database is running." });
  }
  return { checks, ...summarise(checks), live: isLiveSite(process.env) };
}
