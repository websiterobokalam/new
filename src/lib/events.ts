import { randomUUID } from "node:crypto";
import { z } from "zod";
import { audit, system, uuid, type Tx } from "./db";
import { HttpError } from "./api";
import type { Account } from "./auth/session";
import { enqueue } from "./email/outbox";
import { ageFits } from "./learn/booking";
import { currentConsents, hasRequired } from "./learn/consent";
import { SITE } from "./site";

/**
 * Events: Code Week, camps, workshops, science fairs, webinars, teacher training.
 * Free to attend. Children are registered only by a signed-in parent, and only
 * children already on the account with the required consents. In-person events
 * for children name a responsible adult at the school or centre.
 */

export const EVENT_KINDS = {
  code_week: "Ashaers Code Week", workshop: "Workshop", camp: "Camp", science_fair: "Science fair",
  webinar: "Webinar", teacher_training: "Teacher training", open_day: "Open day", other: "Event",
} as const;
export type EventKind = keyof typeof EVENT_KINDS;

const blank = z.literal("").transform(() => undefined);
export const NewEvent = z.object({
  title: z.string().trim().min(5).max(140),
  kind: z.enum(Object.keys(EVENT_KINDS) as [EventKind, ...EventKind[]]),
  audience: z.enum(["learners", "adults"]),
  summary: z.string().trim().min(10).max(300),
  description: z.union([blank, z.string().trim().max(5000)]).optional(),
  startsAt: z.string().datetime({ offset: true }),
  durationMin: z.coerce.number().int().min(15).max(10080),
  mode: z.enum(["online", "in_person"]),
  venue: z.union([blank, z.string().trim().max(200)]).optional(),
  responsibleAdult: z.union([blank, z.string().trim().max(120)]).optional(),
  city: z.union([blank, z.string().trim().max(60)]).optional(),
  capacity: z.coerce.number().int().min(1).max(5000),
  ageMin: z.union([blank, z.coerce.number().int().min(3).max(25)]).optional(),
  ageMax: z.union([blank, z.coerce.number().int().min(3).max(25)]).optional(),
}).superRefine((v, ctx) => {
  if (v.mode === "in_person" && !v.venue) ctx.addIssue({ code: "custom", path: ["venue"], message: "In-person events need a venue" });
  if (v.mode === "in_person" && v.audience === "learners" && !v.responsibleAdult) ctx.addIssue({ code: "custom", path: ["responsibleAdult"], message: "Name the responsible adult at the school or centre" });
  if (v.audience === "learners" && v.ageMin == null) ctx.addIssue({ code: "custom", path: ["ageMin"], message: "Give the youngest age" });
  if (v.ageMin != null && v.ageMax != null && v.ageMax < v.ageMin) ctx.addIssue({ code: "custom", path: ["ageMax"], message: "Oldest age must be at least the youngest" });
  if (new Date(v.startsAt).getTime() < Date.now()) ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Pick a time in the future" });
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
export const eventUrl = (slug: string) => `${SITE.url}/events/${slug}`;
export const ist = (d: Date | string) => new Date(d).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST";

export async function createEvent(ops: Account, i: z.output<typeof NewEvent>) {
  return system(async (c) => {
    const id = uuid();
    const slug = `${slugify(i.title)}-${randomUUID().slice(0, 4)}`;
    await c.query(
      `INSERT INTO events (id, slug, title, kind, audience, summary, description, starts_at, duration_min, mode, venue, responsible_adult, city, capacity, age_min, age_max, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [id, slug, i.title, i.kind, i.audience, i.summary, i.description ?? null, new Date(i.startsAt), i.durationMin, i.mode,
        i.mode === "in_person" ? i.venue ?? null : null, i.mode === "in_person" ? i.responsibleAdult ?? null : null, i.city ?? null,
        i.capacity, i.audience === "learners" ? i.ageMin ?? null : null, i.audience === "learners" ? i.ageMax ?? null : null, ops.id],
    );
    await audit(c, ops.id, "event_created", "event", id, { slug });
    return { id, slug };
  });
}

export async function publishEvent(ops: Account, id: string) {
  return system(async (c) => {
    const r = await c.query("UPDATE events SET status = 'published' WHERE id = $1 AND status = 'draft'", [id]);
    if (!r.affectedRows) throw new HttpError(409, "Only a draft can be published");
    await audit(c, ops.id, "event_published", "event", id);
  });
}

/** Cancelling tells everyone registered, with the reason. */
export async function cancelEvent(ops: Account, id: string, reason: string) {
  if (reason.trim().length < 5) throw new HttpError(422, "Write down why", { fields: { reason: "Required" } });
  return system(async (c) => {
    const ev = (await c.query("SELECT title, starts_at FROM events WHERE id = $1 AND status <> 'cancelled' FOR UPDATE", [id])).rows[0];
    if (!ev) throw new HttpError(404, "Event not found, or already cancelled");
    await c.query("UPDATE events SET status = 'cancelled', cancel_reason = $2 WHERE id = $1", [id, reason.trim()]);
    const accounts = (await c.query("SELECT DISTINCT account_id FROM event_registrations WHERE event_id = $1 AND status = 'registered'", [id])).rows;
    for (const a of accounts) await enqueue(c, { accountId: a.account_id, template: "event_cancelled", dedupe: `event-cancel:${id}:${a.account_id}`, payload: { title: ev.title, when: ist(ev.starts_at), reason: reason.trim() } });
    await audit(c, ops.id, "event_cancelled", "event", id, { reason, notified: accounts.length });
    return accounts.length;
  });
}

export type PublicEvent = {
  id: string; slug: string; title: string; kind: EventKind; audience: "learners" | "adults"; summary: string; description: string | null;
  starts_at: Date; duration_min: number; mode: "online" | "in_person"; venue: string | null; responsible_adult: string | null; city: string | null;
  capacity: number; age_min: number | null; age_max: number | null; status: string; cancel_reason: string | null; taken: number;
};
const PUBLIC_COLS = "e.id, e.slug, e.title, e.kind, e.audience, e.summary, e.description, e.starts_at, e.duration_min, e.mode, e.venue, e.responsible_adult, e.city, e.capacity, e.age_min, e.age_max, e.status, e.cancel_reason, (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS taken";

export async function upcomingEvents(): Promise<PublicEvent[]> {
  return system(async (c) => (await c.query(`SELECT ${PUBLIC_COLS} FROM events e WHERE e.status = 'published' AND e.starts_at > UTC_TIMESTAMP(3) - INTERVAL 2 HOUR ORDER BY e.starts_at LIMIT 50`)).rows.map(norm));
}
export async function eventBySlug(slug: string): Promise<PublicEvent | null> {
  return system(async (c) => {
    const r = (await c.query(`SELECT ${PUBLIC_COLS} FROM events e WHERE e.slug = $1 AND e.status IN ('published','cancelled')`, [slug])).rows[0];
    return r ? norm(r) : null;
  });
}
const norm = (r: Record<string, unknown>) => ({ ...r, taken: Number(r.taken), capacity: Number(r.capacity) }) as PublicEvent;
export const seatsLeft = (e: PublicEvent) => Math.max(0, e.capacity - e.taken);
export const isOpen = (e: PublicEvent) => e.status === "published" && new Date(e.starts_at).getTime() > Date.now() && seatsLeft(e) > 0;
export const ageLabel = (e: { age_min: number | null; age_max: number | null }) => (e.age_min == null ? "Adults" : e.age_max == null ? `Ages ${e.age_min}+` : `Ages ${e.age_min} to ${e.age_max}`);

/** Register children (learner events) or yourself (adult events). Seats are checked under a lock. */
export async function register(a: Account, slug: string, who: { learnerIds?: string[]; self?: boolean }) {
  return system(async (c) => {
    const e = (await c.query("SELECT id, title, audience, starts_at, capacity, age_min, age_max, status, mode, venue FROM events WHERE slug = $1 FOR UPDATE", [slug])).rows[0];
    if (!e || e.status !== "published") throw new HttpError(404, "Event not found");
    if (new Date(e.starts_at).getTime() <= Date.now()) throw new HttpError(409, "This event has already started");
    const targets: { who: string; learnerId: string | null; name: string }[] = [];
    if (e.audience === "adults") {
      if (!a.adult) throw new HttpError(403, "This event is for adults");
      targets.push({ who: "self", learnerId: null, name: a.displayName ?? "You" });
    } else {
      const ids = [...new Set(who.learnerIds ?? [])];
      if (!ids.length) throw new HttpError(422, "Pick at least one child", { fields: { learnerIds: "Required" } });
      for (const id of ids) {
        const l = (await c.query("SELECT id, first_name, age_band FROM learners WHERE id = $1 AND guardian_account_id = $2 AND erased_at IS NULL", [id, a.id])).rows[0];
        if (!l) throw new HttpError(404, "Child not found on your account");
        if (!hasRequired(await currentConsents(c, l.id))) throw new HttpError(409, `${l.first_name} needs the required consents first (Consent centre)`, { code: "consent" });
        if (!ageFits(l.age_band, e.age_min, e.age_max)) throw new HttpError(409, `This event is for a different age group than ${l.first_name}'s`);
        targets.push({ who: l.id, learnerId: l.id, name: l.first_name });
      }
    }
    const taken = Number((await c.query("SELECT COUNT(*) AS n FROM event_registrations WHERE event_id = $1 AND status = 'registered'", [e.id])).rows[0].n);
    const already = (await c.query("SELECT who FROM event_registrations WHERE event_id = $1 AND account_id = $2 AND status = 'registered'", [e.id, a.id])).rows.map((r) => r.who as string);
    const fresh = targets.filter((t) => !already.includes(t.who));
    if (!fresh.length) throw new HttpError(409, "Already registered");
    if (taken + fresh.length > Number(e.capacity)) throw new HttpError(409, `Only ${Math.max(0, Number(e.capacity) - taken)} place${Number(e.capacity) - taken === 1 ? "" : "s"} left`);
    for (const t of fresh) {
      await c.query(
        `INSERT INTO event_registrations (id, event_id, account_id, learner_id, who) VALUES ($1,$2,$3,$4,$5)
         ON DUPLICATE KEY UPDATE status = 'registered', cancelled_at = NULL, created_at = UTC_TIMESTAMP(3)`,
        [uuid(), e.id, a.id, t.learnerId, t.who],
      );
    }
    await audit(c, a.id, "event_registered", "event", e.id, { count: fresh.length });
    await enqueue(c, { accountId: a.id, template: "event_registered", dedupe: `event-reg:${e.id}:${a.id}:${fresh.map((t) => t.who).join(",")}`.slice(0, 160), payload: {
      title: e.title, when: ist(e.starts_at), where: e.mode === "online" ? "Online, on Robokalam" : e.venue, names: fresh.map((t) => t.name).join(", "),
      link: eventUrl(slug), calendar: `${SITE.url}/api/events/${slug}/calendar`,
    } });
    return fresh.length;
  });
}

export async function cancelRegistration(a: Account, slug: string, whoId: string) {
  return system(async (c) => {
    const r = await c.query(
      "UPDATE event_registrations r JOIN events e ON e.id = r.event_id SET r.status = 'cancelled', r.cancelled_at = UTC_TIMESTAMP(3) WHERE e.slug = $1 AND r.account_id = $2 AND r.who = $3 AND r.status = 'registered'",
      [slug, a.id, whoId],
    );
    if (!r.affectedRows) throw new HttpError(404, "Registration not found");
    await audit(c, a.id, "event_registration_cancelled", "event", slug, { who: whoId });
  });
}

/** This account's registrations for one event (first names only). */
export async function myRegistrations(c: Tx, accountId: string, eventId: string) {
  return (await c.query(
    "SELECT r.who, r.learner_id, COALESCE(l.first_name, 'You') AS name FROM event_registrations r LEFT JOIN learners l ON l.id = r.learner_id WHERE r.event_id = $1 AND r.account_id = $2 AND r.status = 'registered'",
    [eventId, accountId],
  )).rows as { who: string; learner_id: string | null; name: string }[];
}

export async function opsEvents() {
  return system(async (c) => (await c.query(`SELECT ${PUBLIC_COLS} FROM events e ORDER BY e.starts_at DESC LIMIT 100`)).rows.map(norm));
}

/** For running the event: who is coming. Children by first name and age band only. */
export async function registrationsFor(eventId: string) {
  return system(async (c) => (await c.query(
    `SELECT r.created_at, COALESCE(l.first_name, a.display_name, 'Adult') AS name, l.age_band, COALESCE(a.login_email, a.email) AS contact
     FROM event_registrations r JOIN accounts a ON a.id = r.account_id LEFT JOIN learners l ON l.id = r.learner_id
     WHERE r.event_id = $1 AND r.status = 'registered' ORDER BY r.created_at`, [eventId])).rows);
}
