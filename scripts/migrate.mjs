// Applies db/migrations/*.sql in order (as the owner role), then seeds.
// Usage: DATABASE_OWNER_URL=postgres://... node scripts/migrate.mjs [--sample] [--reset]
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const url = process.env.DATABASE_OWNER_URL;
if (!url) throw new Error("DATABASE_OWNER_URL is required");
const sample = process.argv.includes("--sample");
const reset = process.argv.includes("--reset");
if (sample && process.env.NODE_ENV === "production" && process.env.ALLOW_SAMPLE_DATA !== "1") throw new Error("Refusing to load sample data in production");

const root = new URL("..", import.meta.url).pathname;
const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  if (reset) {
    await c.query("DROP OWNED BY rk_owner CASCADE");
  }
  await c.query("CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const done = new Set((await c.query("SELECT id FROM schema_migrations")).rows.map((r) => r.id));
  for (const f of readdirSync(join(root, "db/migrations")).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    const sql = readFileSync(join(root, "db/migrations", f), "utf8").replace(/CREATE TABLE schema_migrations[^;]*;/, "");
    await c.query("BEGIN");
    await c.query(sql);
    await c.query("INSERT INTO schema_migrations (id) VALUES ($1)", [f]);
    await c.query("COMMIT");
    console.log("applied", f);
  }
  // consent notices (hash pins the exact text a guardian agreed to)
  const notices = JSON.parse(readFileSync(join(root, "db/seed/notice-learner.json"), "utf8"));
  for (const lang of ["en", "te", "hi"]) {
    const n = notices[lang];
    const body = { items: n.items, rights: n.rights, grievance: n.grievance };
    const sha = createHash("sha256").update(JSON.stringify({ title: n.title, ...body })).digest("hex");
    await c.query("INSERT INTO consent_notices (id, language, title, body, sha256) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING", [n.id, lang, n.title, body, sha]);
  }
  // Fellow terms and code of conduct: the first versions are effective at once;
  // any later version must give 14 days' notice (enforced by a CHECK).
  if (done.has("002_fellows.sql") || (await c.query("SELECT to_regclass('terms_versions') AS t")).rows[0].t) {
    const terms = JSON.parse(readFileSync(join(root, "db/seed/fellow-terms.json"), "utf8"));
    for (const kind of ["fellow_terms", "code_of_conduct"]) {
      for (const lang of ["en", "te", "hi"]) {
        const t = terms[kind][lang];
        const id = `${kind.replace("_", "-")}-2026-11-${lang}`;
        const sha = createHash("sha256").update(JSON.stringify(t)).digest("hex");
        await c.query("INSERT INTO terms_versions (id, kind, language, title, body, sha256, initial, effective_at) VALUES ($1,$2,$3,$4,$5,$6,true,now()) ON CONFLICT (id) DO NOTHING", [id, kind, lang, t.title, { sections: t.sections }, sha]);
      }
    }
  }
  await c.query(readFileSync(join(root, "db/seed/base.sql"), "utf8"));
  if (sample) { await c.query(readFileSync(join(root, "db/seed/sample.sql"), "utf8")); console.log("sample fixtures loaded"); }
  console.log("ok");
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await c.end();
}
