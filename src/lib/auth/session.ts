import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { system, tx, type Tx } from "../db";

export const SESSION_COOKIE = "rk_sess";
const DAYS = 30;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export type Account = { id: string; role: string; phone: string; language: "en" | "te" | "hi"; displayName: string | null; adult: boolean };

/** Sign in (or sign up) after a verified OTP. Returns the raw token for the cookie. */
export async function startSession(phone: string, opts: { adultDeclared: boolean; language?: string; region?: string }) {
  const token = randomBytes(32).toString("base64url");
  const account = await system(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO accounts (phone_e164, language, region, adult_declared_at)
       VALUES ($1, $2, $3, CASE WHEN $4 THEN now() END)
       ON CONFLICT (phone_e164) DO UPDATE SET adult_declared_at = coalesce(accounts.adult_declared_at, EXCLUDED.adult_declared_at)
       RETURNING id, role, erased_at`,
      [phone, opts.language ?? "en", opts.region ?? "ts-ap", opts.adultDeclared],
    );
    if (rows[0].erased_at) throw new Error("This account was deleted at your request.");
    await c.query("INSERT INTO sessions (token_hash, account_id, expires_at) VALUES ($1, $2, now() + interval '30 days')", [hash(token), rows[0].id]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id) VALUES ($1, 'login', 'account', $2)", [rows[0].id, rows[0].id]);
    return rows[0] as { id: string; role: string };
  });
  return { token, account };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1";
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: DAYS * 86400 });
  // Non-secret hint so static marketing pages can show "Family home" instead of "Login".
  jar.set("rk_in", "1", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: DAYS * 86400 });
}

export async function currentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return system(async (c) => {
    const { rows } = await c.query(
      `SELECT a.id, a.role, a.phone_e164, a.language, a.display_name, a.adult_declared_at IS NOT NULL AS adult
       FROM sessions s JOIN accounts a ON a.id = s.account_id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now() AND a.erased_at IS NULL`,
      [hash(token)],
    );
    const r = rows[0];
    return r ? { id: r.id, role: r.role, phone: r.phone_e164, language: r.language, displayName: r.display_name, adult: r.adult } : null;
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await system((c) => c.query("UPDATE sessions SET revoked_at = now() WHERE token_hash = $1", [hash(token)]));
  jar.delete(SESSION_COOKIE);
  jar.delete("rk_in");
}

/** Run as the signed-in account so RLS scopes every query to this family. */
export function asAccount<T>(a: Account, fn: (c: Tx) => Promise<T>) {
  return tx({ accountId: a.id, role: a.role }, fn);
}
