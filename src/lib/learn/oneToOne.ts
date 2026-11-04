import { createHash } from "node:crypto";
import type { Tx } from "../db";
import { HttpError } from "../api";
import { TIERS } from "../fellows/gigs";

/**
 * Parent-supervised one-to-one classes for under-18s. Online only, recorded,
 * with the parent's specific consent, a verified email so every notice
 * reaches them, and a per-booking acknowledgement of how oversight works.
 */

/** What the parent confirms before each one-to-one booking. Stored as a hash with the booking. */
export const ONE_TO_ONE_ACK = [
  "Every session is online on Robokalam and recorded. The recording is kept 30 days.",
  "I'll get an email before every session and the educator's written summary after it.",
  "I can join or watch any session from my account, at any time, without telling anyone first.",
  "The educator can't contact my child outside Robokalam. I'll report anything that feels wrong.",
  "I can stop one-to-one classes at any time by withdrawing that consent.",
] as const;
export const ONE_TO_ONE_ACK_SHA = createHash("sha256").update(ONE_TO_ONE_ACK.join("\n")).digest("hex");

/** The code of conduct versions that contain the one-to-one rules (this one, and the later Kalamite versions). */
export const ONE_TO_ONE_TERMS_PREFIX = "code-of-conduct-2026-12-";

export async function requireVerifiedEmailForOneToOne(c: Tx, accountId: string) {
  const a = (await c.query("SELECT email_verified_at FROM accounts WHERE id = $1", [accountId])).rows[0];
  if (!a?.email_verified_at) throw new HttpError(409, "One-to-one classes need a confirmed email, so every session notice reaches you. Add it in Email settings first.", { needsEmail: true });
}

export async function oneToOneConsented(c: Tx, learnerId: string) {
  const r = (await c.query("SELECT granted FROM consent_events WHERE learner_id = $1 AND purpose = 'one_to_one' ORDER BY id DESC LIMIT 1", [learnerId])).rows[0];
  return !!r?.granted;
}

/** Booking a one-to-one class: consent for this child, a verified email, and today's acknowledgement. */
export async function checkOneToOneBooking(c: Tx, guardianId: string, learnerId: string, ack: boolean | undefined) {
  if (!(await oneToOneConsented(c, learnerId))) throw new HttpError(409, "Turn on one-to-one classes for this child in the Consent centre first.", { needsConsent: true });
  await requireVerifiedEmailForOneToOne(c, guardianId);
  if (!ack) throw new HttpError(422, "Please read and confirm how one-to-one classes work", { fields: { ack: "Required" } });
}

/** Who may teach a child one-to-one: experienced, under the new code of conduct, nothing open against them. */
export async function oneToOneTeacherCheck(c: Tx, fellowId: string): Promise<string | null> {
  const f = (await c.query("SELECT status, tier FROM fellows WHERE account_id = $1", [fellowId])).rows[0];
  if (!f || f.status !== "live") return "Available once you go live";
  if (TIERS.indexOf(f.tier) < TIERS.indexOf("fellow")) return "One-to-one classes need the Kalamite level or above";
  const accepted = (await c.query(
    "SELECT 1 FROM terms_acceptances ta JOIN terms_versions tv ON tv.id = ta.terms_id WHERE ta.fellow_id = $1 AND (tv.id LIKE $2 OR tv.id LIKE 'kalamite-code-%') AND tv.effective_at <= UTC_TIMESTAMP(3)",
    [fellowId, `${ONE_TO_ONE_TERMS_PREFIX}%`])).rows[0];
  if (!accepted) return "Accept the updated code of conduct (one-to-one rules) first";
  const open = (await c.query(
    `SELECT (SELECT COUNT(*) FROM quality_flags WHERE fellow_id = $1 AND subject_type = 'fellow' AND severity = 'high' AND status = 'open')
          + (SELECT COUNT(*) FROM removal_cases WHERE fellow_id = $1 AND status = 'notice') AS n`, [fellowId])).rows[0].n;
  if (Number(open)) return "Not while a serious flag or case is open";
  return null;
}
