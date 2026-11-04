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
  // Phase 5 changes to existing tables (guarded so a re-run is safe).
  const hasColumn = async (t, col) => (await c.query("SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?", [t, col]))[0][0].n > 0;
  const checkClause = async (name) => (await c.query("SELECT check_clause AS cc FROM information_schema.check_constraints WHERE constraint_schema = DATABASE() AND constraint_name = ?", [name]))[0][0]?.cc ?? "";
  if (!(await hasColumn("courses", "author_fellow_id"))) {
    await c.query("ALTER TABLE courses ADD COLUMN author_fellow_id CHAR(36) NULL, ADD COLUMN fellow_share_pct DECIMAL(5,2) NULL, ADD CONSTRAINT courses_author FOREIGN KEY (author_fellow_id) REFERENCES fellows(account_id)");
  }
  if (!(await hasColumn("fellows", "referred_by"))) await c.query("ALTER TABLE fellows ADD COLUMN referred_by VARCHAR(12) NULL");
  if (!(await checkClause("gigs_kind")).includes("own_course")) {
    await c.query("ALTER TABLE gigs DROP CONSTRAINT gigs_kind");
    await c.query("ALTER TABLE gigs ADD CONSTRAINT gigs_kind CHECK (kind IN ('live_batch','campus_session','weekend_workshop','doubt_desk','project_mentor','build_session','shadow','co_teach','own_course'))");
  }
  if (!(await checkClause("earn_kind")).includes("referral")) {
    await c.query("ALTER TABLE earnings_lines DROP CONSTRAINT earn_kind");
    await c.query("ALTER TABLE earnings_lines ADD CONSTRAINT earn_kind CHECK (kind IN ('session','training','demo','shadow','co_teach','adjustment','own_course','referral'))");
  }
  // Email and one-to-one changes to existing tables (guarded).
  if (!(await hasColumn("accounts", "email"))) {
    await c.query("ALTER TABLE accounts ADD COLUMN email VARCHAR(160) NULL, ADD COLUMN email_verified_at DATETIME(3) NULL, ADD COLUMN email_updates BOOLEAN NOT NULL DEFAULT TRUE");
  }
  if (!(await hasColumn("courses", "format"))) {
    await c.query("ALTER TABLE courses ADD COLUMN format VARCHAR(10) NOT NULL DEFAULT 'group'");
    await c.query("ALTER TABLE courses DROP CONSTRAINT courses_batch");
    // One-to-one is online, one learner; groups are 2 to 30.
    await c.query("ALTER TABLE courses ADD CONSTRAINT courses_batch CHECK ((format = 'group' AND batch_size_max BETWEEN 2 AND 30) OR (format = 'one_to_one' AND batch_size_max = 1))");
  }
  if (!(await hasColumn("course_drafts", "format"))) {
    await c.query("ALTER TABLE course_drafts ADD COLUMN format VARCHAR(10) NOT NULL DEFAULT 'group'");
    await c.query("ALTER TABLE course_drafts DROP CONSTRAINT drafts_batch");
    await c.query("ALTER TABLE course_drafts ADD CONSTRAINT drafts_batch CHECK ((format = 'group' AND batch_size_max BETWEEN 2 AND 8) OR (format = 'one_to_one' AND batch_size_max = 1))");
  }
  if (!(await checkClause("consent_purpose")).includes("one_to_one")) {
    await c.query("ALTER TABLE consent_events DROP CONSTRAINT consent_purpose");
    await c.query("ALTER TABLE consent_events ADD CONSTRAINT consent_purpose CHECK (purpose IN ('account','live_classes','class_recording','ai_helper','portfolio_sharing','whatsapp','follow_up','one_to_one'))");
  }
  if (!(await checkClause("gigs_kind")).includes("one_to_one")) {
    await c.query("ALTER TABLE gigs DROP CONSTRAINT gigs_kind");
    await c.query("ALTER TABLE gigs ADD CONSTRAINT gigs_kind CHECK (kind IN ('live_batch','campus_session','weekend_workshop','doubt_desk','project_mentor','build_session','shadow','co_teach','own_course','one_to_one'))");
    // One-to-one gigs are online only.
    await c.query("ALTER TABLE gigs ADD CONSTRAINT gigs_one_to_one CHECK (kind <> 'one_to_one' OR mode = 'online')");
  }
  // Email sign-in (guarded): mobile becomes optional; a login email, admin-created and disabled logins.
  const [[phoneCol]] = await c.query("SELECT IS_NULLABLE AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'accounts' AND column_name = 'phone_e164'");
  if (phoneCol.n === "NO") await c.query("ALTER TABLE accounts MODIFY phone_e164 VARCHAR(16) NULL");
  if (!(await hasColumn("accounts", "login_email"))) {
    await c.query("ALTER TABLE accounts ADD COLUMN login_email VARCHAR(160) NULL, ADD COLUMN disabled_at DATETIME(3) NULL, ADD COLUMN created_by CHAR(36) NULL, ADD UNIQUE KEY accounts_login_email (login_email)");
    // Every account needs a way in: a mobile number or a login email.
    await c.query("ALTER TABLE accounts ADD CONSTRAINT accounts_identity CHECK (phone_e164 IS NOT NULL OR login_email IS NOT NULL)");
  }
  // Private calendar feeds: a salt per account so a leaked feed link can be reset.
  if (!(await hasColumn("accounts", "calendar_salt"))) await c.query("ALTER TABLE accounts ADD COLUMN calendar_salt VARCHAR(16) NULL");
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
