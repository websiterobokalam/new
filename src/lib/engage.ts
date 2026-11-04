import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { audit, system, uuid } from "./db";
import { HttpError } from "./api";
import type { Account } from "./auth/session";
import { enqueue, enqueueStaff } from "./email/outbox";
import { optionalPhone } from "./auth/fields";
import { loginEmail } from "./auth/emailOtp";
import { SITE } from "./site";

/* ============================ Contact enquiries ============================ */

export const TOPICS = {
  parent: { label: "My child's classes", inbox: "ops" },
  school: { label: "A lab or platform for a school", inbox: "schools" },
  kalamite: { label: "Teaching as a Kalamite", inbox: "ops" },
  partner: { label: "Partnership, CSR or government", inbox: "schools" },
  media: { label: "Media or events", inbox: "ops" },
  careers: { label: "Jobs and internships", inbox: "ops" },
  other: { label: "Something else", inbox: "ops" },
} as const;
export type Topic = keyof typeof TOPICS;

export const Enquiry = z.object({
  topic: z.enum(Object.keys(TOPICS) as [Topic, ...Topic[]]),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: loginEmail,
  phone: optionalPhone,
  organisation: z.union([z.literal("").transform(() => undefined), z.string().trim().max(120)]).optional(),
  message: z.string().trim().min(10, "Tell us a little more (10 characters or more)").max(2000, "Please keep it under 2000 characters"),
  /** Adults only: children's questions come through a parent. */
  adult: z.literal(true, { message: "Please confirm you are 18 or older" }),
});

export async function submitEnquiry(i: z.output<typeof Enquiry>) {
  const ref = `RK-${randomUUID().slice(0, 8).toUpperCase()}`;
  await system(async (c) => {
    await c.query(
      "INSERT INTO enquiries (id, ref, topic, name, email, phone_e164, organisation, message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [uuid(), ref, i.topic, i.name, i.email, i.phone ?? null, i.organisation ?? null, i.message],
    );
    // To the sender: we got it. To the right team inbox: the details.
    await enqueue(c, { to: i.email, template: "enquiry_ack", dedupe: `enquiry-ack:${ref}`, payload: { name: i.name, ref, topic: TOPICS[i.topic].label } });
    await enqueueStaff(c, TOPICS[i.topic].inbox, { template: "staff_enquiry", dedupe: `enquiry-staff:${ref}`, payload: { ref, topic: TOPICS[i.topic].label, name: i.name, email: i.email, phone: i.phone ?? "", organisation: i.organisation ?? "", message: i.message } });
  });
  return ref;
}

export async function listEnquiries(status: "open" | "answered" | "spam" = "open") {
  return system(async (c) => (await c.query("SELECT id, ref, topic, name, email, phone_e164, organisation, message, status, note, created_at, answered_at FROM enquiries WHERE status = $1 ORDER BY created_at DESC LIMIT 100", [status])).rows);
}

export async function closeEnquiry(ops: Account, id: string, status: "answered" | "spam", note?: string) {
  return system(async (c) => {
    const r = await c.query("UPDATE enquiries SET status = $2, note = $3, answered_by = $4, answered_at = UTC_TIMESTAMP(3) WHERE id = $1 AND status = 'open'", [id, status, note?.trim() || null, ops.id]);
    if (!r.affectedRows) throw new HttpError(404, "Enquiry not found, or already closed");
    await audit(c, ops.id, `enquiry_${status}`, "enquiry", id, { note: note ?? null });
  });
}

/* ============================ Newsletter ============================ */
/*
 * Adults only, double opt-in: nobody is on the list until they click the link
 * we email them. Every newsletter carries a one-click unsubscribe. We never add
 * account holders or enquirers to it automatically.
 */

export const Subscribe = z.object({
  email: loginEmail,
  adult: z.literal(true, { message: "The newsletter is for adults: please confirm you are 18 or older" }),
  source: z.string().trim().max(40).optional(),
});

const token = () => randomBytes(16).toString("hex");
export const newsletterLink = (action: "confirm" | "unsubscribe", t: string) => `${SITE.url}/api/newsletter/${action}?t=${t}`;

/** Always answers the same way, so the form never reveals whether an address is on the list. */
export async function subscribe(i: z.output<typeof Subscribe>) {
  await system(async (c) => {
    const row = (await c.query("SELECT id, status, token FROM newsletter_subscribers WHERE email = $1 FOR UPDATE", [i.email])).rows[0];
    if (row?.status === "confirmed") return;
    const t = row?.token ?? token();
    if (row) await c.query("UPDATE newsletter_subscribers SET status = 'pending', unsubscribed_at = NULL, source = COALESCE($2, source) WHERE id = $1", [row.id, i.source ?? null]);
    else await c.query("INSERT INTO newsletter_subscribers (id, email, token, source) VALUES ($1,$2,$3,$4)", [uuid(), i.email, t, i.source ?? null]);
    // One confirmation email per address per day, so the form can't be used to flood someone.
    await enqueue(c, { to: i.email, template: "newsletter_confirm", dedupe: `nl-confirm:${i.email}:${new Date().toISOString().slice(0, 10)}`, payload: { link: newsletterLink("confirm", t), unsubscribe: newsletterLink("unsubscribe", t) } });
  });
}

export async function confirmSubscription(t: string) {
  if (!/^[0-9a-f]{32}$/.test(t)) return false;
  return system(async (c) => {
    const r = await c.query("UPDATE newsletter_subscribers SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, UTC_TIMESTAMP(3)) WHERE token = $1 AND status IN ('pending','confirmed')", [t]);
    return r.affectedRows > 0;
  });
}

export async function unsubscribe(t: string) {
  if (!/^[0-9a-f]{32}$/.test(t)) return false;
  return system(async (c) => {
    const r = await c.query("UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed_at = UTC_TIMESTAMP(3) WHERE token = $1", [t]);
    return r.affectedRows > 0;
  });
}

export async function newsletterStats() {
  return system(async (c) => (await c.query("SELECT status, COUNT(*) AS n FROM newsletter_subscribers GROUP BY status")).rows as { status: string; n: number }[]);
}

/** Confirmed subscribers, with their own unsubscribe link, for whichever tool sends the newsletter. */
export async function confirmedSubscribers() {
  return system(async (c) => (await c.query("SELECT email, confirmed_at, token FROM newsletter_subscribers WHERE status = 'confirmed' ORDER BY confirmed_at")).rows);
}
