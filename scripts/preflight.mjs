// Launch preflight (Phase 6). Prints every launch check.
//
//   node scripts/preflight.mjs            report, exit 1 if anything blocks launch
//   node scripts/preflight.mjs --db       also check the database
//   node scripts/preflight.mjs --on-start run by `npm start`: on the live domain
//                                         (https://robokalam.com, production, not review mode)
//                                         a blocker stops the server from starting.
//                                         Anywhere else it only warns.
//
// Emergency override: LAUNCH_PREFLIGHT=warn lets the live site start anyway (logged loudly).
import { readdirSync } from "node:fs";
import mysql from "mysql2/promise";
import { envChecks, dbChecks, summarise, isLiveSite } from "./launch-checks.mjs";

const onStart = process.argv.includes("--on-start");
const withDb = process.argv.includes("--db") || onStart;
const live = isLiveSite();

let checks = envChecks();
if (withDb && process.env.DATABASE_URL) {
  let c;
  try {
    c = await mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "Z", ssl: process.env.DATABASE_SSL === "1" ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") || undefined } : undefined });
    const q = async (sql, p = []) => (await c.query(sql, p))[0];
    const expected = readdirSync(new URL("../db/migrations", import.meta.url)).filter((f) => f.endsWith(".sql")).length;
    checks = checks.concat(await dbChecks(q, expected));
  } catch (e) {
    // Migrations run after this on a fresh database; a missing table is not fatal here.
    checks.push({ id: "db_reachable", area: "Database", label: "Database answers", ok: !/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|Access denied/i.test(e.message), severity: "blocker", detail: e.message, fix: "Check DATABASE_URL and that the database is running." });
  } finally { await c?.end().catch(() => {}); }
}

const s = summarise(checks);
const mark = (x) => (x.ok ? "  ok  " : x.severity === "blocker" ? "BLOCK " : " warn ");
console.log(`\n[preflight] Launch readiness: ${s.passed}/${s.total} passed, ${s.blockers.length} blocking, ${s.warnings.length} warnings${live ? " (live site)" : ""}`);
for (const x of checks) console.log(`[preflight] ${mark(x)} ${x.area.padEnd(12)} ${x.label}${x.ok ? "" : `\n[preflight]        ${x.detail}. Fix: ${x.fix}`}`);

if (!s.ready) {
  if (onStart && !live) { console.log("[preflight] Not the live site, so starting anyway.\n"); process.exit(0); }
  if (onStart && process.env.LAUNCH_PREFLIGHT === "warn") { console.error("[preflight] LAUNCH_PREFLIGHT=warn: starting the LIVE site with blockers. Fix them now.\n"); process.exit(0); }
  console.error(`[preflight] ${s.blockers.length} item(s) block launch.${onStart ? " The live site will not start until they are fixed." : ""}\n`);
  process.exit(1);
}
console.log("[preflight] Ready to launch.\n");
