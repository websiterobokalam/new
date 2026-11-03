// Applies db/migrations/*.sql in order, then seeds. MySQL 8.0.16+ / MariaDB 10.6+.
// Usage: DATABASE_URL=mysql://user:pass@host:3306/db node scripts/migrate.mjs [--sample] [--reset]
//   --sample  add review fixtures (refused in production)
//   --reset   drop every table first (tests only)
import mysql from "mysql2/promise";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { seedBase, seedSample, seedSampleSchool } from "../db/seed/seed.mjs";
import { hardening } from "../db/hardening.mjs";

// --on-start: run automatically before `next start` (Hostinger). Never blocks the
// site from starting: problems are logged and the site shows its "can't load" page.
const onStart = process.argv.includes("--on-start");
const url = process.env.DATABASE_OWNER_URL || process.env.DATABASE_URL;
if (!url) {
  if (onStart) { console.log("[migrate] DATABASE_URL not set, skipping"); process.exit(0); }
  throw new Error("DATABASE_URL is required");
}
if (onStart && (process.argv.includes("--sample") || process.argv.includes("--reset"))) throw new Error("--on-start cannot be combined with --sample or --reset");
const sample = process.argv.includes("--sample");
const reset = process.argv.includes("--reset");
if (sample && process.env.NODE_ENV === "production" && process.env.ALLOW_SAMPLE_DATA !== "1") throw new Error("Refusing to load sample data in production");
if (reset && process.env.NODE_ENV === "production") throw new Error("Refusing to reset a production database");

const root = new URL("..", import.meta.url).pathname;
let c;
try {
c = await mysql.createConnection({
  uri: url, multipleStatements: true, timezone: "Z", dateStrings: false,
  ssl: process.env.DATABASE_SSL === "1" ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") || undefined } : undefined,
});
} catch (e) {
  console.error(`[migrate] cannot connect: ${e.message}`);
  process.exit(onStart ? 0 : 1);
}
await c.query("SET time_zone = '+00:00'");
try {
  if (reset) {
    const [tables] = await c.query("SELECT table_name AS t, table_type AS k FROM information_schema.tables WHERE table_schema = DATABASE()");
    await c.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const { t, k } of tables) await c.query(`${k === "VIEW" ? "DROP VIEW" : "DROP TABLE"} IF EXISTS \`${t}\``);
    await c.query("SET FOREIGN_KEY_CHECKS = 1");
  }
  await c.query("CREATE TABLE IF NOT EXISTS schema_migrations (id VARCHAR(100) PRIMARY KEY, applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB");
  const [doneRows] = await c.query("SELECT id FROM schema_migrations");
  const done = new Set(doneRows.map((r) => r.id));
  for (const f of readdirSync(join(root, "db/migrations")).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    // DDL commits implicitly in MySQL, so each file must be safe to re-run after a failure.
    await c.query(readFileSync(join(root, "db/migrations", f), "utf8"));
    await c.query("INSERT INTO schema_migrations (id) VALUES (?)", [f]);
    console.log("applied", f);
  }
  // Re-runnable extra: foreign key from batches to fellows (added once).
  const [[{ fk }]] = await c.query("SELECT COUNT(*) AS fk FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = 'batches' AND constraint_name = 'batches_fellow'");
  if (!fk) await c.query("ALTER TABLE batches ADD CONSTRAINT batches_fellow FOREIGN KEY (educator_fellow_id) REFERENCES fellows(account_id)");
  let skipped = 0;
  for (const [name, sql] of hardening) {
    const [[{ n }]] = await c.query("SELECT COUNT(*) AS n FROM information_schema.triggers WHERE trigger_schema = DATABASE() AND trigger_name = ?", [name]);
    if (n > 0) continue;
    try { await c.query(sql); } catch (e) { skipped++; if (skipped === 1) console.warn(`hardening triggers not installed (${e.code ?? e.message}); app-level rules still apply`); }
  }
  await seedBase(c, root);
  if (sample) { await seedSample(c); await seedSampleSchool(c); console.log("sample fixtures loaded"); }
  console.log("ok");
} catch (e) {
  console.error(`[migrate] ${e.message}`);
  process.exitCode = onStart ? 0 : 1;
} finally {
  await c.end();
}
