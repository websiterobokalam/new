import mysql from "mysql2/promise";
import { randomUUID } from "node:crypto";

/**
 * MySQL / MariaDB access (Hostinger). One connection user, so access control
 * lives here and in the query code: every query that touches family or
 * Kalamite data filters by the signed-in account explicitly. Tests cover
 * cross-account isolation.
 *
 * Each unit of work runs in a transaction. `@rk_role` and `@rk_account` are
 * set per transaction for the optional hardening triggers (db/hardening.mjs).
 */
const g = globalThis as unknown as { __rkPool?: mysql.Pool };

export class DbUnavailable extends Error {}

/** Columns stored as JSON. MariaDB returns JSON as text, so parse by name. */
const JSON_COLS = new Set([
  "interests", "body", "evidence", "decision", "detail", "deductions", "rubric", "meta", "worlds", "languages", "prerequisites",
  "verified", "refunds", "responses", "refs",
]);

export function typeCast(field: { type: string; length: number; name: string; string(): string | null }, next: () => unknown) {
  if (field.type === "TINY" && field.length === 1) {
    const v = field.string();
    return v === null ? null : v === "1";
  }
  if (field.type === "JSON" || (JSON_COLS.has(field.name) && ["BLOB", "VAR_STRING", "STRING", "LONG_BLOB", "MEDIUM_BLOB"].includes(field.type))) {
    const v = field.string();
    if (v === null) return null;
    try { return JSON.parse(v); } catch { return v; }
  }
  return next();
}

export function pool(): mysql.Pool {
  if (!process.env.DATABASE_URL) throw new DbUnavailable("DATABASE_URL is not set");
  g.__rkPool ??= mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: Number(process.env.DB_POOL_MAX ?? 10),
    timezone: "Z",
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
    typeCast: typeCast as never,
    ssl: process.env.DATABASE_SSL === "1" ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") || undefined } : undefined,
  });
  return g.__rkPool;
}

export type Result<T = any> = { rows: T[]; affectedRows: number; insertId: number };
export type Tx = { query<T = any>(sql: string, params?: unknown[]): Promise<Result<T>> };
export type Ctx = { accountId?: string | null; role?: string; system?: boolean };

/**
 * Accepts Postgres-style $1..$n placeholders (reused freely) or `?`.
 * Objects become JSON text. Arrays become JSON too, except directly inside
 * `IN (...)`, where they expand to a list.
 */
export function toMysql(sql: string, params: unknown[] = []) {
  const out: unknown[] = [];
  const conv = (v: unknown, inList: boolean) => {
    if (v === undefined) return null;
    if (v === null || v instanceof Date || Buffer.isBuffer(v) || typeof v !== "object") return v;
    if (Array.isArray(v) && inList) return v.length ? v : [null];
    return JSON.stringify(v);
  };
  const dollar = /\$\d/.test(sql);
  let i = 0;
  const text = sql.replace(dollar ? /\$(\d+)/g : /\?/g, (m, n: string | undefined, offset: number) => {
    const inList = /IN\s*\(\s*$/i.test(sql.slice(Math.max(0, offset - 12), offset));
    out.push(conv(dollar ? params[Number(n) - 1] : params[i++], inList));
    return "?";
  });
  return { sql: text, params: out };
}

/** Map MySQL/MariaDB errors to the codes the app already handles. */
function normalise(e: unknown) {
  const err = e as Error & { errno?: number; code?: string };
  if (err.errno === 1062) err.code = "23505"; // unique violation
  else if (err.errno === 4025 || err.errno === 3819) err.code = "23514"; // CHECK constraint
  else if (err.errno === 1644) err.code = "42501"; // trigger SIGNAL: not allowed
  return err;
}

function wrap(conn: mysql.PoolConnection): Tx {
  return {
    async query(sql, params) {
      const q = toMysql(sql, params);
      try {
        const [res] = await conn.query(q.sql, q.params);
        if (Array.isArray(res)) return { rows: res as never[], affectedRows: 0, insertId: 0 };
        const h = res as mysql.ResultSetHeader;
        return { rows: [], affectedRows: h.affectedRows, insertId: Number(h.insertId) };
      } catch (e) {
        throw normalise(e);
      }
    },
  };
}

const isDeadlock = (e: unknown) => { const x = e as { errno?: number; code?: string; cause?: { errno?: number } }; return x?.errno === 1213 || x?.code === "ER_LOCK_DEADLOCK" || x?.code === "40001" || x?.cause?.errno === 1213; };

/**
 * Run fn in one transaction. InnoDB can pick a transaction as a deadlock
 * victim under concurrent writes (for example two OTP sends at once); the
 * right response is to retry the whole transaction, so we do, up to 3 times.
 * Keep non-database side effects out of fn.
 */
export async function tx<T>(ctx: Ctx, fn: (c: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await txOnce(ctx, fn);
    } catch (e) {
      if (attempt >= 3 || !isDeadlock(e)) throw e;
      await new Promise((r) => setTimeout(r, 20 * attempt + Math.random() * 30));
    }
  }
}

async function txOnce<T>(ctx: Ctx, fn: (c: Tx) => Promise<T>): Promise<T> {
  let conn: mysql.PoolConnection;
  try {
    conn = await pool().getConnection();
  } catch (e) {
    throw new DbUnavailable((e as Error).message);
  }
  try {
    await conn.query("SET time_zone = '+00:00', @rk_role = ?, @rk_account = ?", [ctx.system ? "system" : (ctx.role ?? "anon"), ctx.accountId ?? null]);
    await conn.beginTransaction();
    const out = await fn(wrap(conn));
    await conn.commit();
    return out;
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    await conn.query("SET @rk_role = NULL, @rk_account = NULL").catch(() => {});
    conn.release();
  }
}

/** Trusted server tasks only: OTP, sessions, webhooks, ledger, cross-account checks. */
export const system = <T>(fn: (c: Tx) => Promise<T>) => tx({ system: true, role: "system" }, fn);
export const anon = <T>(fn: (c: Tx) => Promise<T>) => tx({}, fn);

export const uuid = () => randomUUID();
export const json = (v: unknown) => JSON.stringify(v);

export async function audit(c: Tx, actor: string | null, action: string, entity: string, entityId?: string | null, meta: Record<string, unknown> = {}) {
  await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5)", [actor, action, entity, entityId ?? null, json(meta)]);
}

/**
 * Insert that is a no-op if the row already exists (unique key). Returns true
 * if a row was written. Unlike INSERT IGNORE, every other error still throws.
 */
export async function insertOnce(c: Tx, sql: string, params: unknown[]) {
  try {
    await c.query(sql, params);
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return false;
    throw e;
  }
}
