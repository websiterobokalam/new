import { anon } from "@/lib/db";
import { handler, ok } from "@/lib/api";

/** Upcoming slots for a course, or for the Free Build Session. */
export const GET = handler(async (req) => {
  const u = new URL(req.url);
  const slug = u.searchParams.get("course") ?? "free-build-session";
  const rows = await anon(async (c) => (await c.query(
    `SELECT b.id, b.starts_at, b.duration_min, b.language, b.mode, b.location, b.educator_label
     FROM batches b JOIN courses c ON c.id = b.course_id
     WHERE c.slug = $1 AND b.starts_at > now() + INTERVAL 1 HOUR ORDER BY b.starts_at LIMIT 12`,
    [slug],
  )).rows);
  // No seat counts are shown: no scarcity signals.
  return ok({ batches: rows });
});
