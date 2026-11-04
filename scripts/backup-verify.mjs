// Prove a database backup actually restores (Phase 6).
//
//   BACKUP_VERIFY_URL=mysql://user:pass@host/robokalam_restore_test \
//     node scripts/backup-verify.mjs path/to/backup.sql[.gz]
//
// 1. Refuses to run unless BACKUP_VERIFY_URL is a different database from DATABASE_URL.
// 2. Empties that scratch database and restores the backup file into it.
// 3. Compares row counts, table by table, with the live database (DATABASE_URL), if set.
// 4. Prints the BACKUP_VERIFIED_AT value to set when everything matches.
//
// Use the .sql or .sql.gz export from Hostinger (hPanel → Databases → phpMyAdmin
// export, or the automatic backups download).
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import mysql from "mysql2/promise";

const file = process.argv[2];
const scratchUrl = process.env.BACKUP_VERIFY_URL;
const liveUrl = process.env.DATABASE_URL;
if (!file || !scratchUrl) {
  console.error("Usage: BACKUP_VERIFY_URL=mysql://.../scratch_db node scripts/backup-verify.mjs backup.sql[.gz]");
  process.exit(2);
}
const dbName = (u) => { const x = new URL(u); return `${x.hostname}:${x.port || 3306}/${x.pathname.replace(/^\//, "")}`; };
if (liveUrl && dbName(liveUrl) === dbName(scratchUrl)) {
  console.error("BACKUP_VERIFY_URL points at the live database. Use an empty scratch database.");
  process.exit(2);
}

const raw = readFileSync(file);
const sql = (file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8");
if (!/CREATE TABLE/i.test(sql)) { console.error("This file has no CREATE TABLE statements. Is it a full SQL backup?"); process.exit(1); }

/**
 * Split a mysqldump / phpMyAdmin file into statements the way the mysql client
 * does: honour DELIMITER lines (used for triggers) and drop DEFINER clauses,
 * which need privileges a scratch user may not have. Dumps escape newlines
 * inside strings, so a statement ends at a line ending with the delimiter.
 */
function* statements(text) {
  let delim = ";", buf = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    const d = /^DELIMITER\s+(\S+)\s*$/i.exec(t);
    if (d) { delim = d[1]; continue; }
    if (!buf.length && (t === "" || t.startsWith("-- "))) continue;
    buf.push(line);
    if (t.endsWith(delim)) {
      const stmt = buf.join("\n").trimEnd().slice(0, -delim.length).replace(/\/\*!50017 DEFINER=[^*]*\*\/\s*/g, "").replace(/DEFINER=`[^`]*`@`[^`]*`\s*/g, "");
      buf = [];
      if (stmt.trim()) yield stmt;
    }
  }
  if (buf.join("").trim()) yield buf.join("\n");
}

const connect = (uri) => mysql.createConnection({ uri, multipleStatements: true, timezone: "Z" });
const scratch = await connect(scratchUrl);
const tables = async (c) => ((await c.query("SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name"))[0]).map((r) => r.t ?? r.TABLE_NAME);

console.log(`[backup] Restoring ${file} (${(sql.length / 1e6).toFixed(1)} MB) into ${dbName(scratchUrl)}`);
await scratch.query("SET FOREIGN_KEY_CHECKS = 0");
for (const t of await tables(scratch)) await scratch.query(`DROP TABLE \`${t}\``);
const t0 = Date.now();
for (const stmt of statements(sql)) await scratch.query(stmt);
await scratch.query("SET FOREIGN_KEY_CHECKS = 1");
console.log(`[backup] Restored in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const count = async (c, t) => Number((await c.query(`SELECT COUNT(*) AS n FROM \`${t}\``))[0][0].n);
const restored = await tables(scratch);
const must = ["accounts", "learners", "bookings", "orders", "consent_events", "schema_migrations"];
const missing = must.filter((t) => !restored.includes(t));
let problems = missing.map((t) => `missing table ${t}`);

if (liveUrl) {
  const live = await connect(liveUrl);
  for (const t of await tables(live)) {
    if (!restored.includes(t)) { problems.push(`missing table ${t}`); continue; }
    const [a, b] = [await count(live, t), await count(scratch, t)];
    // A backup is a moment in time: busy tables may have grown since. It must never have more rows, or far fewer.
    const ok = b <= a && (a - b <= Math.max(5, a * 0.05));
    console.log(`[backup] ${ok ? "ok  " : "DIFF"} ${t.padEnd(28)} live ${a}  backup ${b}`);
    if (!ok) problems.push(`${t}: live ${a}, backup ${b}`);
  }
  await live.end();
} else {
  for (const t of restored) console.log(`[backup]      ${t.padEnd(28)} ${await count(scratch, t)} rows`);
}
await scratch.end();
problems = [...new Set(problems)];

if (problems.length) {
  console.error(`[backup] FAILED: ${problems.join("; ")}`);
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
console.log(`[backup] Backup restores and matches. Set BACKUP_VERIFIED_AT=${today}`);
