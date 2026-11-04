import { createHash, randomBytes } from "node:crypto";
import { audit, system, type Tx } from "../db";
import { HttpError } from "../api";
import type { Account } from "../auth/session";
import { SITE } from "../site";
import { enqueue } from "./outbox";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function emailState(accountId: string) {
  return system(async (c) => (await c.query("SELECT email, email_verified_at, email_updates, display_name FROM accounts WHERE id = $1", [accountId])).rows[0] as
    { email: string | null; email_verified_at: Date | null; email_updates: boolean; display_name: string | null });
}

/** Inside a transaction: set an email on an account and send the confirmation link. */
export async function sendVerification(c: Tx, accountId: string, email: string, name: string) {
  const token = randomBytes(24).toString("base64url");
  await c.query("UPDATE accounts SET email = $2, email_verified_at = IF(email <=> $2, email_verified_at, NULL) WHERE id = $1", [accountId, email]);
  const verified = (await c.query("SELECT email_verified_at FROM accounts WHERE id = $1", [accountId])).rows[0]?.email_verified_at;
  if (verified) return;
  await c.query("INSERT INTO email_verifications (token_hash, account_id, email, expires_at) VALUES ($1,$2,$3, UTC_TIMESTAMP(3) + INTERVAL 48 HOUR)", [hash(token), accountId, email]);
  await enqueue(c, { accountId, template: "verify_email", payload: { name, link: `${SITE.url}/api/email/verify?token=${token}` }, dedupe: `verify:${hash(token)}` });
}

/** Save an email and send a confirmation link. Changing the address unverifies it until confirmed. */
export async function startVerification(a: Account, email: string) {
  const token = randomBytes(24).toString("base64url");
  return system(async (c) => {
    const cur = (await c.query("SELECT email, email_verified_at FROM accounts WHERE id = $1", [a.id])).rows[0];
    if (cur.email === email && cur.email_verified_at) return { already: true };
    const recent = Number((await c.query("SELECT COUNT(*) AS n FROM email_verifications WHERE account_id = $1 AND created_at > UTC_TIMESTAMP(3) - INTERVAL 1 HOUR", [a.id])).rows[0].n);
    if (recent >= 5) throw new HttpError(429, "Too many confirmation emails. Try again in an hour.");
    await c.query("UPDATE accounts SET email = $2, email_verified_at = IF(email <=> $2, email_verified_at, NULL) WHERE id = $1", [a.id, email]);
    await c.query("INSERT INTO email_verifications (token_hash, account_id, email, expires_at) VALUES ($1,$2,$3, UTC_TIMESTAMP(3) + INTERVAL 48 HOUR)", [hash(token), a.id, email]);
    await enqueue(c, { accountId: a.id, template: "verify_email", payload: { name: a.displayName ?? "there", link: `${SITE.url}/api/email/verify?token=${token}` }, dedupe: `verify:${hash(token)}` });
    await audit(c, a.id, "email_set", "account", a.id);
    return { already: false };
  });
}

export async function confirmVerification(token: string) {
  return system(async (c) => {
    const v = (await c.query("SELECT * FROM email_verifications WHERE token_hash = $1 FOR UPDATE", [hash(token)])).rows[0];
    if (!v || v.used_at || new Date(v.expires_at) < new Date()) return null;
    const r = await c.query("UPDATE accounts SET email_verified_at = UTC_TIMESTAMP(3) WHERE id = $1 AND email = $2", [v.account_id, v.email]);
    await c.query("UPDATE email_verifications SET used_at = UTC_TIMESTAMP(3) WHERE token_hash = $1", [hash(token)]);
    if (!r.affectedRows) return null; // the address was changed since
    await audit(c, v.account_id, "email_verified", "account", v.account_id);
    return v.account_id as string;
  });
}

/** Reminders and summaries on or off. One-to-one oversight emails ignore this by design. */
export async function setUpdates(accountId: string, on: boolean) {
  await system(async (c) => {
    await c.query("UPDATE accounts SET email_updates = $2 WHERE id = $1", [accountId, on]);
    await audit(c, accountId, on ? "email_updates_on" : "email_updates_off", "account", accountId);
  });
}
