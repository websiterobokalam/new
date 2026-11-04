import { randomInt } from "node:crypto";
import { audit, system, uuid, type Tx } from "./db";
import { HttpError } from "./api";
import type { Account } from "./auth/session";
import { enqueue } from "./email/outbox";
import { SITE } from "./site";

/**
 * Certificates Robokalam issues, checked by anyone at /validate.
 * - Course: when a learner has attended every session of a course.
 * - Kalamite: when a Kalamite goes live (all checks, Kalam Academy, child-safety and POCSO training done).
 * A learner's certificate shows their first name only. Codes are random and
 * long enough that they can't be guessed; a family shares one by choice.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const block = () => Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
export const newCode = () => `RK-${block()}-${block()}`;
/** Accepts what people type: lower case, spaces, missing dashes, O for 0 and so on. */
export function normaliseCode(input: string) {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  const body = raw.startsWith("RK") ? raw.slice(2) : raw;
  if (body.length !== 10) return null;
  return `RK-${body.slice(0, 5)}-${body.slice(5)}`;
}

export const certificateUrl = (code: string) => `${SITE.url}/certificates/${code}`;

async function insert(c: Tx, row: { kind: "course" | "kalamite"; holder: string; title: string; detail?: string; learnerId?: string; bookingId?: string; fellowId?: string; accountId: string; issuedBy: string }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    try {
      await c.query(
        "INSERT INTO certificates (id, code, kind, holder_name, title, detail, learner_id, booking_id, fellow_id, account_id, issued_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [uuid(), code, row.kind, row.holder, row.title, row.detail ?? null, row.learnerId ?? null, row.bookingId ?? null, row.fellowId ?? null, row.accountId, row.issuedBy],
      );
      return code;
    } catch (e) {
      // Already issued for this booking or Kalamite: nothing to do.
      if ((e as { code?: string }).code === "23505" && !/code/.test((e as Error).message)) return null;
      if ((e as { code?: string }).code !== "23505") throw e;
    }
  }
  throw new Error("Could not create a unique certificate code");
}

/** Issue course certificates for everyone who attended, once the batch has delivered every session. */
export async function issueForBatch(c: Tx, batchId: string, issuedBy: string) {
  const b = (await c.query(
    `SELECT co.title, co.sessions, co.kind, bt.starts_at,
            (SELECT COUNT(*) FROM gig_assignments ga JOIN gigs g ON g.id = ga.gig_id WHERE g.batch_id = bt.id AND ga.status = 'delivered') AS delivered
     FROM batches bt JOIN courses co ON co.id = bt.course_id WHERE bt.id = $1`, [batchId])).rows[0];
  if (!b || b.kind !== "course" || Number(b.delivered) < Number(b.sessions)) return 0;
  const attended = (await c.query("SELECT id FROM bookings WHERE batch_id = $1 AND status = 'attended'", [batchId])).rows;
  let n = 0;
  for (const bk of attended) if (await issueForBooking(c, bk.id, issuedBy)) n++;
  return n;
}

/** Issue the certificate for one attended booking of a course (idempotent). */
export async function issueForBooking(c: Tx, bookingId: string, issuedBy: string) {
  const r = (await c.query(
    `SELECT bk.id, bk.learner_id, bk.guardian_account_id, l.first_name, l.erased_at, co.title, co.kind, co.programme, co.sessions
     FROM bookings bk JOIN learners l ON l.id = bk.learner_id JOIN batches bt ON bt.id = bk.batch_id JOIN courses co ON co.id = bt.course_id
     WHERE bk.id = $1 AND bk.status = 'attended'`, [bookingId])).rows[0];
  if (!r || r.kind !== "course" || r.erased_at) return null;
  const code = await insert(c, {
    kind: "course", holder: r.first_name, title: r.title,
    detail: `${r.sessions} live session${Number(r.sessions) === 1 ? "" : "s"}${r.programme ? ` · ${r.programme}` : ""}`,
    learnerId: r.learner_id, bookingId, accountId: r.guardian_account_id, issuedBy,
  });
  if (code) {
    await audit(c, null, "certificate_issued", "certificate", code, { kind: "course", bookingId });
    await enqueue(c, { accountId: r.guardian_account_id, template: "certificate_issued", dedupe: `certificate:${code}`, payload: { name: r.first_name, title: r.title, code, link: certificateUrl(code) } });
  }
  return code;
}

/** The Kalamite certificate, issued when a Kalamite goes live (idempotent). */
export async function issueForFellow(c: Tx, fellowId: string, issuedBy: string) {
  const f = (await c.query("SELECT full_name, display_name FROM fellows WHERE account_id = $1 AND status = 'live'", [fellowId])).rows[0];
  if (!f) return null;
  const code = await insert(c, {
    kind: "kalamite", holder: f.full_name, title: "Certified Kalamite",
    detail: "Subject test, recorded demo, identity and background checks, references, and Kalam Academy including child safety and POCSO",
    fellowId, accountId: fellowId, issuedBy,
  });
  if (code) {
    await audit(c, null, "certificate_issued", "certificate", code, { kind: "kalamite", fellowId });
    await enqueue(c, { accountId: fellowId, template: "certificate_issued", dedupe: `certificate:${code}`, payload: { name: f.display_name, title: "Certified Kalamite", code, link: certificateUrl(code) } });
  }
  return code;
}

export type PublicCertificate = { code: string; kind: "course" | "kalamite"; holder: string; title: string; detail: string | null; issuedAt: Date; revoked: boolean; revokeReason: string | null };

/** Public check by code. Only what's printed on the certificate. */
export async function findCertificate(input: string): Promise<PublicCertificate | null> {
  const code = normaliseCode(input);
  if (!code) return null;
  return system(async (c) => {
    const r = (await c.query("SELECT code, kind, holder_name, title, detail, issued_at, revoked_at, revoke_reason FROM certificates WHERE code = $1", [code])).rows[0];
    return r ? { code: r.code, kind: r.kind, holder: r.holder_name, title: r.title, detail: r.detail, issuedAt: r.issued_at, revoked: !!r.revoked_at, revokeReason: r.revoke_reason } : null;
  });
}

/** A family's or Kalamite's own certificates. */
export async function certificatesFor(accountId: string, learnerId?: string) {
  return system(async (c) => (await c.query(
    `SELECT code, kind, holder_name, title, issued_at, revoked_at FROM certificates WHERE account_id = $1 ${learnerId ? "AND learner_id = $2" : ""} ORDER BY issued_at DESC`,
    learnerId ? [accountId, learnerId] : [accountId],
  )).rows);
}

/** Ops can revoke a certificate (for example issued in error). The public check then says so. */
export async function revokeCertificate(ops: Account, code: string, reason: string) {
  if (reason.trim().length < 5) throw new HttpError(422, "Write down why", { fields: { reason: "Required" } });
  return system(async (c) => {
    const r = await c.query("UPDATE certificates SET revoked_at = UTC_TIMESTAMP(3), revoke_reason = $2 WHERE code = $1 AND revoked_at IS NULL", [code, reason.trim()]);
    if (!r.affectedRows) throw new HttpError(404, "Certificate not found, or already revoked");
    await audit(c, ops.id, "certificate_revoked", "certificate", code, { reason });
  });
}

/** Ops issue a course certificate by hand for an attended booking (for example after an offline class). */
export async function issueByOps(ops: Account, bookingId: string) {
  return system(async (c) => {
    const code = await issueForBooking(c, bookingId, `ops:${ops.id}`);
    if (!code) {
      const existing = (await c.query("SELECT code FROM certificates WHERE booking_id = $1", [bookingId])).rows[0];
      if (existing) throw new HttpError(409, `Already issued: ${existing.code}`);
      throw new HttpError(409, "Only an attended booking of a course can get a certificate");
    }
    return code;
  });
}

export async function recentCertificates(limit = 60) {
  return system(async (c) => (await c.query("SELECT code, kind, holder_name, title, issued_at, issued_by, revoked_at, revoke_reason FROM certificates ORDER BY issued_at DESC LIMIT $1", [limit])).rows);
}
