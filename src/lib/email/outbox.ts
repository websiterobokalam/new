import { createHmac } from "node:crypto";
import { system, uuid, type Tx } from "../db";
import { SITE } from "../site";
import { categoryOf, render, type TemplateId } from "./templates";
import { transport } from "./transport";

/**
 * The outbox. An email is written in the same transaction as the action that
 * caused it, so it is never lost and never sent for an action that rolled
 * back. A dedupe key makes every send idempotent. The drain loop sends with
 * retries and backoff.
 */

const MAX_ATTEMPTS = 6;

export const prefsToken = (accountId: string) => createHmac("sha256", process.env.SESSION_SECRET ?? "dev").update(`email-prefs:${accountId}`).digest("base64url").slice(0, 32);
export const unsubscribeUrl = (accountId: string) => `${SITE.url}/api/email/prefs?a=${accountId}&t=${prefsToken(accountId)}&updates=0`;

type Enqueue = { template: TemplateId; payload: Record<string, unknown>; dedupe: string; sendAfter?: Date } & ({ accountId: string; to?: undefined } | { to: string; accountId?: string | null });

/** Queue an email. To an account: only to a verified address, and "updates" respect the person's choice. */
export async function enqueue(c: Tx, e: Enqueue): Promise<boolean> {
  const category = categoryOf(e.template);
  let to = e.to;
  if (!to && e.accountId) {
    const a = (await c.query("SELECT email, email_verified_at, email_updates, erased_at FROM accounts WHERE id = $1", [e.accountId])).rows[0];
    if (!a || a.erased_at || !a.email) return false;
    // Only the verification email itself may go to an unverified address.
    if (!a.email_verified_at && e.template !== "verify_email") return false;
    if (category === "updates" && !a.email_updates) return false;
    to = a.email;
  }
  if (!to) return false;
  const id = uuid();
  try {
    await c.query(
      "INSERT INTO email_outbox (id, account_id, to_email, template, category, payload, dedupe_key, send_after) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [id, e.accountId ?? null, to, e.template, category, e.payload, e.dedupe.slice(0, 160), e.sendAfter ?? new Date()],
    );
  } catch (err) {
    if ((err as { code?: string }).code === "23505") return false; // already queued: idempotent
    throw err;
  }
  kick();
  return true;
}

/** Team inboxes come from settings. Unset = no team email (the app still shows everything). */
export async function enqueueStaff(c: Tx, inbox: "ops" | "safeguarding" | "schools", e: Omit<Enqueue, "to" | "accountId">) {
  const to = { ops: process.env.OPS_EMAIL, safeguarding: process.env.SAFEGUARDING_EMAIL || process.env.OPS_EMAIL, schools: process.env.SCHOOLS_EMAIL || process.env.OPS_EMAIL }[inbox];
  if (!to) return false;
  return enqueue(c, { ...e, to });
}

let timer: ReturnType<typeof setTimeout> | null = null;
/** Send soon after the current transaction commits. */
export function kick() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; drain().catch((e) => console.error("email drain", (e as Error).message)); }, 400);
}

let draining = false;
export async function drain(limit = 25) {
  const t = transport();
  if (!t || draining) return { sent: 0, failed: 0 };
  draining = true;
  let sent = 0, failed = 0;
  try {
    const due = await system(async (c) => {
      const rows = (await c.query(
        "SELECT * FROM email_outbox WHERE status = 'queued' AND send_after <= UTC_TIMESTAMP(3) ORDER BY send_after LIMIT $1 FOR UPDATE SKIP LOCKED", [limit])).rows;
      // Claim them: push send_after forward so another worker won't pick them up mid-send.
      if (rows.length) await c.query("UPDATE email_outbox SET attempts = attempts + 1, send_after = UTC_TIMESTAMP(3) + INTERVAL 2 MINUTE WHERE id IN ($1)", [rows.map((r) => r.id)]);
      return rows;
    });
    for (const m of due) {
      const r = render(m.template, m.payload, { unsubscribe: m.account_id ? unsubscribeUrl(m.account_id) : undefined });
      try {
        const res = await t.send({ to: m.to_email, subject: r.subject, html: r.html, text: r.text, headers: m.category === "updates" && m.account_id ? { "List-Unsubscribe": `<${unsubscribeUrl(m.account_id)}>` } : undefined });
        await system((c) => c.query("UPDATE email_outbox SET status = 'sent', sent_at = UTC_TIMESTAMP(3), subject = $2, body_text = $3, provider_id = $4, last_error = NULL WHERE id = $1", [m.id, r.subject, r.text, res.id]));
        sent++;
      } catch (e) {
        const attempts = m.attempts + 1;
        const giveUp = attempts >= MAX_ATTEMPTS;
        // Backoff: 1, 2, 4, 8, 16 minutes.
        await system((c) => c.query(
          "UPDATE email_outbox SET status = $2, last_error = $3, send_after = UTC_TIMESTAMP(3) + INTERVAL $4 MINUTE WHERE id = $1",
          [m.id, giveUp ? "failed" : "queued", String((e as Error).message).slice(0, 500), 2 ** (attempts - 1)]));
        failed++;
      }
    }
  } finally {
    draining = false;
  }
  return { sent, failed };
}

/** Ops: send a failed email again. */
export async function retry(id: string) {
  await system((c) => c.query("UPDATE email_outbox SET status = 'queued', attempts = 0, send_after = UTC_TIMESTAMP(3) WHERE id = $1 AND status = 'failed'", [id]));
  kick();
}
