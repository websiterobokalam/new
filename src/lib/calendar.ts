import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "./site";
import type { Tx } from "./db";

/**
 * Calendar files (iCalendar, RFC 5545) for classes and gigs: "Add to calendar"
 * for one event, and a private feed people can subscribe to in Google, Apple or
 * Outlook calendar. Feeds carry only what the person already sees in their own
 * account, behind a signed link they can reset.
 */

export type CalEvent = { uid: string; start: Date; minutes: number; title: string; description?: string; location?: string; url?: string };

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Lines longer than 75 octets are folded with CRLF + space (RFC 5545 §3.1). */
function fold(line: string) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch, "utf8") > (out.length ? 74 : 75)) { out.push(cur); cur = ""; }
    cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function ics(events: CalEvent[], opts: { name?: string; now?: Date } = {}) {
  const now = stamp(opts.now ?? new Date());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Robokalam//Classes//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  if (opts.name) lines.push(`X-WR-CALNAME:${esc(opts.name)}`, "X-WR-TIMEZONE:Asia/Kolkata", "REFRESH-INTERVAL;VALUE=DURATION:PT1H");
  for (const e of events) {
    const end = new Date(e.start.getTime() + e.minutes * 60_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@robokalam.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(e.start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      ...(e.url ? [`URL:${e.url}`] : []),
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, "TRIGGER:-PT30M", "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function icsResponse(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${filename.replace(/[^a-z0-9.-]/gi, "-")}"`,
      "cache-control": "private, no-store",
    },
  });
}

/* ---------------- Private feed links ---------------- */

const secret = () => process.env.SESSION_SECRET ?? "dev-only-secret";
/** The feed token changes when the account's feed is reset (salt stored on the account). */
export function feedToken(accountId: string, salt: string | null) {
  return createHmac("sha256", secret()).update(`calendar:${accountId}:${salt ?? ""}`).digest("base64url").slice(0, 32);
}
export function checkFeedToken(accountId: string, salt: string | null, token: string) {
  const a = Buffer.from(feedToken(accountId, salt)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const feedUrl = (accountId: string, salt: string | null) => `${SITE.url}/api/calendar/${accountId}/${feedToken(accountId, salt)}.ics`;
/** webcal:// opens the "subscribe" dialog in Apple and Outlook calendars. */
export const webcalUrl = (accountId: string, salt: string | null) => feedUrl(accountId, salt).replace(/^https?:\/\//, "webcal://");
export const googleSubscribeUrl = (accountId: string, salt: string | null) => `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl(accountId, salt))}`;

/* ---------------- Events from the database ---------------- */

/** A family's classes: upcoming, plus the last week. */
export async function familyEvents(c: Tx, accountId: string, bookingId?: string): Promise<CalEvent[]> {
  const rows = (await c.query(
    `SELECT bk.id, l.first_name, co.title, b.starts_at, b.duration_min, b.mode, b.location, COALESCE(fp.display_name, b.educator_label) AS educator
     FROM bookings bk JOIN learners l ON l.id = bk.learner_id JOIN batches b ON b.id = bk.batch_id JOIN courses co ON co.id = b.course_id
     LEFT JOIN fellows fp ON fp.account_id = b.educator_fellow_id
     WHERE bk.guardian_account_id = $1 AND bk.status IN ('confirmed','attended') AND l.erased_at IS NULL
       ${bookingId ? "AND bk.id = $2" : "AND b.starts_at > UTC_TIMESTAMP(3) - INTERVAL 7 DAY"}
     ORDER BY b.starts_at LIMIT 200`,
    bookingId ? [accountId, bookingId] : [accountId],
  )).rows;
  return rows.map((r) => ({
    uid: `booking-${r.id}`, start: new Date(r.starts_at), minutes: Number(r.duration_min),
    title: `${r.first_name}: ${r.title}`,
    description: [`Robokalam class for ${r.first_name}.`, r.educator ? `Educator: ${r.educator}.` : "", r.mode === "online" ? "Join from your family home on Robokalam. Classes are recorded for safety." : "A responsible adult from the school or centre is present."].filter(Boolean).join(" "),
    location: r.mode === "online" ? "Online, on Robokalam" : r.location ?? undefined,
    url: `${SITE.url}/app`,
  }));
}

/** A Kalamite's accepted gigs: upcoming, plus the last week. */
export async function fellowEvents(c: Tx, accountId: string, gigId?: string): Promise<CalEvent[]> {
  const rows = (await c.query(
    `SELECT g.id, g.title, g.kind, g.starts_at, g.duration_min, g.mode, g.location, g.responsible_adult
     FROM gig_assignments ga JOIN gigs g ON g.id = ga.gig_id
     WHERE ga.fellow_id = $1 AND ga.status IN ('accepted','delivered') AND g.status <> 'cancelled'
       ${gigId ? "AND g.id = $2" : "AND g.starts_at > UTC_TIMESTAMP(3) - INTERVAL 7 DAY"}
     ORDER BY g.starts_at LIMIT 200`,
    gigId ? [accountId, gigId] : [accountId],
  )).rows;
  return rows.map((r) => ({
    uid: `gig-${r.id}`, start: new Date(r.starts_at), minutes: Number(r.duration_min),
    title: `Robokalam gig: ${r.title}`,
    description: r.mode === "online" ? "Teach on Robokalam (recorded). Keep all contact on the platform." : `In person. Responsible adult: ${r.responsible_adult ?? "named on the gig"}. No contact outside Robokalam.`,
    location: r.mode === "online" ? "Online, on Robokalam" : r.location ?? undefined,
    url: `${SITE.url}/app/fellow`,
  }));
}
