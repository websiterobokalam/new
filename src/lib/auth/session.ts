import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { system, tx, uuid, type Tx } from "../db";

export const SESSION_COOKIE = "rk_sess";
const DAYS = 30;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export type Account = { id: string; role: string; phone: string | null; email: string | null; language: "en" | "te" | "hi"; displayName: string | null; adult: boolean };

export class LoginRefused extends Error {}

/** Open a session for an account that has just proved it owns its phone or email. */
async function openSession(c: Tx, accountId: string, via: "phone" | "email") {
  const token = randomBytes(32).toString("base64url");
  await c.query("INSERT INTO sessions (id, token_hash, account_id, expires_at) VALUES ($1, $2, $3, $4)", [uuid(), hash(token), accountId, new Date(Date.now() + DAYS * 86400_000)]);
  await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1, 'login', 'account', $2, $3)", [accountId, accountId, { via }]);
  return token;
}

function refuseIfBlocked(r: { erased_at?: unknown; disabled_at?: unknown }) {
  if (r.erased_at) throw new LoginRefused("This account was deleted at your request.");
  if (r.disabled_at) throw new LoginRefused("This login has been switched off. Contact info@robokalam.com if you think that's a mistake.");
}

/** Sign in (or sign up) after a verified SMS code. Returns the raw token for the cookie. */
export async function startSession(phone: string, opts: { adultDeclared: boolean; language?: string; region?: string }) {
  return system(async (c) => {
    // Sign up on first login; never clear an earlier adult declaration.
    await c.query(
      `INSERT INTO accounts (id, phone_e164, language, region, adult_declared_at) VALUES ($1, $2, $3, $4, $5)
       ON DUPLICATE KEY UPDATE adult_declared_at = COALESCE(adult_declared_at, VALUES(adult_declared_at))`,
      [uuid(), phone, opts.language ?? "en", opts.region ?? "ts-ap", opts.adultDeclared ? new Date() : null],
    );
    const { rows } = await c.query("SELECT id, role, erased_at, disabled_at FROM accounts WHERE phone_e164 = $1", [phone]);
    refuseIfBlocked(rows[0]);
    const token = await openSession(c, rows[0].id, "phone");
    return { token, account: rows[0] as { id: string; role: string } };
  });
}

/**
 * The account that owns a login email, if any. A login email is claimed the
 * first time someone proves they own it. An existing account whose contact
 * email was already confirmed by link counts as the same person.
 */
export async function accountForEmail(c: Tx, email: string) {
  const own = (await c.query("SELECT id, role, erased_at, disabled_at FROM accounts WHERE login_email = $1", [email])).rows[0];
  if (own) return own as { id: string; role: string; erased_at: unknown; disabled_at: unknown };
  const confirmed = (await c.query("SELECT id, role, erased_at, disabled_at FROM accounts WHERE email = $1 AND email_verified_at IS NOT NULL AND login_email IS NULL ORDER BY created_at LIMIT 2", [email])).rows;
  // Two accounts confirmed the same email: don't guess which one; a person sorts it out.
  if (confirmed.length === 1) {
    await c.query("UPDATE accounts SET login_email = $2 WHERE id = $1 AND login_email IS NULL", [confirmed[0].id, email]);
    return confirmed[0] as { id: string; role: string; erased_at: unknown; disabled_at: unknown };
  }
  if (confirmed.length > 1) throw new LoginRefused("This email is linked to more than one account. Contact info@robokalam.com and we'll sort it out.");
  return null;
}

/**
 * Sign in (or sign up) after a verified email code. `mustExist` is for doors
 * where accounts are created for people (school staff), never by them.
 */
export async function startEmailSession(email: string, opts: { adultDeclared: boolean; language?: string; region?: string; mustExist?: (c: Tx, accountId: string | null) => Promise<void> }) {
  return system(async (c) => {
    let acc = await accountForEmail(c, email);
    if (opts.mustExist) await opts.mustExist(c, acc?.id ?? null);
    if (!acc) {
      const id = uuid();
      await c.query(
        "INSERT INTO accounts (id, login_email, email, email_verified_at, language, region, adult_declared_at) VALUES ($1, $2, $2, UTC_TIMESTAMP(3), $3, $4, $5)",
        [id, email, opts.language ?? "en", opts.region ?? "ts-ap", opts.adultDeclared ? new Date() : null],
      );
      acc = { id, role: "parent", erased_at: null, disabled_at: null };
    } else {
      refuseIfBlocked(acc);
      // Proving the code proves the address: it becomes the confirmed contact email too.
      await c.query(
        "UPDATE accounts SET email = $2, email_verified_at = COALESCE(IF(email = $2, email_verified_at, NULL), UTC_TIMESTAMP(3)), adult_declared_at = COALESCE(adult_declared_at, $3) WHERE id = $1",
        [acc.id, email, opts.adultDeclared ? new Date() : null],
      );
    }
    const token = await openSession(c, acc.id, "email");
    return { token, account: { id: acc.id, role: acc.role } };
  });
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
      `SELECT a.id, a.role, a.phone_e164, a.login_email, a.email, a.language, a.display_name, a.adult_declared_at IS NOT NULL AS adult
       FROM sessions s JOIN accounts a ON a.id = s.account_id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > UTC_TIMESTAMP(3) AND a.erased_at IS NULL AND a.disabled_at IS NULL`,
      [hash(token)],
    );
    const r = rows[0];
    return r ? { id: r.id, role: r.role, phone: r.phone_e164 ?? null, email: r.login_email ?? r.email ?? null, language: r.language, displayName: r.display_name, adult: !!r.adult } : null;
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await system((c) => c.query("UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE token_hash = $1", [hash(token)]));
  jar.delete(SESSION_COOKIE);
  jar.delete("rk_in");
}

/** Run as the signed-in account. Queries must still filter by account id explicitly. */
export function asAccount<T>(a: Account, fn: (c: Tx) => Promise<T>) {
  return tx({ accountId: a.id, role: a.role }, fn);
}
