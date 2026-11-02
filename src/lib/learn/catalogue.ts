import { anon } from "../db";

export type CourseCard = {
  id: string; slug: string; title: string; world: string; programme: string | null; age_min: number; age_max: number | null; outcome: string;
  batch_size_max: number; sessions: number; kit: string | null; fee_paise: number | null; fee_approved: boolean; sample: boolean;
  next_start: string | null; languages: string[]; modes: string[]; educator: string | null;
};

export type Filters = { age?: string; world?: string; lang?: string; mode?: string; time?: string };
const BAND: Record<string, [number, number]> = { "6-8": [6, 8], "9-11": [9, 11], "12-14": [12, 14], "15-17": [15, 17], "18+": [18, 99] };
const TIME: Record<string, [number, number]> = { morning: [6, 12], afternoon: [12, 17], evening: [17, 22] };

/** Published courses with their upcoming batches, filtered server-side. */
export async function listCourses(f: Filters): Promise<CourseCard[]> {
  const where: string[] = ["c.published", "c.kind = 'course'"];
  const p: unknown[] = [];
  if (f.world) { p.push(f.world); where.push(`c.world = $${p.length}`); }
  if (f.age && BAND[f.age]) { p.push(BAND[f.age][1]); where.push(`c.age_min <= $${p.length}`); p.push(BAND[f.age][0]); where.push(`(c.age_max IS NULL OR c.age_max >= $${p.length})`); }
  const bw: string[] = ["b.course_id = c.id", "b.starts_at > now()"];
  if (f.lang) { p.push(f.lang); bw.push(`b.language = $${p.length}`); }
  if (f.mode) { p.push(f.mode); bw.push(`b.mode = $${p.length}`); }
  if (f.time && TIME[f.time]) { p.push(TIME[f.time][0]); bw.push(`extract(hour from b.starts_at AT TIME ZONE 'Asia/Kolkata') >= $${p.length}`); p.push(TIME[f.time][1]); bw.push(`extract(hour from b.starts_at AT TIME ZONE 'Asia/Kolkata') < $${p.length}`); }
  const batchFilter = f.lang || f.mode || f.time ? `AND EXISTS (SELECT 1 FROM batches b WHERE ${bw.join(" AND ")})` : "";
  return anon(async (c) => (await c.query(
    `SELECT c.id, c.slug, c.title, c.world, c.programme, c.age_min, c.age_max, c.outcome, c.batch_size_max, c.sessions, c.kit, c.fee_paise, c.fee_approved, c.sample,
       (SELECT min(b.starts_at) FROM batches b WHERE ${bw.join(" AND ")}) AS next_start,
       coalesce((SELECT array_agg(DISTINCT b.language) FROM batches b WHERE b.course_id = c.id AND b.starts_at > now()), '{}') AS languages,
       coalesce((SELECT array_agg(DISTINCT b.mode) FROM batches b WHERE b.course_id = c.id AND b.starts_at > now()), '{}') AS modes,
       (SELECT b.educator_label FROM batches b WHERE b.course_id = c.id AND b.starts_at > now() ORDER BY b.starts_at LIMIT 1) AS educator
     FROM courses c WHERE ${where.join(" AND ")} ${batchFilter} ORDER BY c.age_min, c.title`,
    p,
  )).rows);
}

export async function getCourse(slug: string) {
  return anon(async (c) => {
    const course = (await c.query("SELECT * FROM courses WHERE slug = $1 AND published AND kind = 'course'", [slug])).rows[0];
    if (!course) return null;
    const batches = (await c.query("SELECT id, starts_at, duration_min, language, mode, location, educator_label FROM batches WHERE course_id = $1 AND starts_at > now() ORDER BY starts_at LIMIT 20", [course.id])).rows;
    return { course, batches };
  });
}
