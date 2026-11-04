import { audit, system, uuid, type Tx } from "../db";
import { HttpError } from "../api";
import type { Account } from "../auth/session";
import { requireMarketOpen } from "./gate";

/** More cities and colleges (Phase 5). A city takes Fellows only once a person opens it. */

export const citySlug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

export type City = { slug: string; name: string; status: "pilot" | "open" | "waitlist"; max_live: number };

export async function cityFor(c: Tx, name: string): Promise<City | null> {
  return (await c.query("SELECT slug, name, status, max_live FROM cities WHERE slug = $1", [citySlug(name)])).rows[0] ?? null;
}

/** Applications from an unknown city put it on the list as waitlisted, so ops can see demand. */
export async function noteCity(c: Tx, name: string) {
  await c.query("INSERT IGNORE INTO cities (slug, name, status) VALUES ($1,$2,'waitlist')", [citySlug(name), name.trim().replace(/\b\w/g, (x) => x.toUpperCase())]);
  return cityFor(c, name);
}

export const takesFellows = (city: City | null) => !!city && (city.status === "pilot" || city.status === "open");

export async function citiesWithDemand() {
  return system(async (c) => (await c.query(
    `SELECT ci.*, (SELECT COUNT(*) FROM fellows f WHERE LOWER(TRIM(f.city)) = ci.slug AND f.status = 'live') AS live,
            (SELECT COUNT(*) FROM fellows f WHERE LOWER(TRIM(f.city)) = ci.slug AND f.status = 'waitlisted') AS waitlisted,
            (SELECT COUNT(*) FROM colleges co WHERE co.city_slug = ci.slug) AS colleges
     FROM cities ci ORDER BY ci.status = 'waitlist', ci.name`)).rows);
}

/** Opening a city is growth: only while the marketplace is open. Waitlisted applicants there move to vetting. */
export async function openCity(ops: Account, name: string, maxLive: number, note: string) {
  if (note.trim().length < 5) throw new HttpError(422, "Write down why", { fields: { note: "Required" } });
  await requireMarketOpen();
  return system(async (c) => {
    const city = await noteCity(c, name);
    if (city!.status !== "waitlist") throw new HttpError(409, `${city!.name} already takes Fellows`);
    await c.query("UPDATE cities SET status = 'open', max_live = $2, opened_by = $3, opened_at = UTC_TIMESTAMP(3) WHERE slug = $1", [city!.slug, maxLive, ops.id]);
    const moved = await c.query("UPDATE fellows SET status = 'vetting' WHERE LOWER(TRIM(city)) = $1 AND status = 'waitlisted'", [city!.slug]);
    await audit(c, ops.id, "city_opened", "city", city!.slug, { maxLive, note, movedFromWaitlist: moved.affectedRows });
    return { moved: moved.affectedRows };
  });
}

export async function setCityCap(ops: Account, slug: string, maxLive: number) {
  return system(async (c) => {
    const r = await c.query("UPDATE cities SET max_live = $2 WHERE slug = $1 AND status <> 'waitlist'", [slug, maxLive]);
    if (!r.affectedRows) throw new HttpError(404, "City not found or not open");
    await audit(c, ops.id, "city_cap_set", "city", slug, { maxLive });
  });
}

export async function addCollege(ops: Account, i: { name: string; city: string; emailDomain?: string }) {
  return system(async (c) => {
    const city = await noteCity(c, i.city);
    const id = uuid();
    await c.query("INSERT INTO colleges (id, name, city_slug, email_domain, created_by) VALUES ($1,$2,$3,$4,$5)", [id, i.name.trim(), city!.slug, i.emailDomain?.toLowerCase().replace(/^@/, "") || null, ops.id])
      .catch((e) => { if (e.code === "23505") throw new HttpError(409, "That college is already listed for this city"); throw e; });
    await audit(c, ops.id, "college_added", "college", id, { city: city!.slug });
    return id;
  });
}

export async function collegesIn(cityName?: string) {
  return system(async (c) => (await c.query(
    `SELECT co.id, co.name, co.email_domain, ci.name AS city FROM colleges co JOIN cities ci ON ci.slug = co.city_slug ${cityName ? "WHERE co.city_slug = $1" : ""} ORDER BY ci.name, co.name`,
    cityName ? [citySlug(cityName)] : [])).rows);
}

/** True when a college email's domain matches a listed college (a hint for reviewers, not verification). */
export async function collegeDomainMatches(c: Tx, email: string | null | undefined) {
  const domain = email?.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !!(await c.query("SELECT 1 FROM colleges WHERE email_domain = $1", [domain])).rows[0];
}
