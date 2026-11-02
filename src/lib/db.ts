import pg from "pg";

/**
 * Postgres access. The app connects as rk_app (not the table owner), so
 * row-level security applies to every query. Each unit of work runs in a
 * transaction with its request context set via set_config(..., true).
 */
const g = globalThis as unknown as { __rkPool?: pg.Pool };

export function pool(): pg.Pool {
  if (!process.env.DATABASE_URL) throw new DbUnavailable("DATABASE_URL is not set");
  g.__rkPool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_MAX ?? 10), idleTimeoutMillis: 30_000 });
  return g.__rkPool;
}

export class DbUnavailable extends Error {}

export type Ctx = { accountId?: string | null; role?: string; system?: boolean };
export type Tx = pg.PoolClient;

export async function tx<T>(ctx: Ctx, fn: (c: Tx) => Promise<T>): Promise<T> {
  let c: pg.PoolClient;
  try {
    c = await pool().connect();
  } catch (e) {
    throw new DbUnavailable((e as Error).message);
  }
  try {
    await c.query("BEGIN");
    await c.query("SELECT set_config('rk.account_id', $1, true), set_config('rk.role', $2, true), set_config('rk.system', $3, true)", [
      ctx.accountId ?? "",
      ctx.role ?? "anon",
      ctx.system ? "on" : "",
    ]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

/** Trusted server tasks only: OTP, sessions, webhooks, ledger. */
export const system = <T>(fn: (c: Tx) => Promise<T>) => tx({ system: true, role: "system" }, fn);
export const anon = <T>(fn: (c: Tx) => Promise<T>) => tx({}, fn);

export async function audit(c: Tx, actor: string | null, action: string, entity: string, entityId?: string | null, meta: Record<string, unknown> = {}) {
  await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5)", [actor, action, entity, entityId ?? null, meta]);
}
