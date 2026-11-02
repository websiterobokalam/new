import { system, type Tx } from "../db";
import { asAccount, type Account } from "../auth/session";
import { FellowError, requireFellow, STEPS, type Fellow, type Step } from "./core";
import { addEarning, deductionsFor, rateFor, weekStartIST, type DeductionLine } from "./pay";
import { post } from "../ledger";

export const TIERS = ["apprentice", "fellow", "senior", "lead"] as const;
const tierRank = (t: string) => TIERS.indexOf(t as (typeof TIERS)[number]);

/** Before any contact with a child, every check except shadow/co-teach must be passed. */
const PRE_CONTACT: Step[] = STEPS.filter((s) => s !== "shadow" && s !== "co_teach");

export type Gig = {
  id: string; kind: string; title: string; world: string; language: string; starts_at: string; duration_min: number; mode: string; location: string | null;
  responsible_adult: string | null; city: string; pay_paise: number; rate_sample: boolean; seats: number; min_tier: string; status: string; batch_id: string | null;
  lesson_plan: string | null; kit_list: string | null;
};
export type BoardItem = Gig & { deductions: DeductionLine[]; net_paise: number; canAccept: boolean; reason: string | null; why: string; myStatus: string | null };

/**
 * THE MATCHING FORMULA (published to Fellows, see /app/fellow/growth):
 *   1. Show open gigs the Fellow is eligible for: tier, a language they teach in,
 *      and for in-person gigs their city.
 *   2. Order by: gigs in one of the Fellow's worlds first, then earliest start.
 * Inputs are only the gig and the Fellow's stated worlds, languages, city and
 * tier. No protected characteristics are collected or used, and declines are
 * never an input.
 */
export function orderBoard<T extends { world: string; starts_at: string }>(gigs: T[], worlds: string[]): T[] {
  return [...gigs].sort((a, b) => Number(worlds.includes(b.world)) - Number(worlds.includes(a.world)) || +new Date(a.starts_at) - +new Date(b.starts_at));
}

export function eligible(g: Pick<Gig, "min_tier" | "language" | "mode" | "city">, f: Pick<Fellow, "tier" | "languages" | "city">) {
  if (tierRank(f.tier) < tierRank(g.min_tier)) return false;
  if (!f.languages.includes(g.language)) return false;
  if (g.mode === "offline" && g.city.toLowerCase() !== f.city.toLowerCase()) return false;
  return true;
}

async function weekMinutes(c: Tx, fellowId: string, at: Date) {
  const start = weekStartIST(at);
  const { rows } = await c.query(
    `SELECT coalesce(sum(g.duration_min),0)::int AS m FROM gig_assignments ga JOIN gigs g ON g.id = ga.gig_id
     WHERE ga.fellow_id = $1 AND ga.status IN ('accepted','delivered') AND g.starts_at >= $2 AND g.starts_at < $2::timestamptz + interval '7 days'`,
    [fellowId, start],
  );
  return rows[0].m as number;
}

function onboardingKind(kind: string) {
  return kind === "shadow" || kind === "co_teach";
}

/** Why a Fellow can or cannot accept, in plain words. */
async function acceptability(c: Tx, f: Fellow, steps: Record<Step, { status: string }>, g: Gig): Promise<string | null> {
  if (f.exam_mode_until && new Date(f.exam_mode_until) >= new Date(new Date().toDateString())) return "Exam Mode is on";
  if (onboardingKind(g.kind)) {
    if (!PRE_CONTACT.every((s) => steps[s].status === "passed")) return "Finish your checks, Academy and terms first";
    if (g.kind === "co_teach" && steps.shadow.status !== "passed") return "Shadow a class first";
  } else if (f.status !== "live") return "Available once you go live";
  const used = await weekMinutes(c, f.account_id, new Date(g.starts_at));
  if (used + g.duration_min > f.weekly_cap_hours * 60) return `Over your ${f.weekly_cap_hours}-hour weekly cap`;
  const clash = await c.query(
    `SELECT 1 FROM gig_assignments ga JOIN gigs x ON x.id = ga.gig_id WHERE ga.fellow_id = $1 AND ga.status = 'accepted'
     AND tstzrange(x.starts_at, x.starts_at + x.duration_min * interval '1 minute') && tstzrange($2::timestamptz, $2::timestamptz + $3 * interval '1 minute')`,
    [f.account_id, g.starts_at, g.duration_min],
  );
  if (clash.rows[0]) return "Clashes with a gig you accepted";
  return null;
}

export async function board(a: Account): Promise<{ items: BoardItem[]; fellow: Fellow; weekMinutes: number }> {
  const { fellow, steps } = await requireFellow(a);
  return asAccount(a, async (c) => {
    const gigs = (await c.query(
      `SELECT g.*, (SELECT ga.status FROM gig_assignments ga WHERE ga.gig_id = g.id AND ga.fellow_id = $1) AS my_status
       FROM gigs g WHERE g.starts_at > now() AND (g.status = 'open' OR EXISTS (SELECT 1 FROM gig_assignments ga WHERE ga.gig_id = g.id AND ga.fellow_id = $1 AND ga.status = 'accepted')) ORDER BY g.starts_at LIMIT 100`,
      [a.id],
    )).rows as (Gig & { my_status: string | null })[];
    const visible = orderBoard(gigs.filter((g) => eligible(g, fellow) && (onboardingKind(g.kind) ? fellow.status !== "live" : true)), fellow.worlds);
    const items: BoardItem[] = [];
    for (const g of visible) {
      const deductions = await deductionsFor(c, g.pay_paise);
      const reason = g.my_status ? null : await acceptability(c, fellow, steps, g);
      items.push({
        ...g, deductions, net_paise: g.pay_paise - deductions.reduce((s, d) => s + d.paise, 0), myStatus: g.my_status,
        canAccept: !g.my_status && !reason, reason,
        why: fellow.worlds.includes(g.world) ? `Matches your world: ${g.world}` : "Open to Fellows who teach in this language",
      });
    }
    return { items, fellow, weekMinutes: await weekMinutes(c, a.id, new Date()) };
  });
}

export async function respond(a: Account, gigId: string, action: "accept" | "decline" | "withdraw") {
  const { fellow, steps } = await requireFellow(a);
  return system(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [gigId]);
    const g = (await c.query("SELECT * FROM gigs WHERE id = $1 FOR UPDATE", [gigId])).rows[0] as Gig | undefined;
    if (!g || !eligible(g, fellow)) throw new FellowError(404, "Gig not found");
    const mine = (await c.query("SELECT id, status FROM gig_assignments WHERE gig_id = $1 AND fellow_id = $2", [gigId, a.id])).rows[0];

    if (action === "decline") {
      // Recorded only so the gig stops showing as new. Never used in tiers or matching.
      if (mine) throw new FellowError(409, "You already responded to this gig");
      await c.query("INSERT INTO gig_assignments (gig_id, fellow_id, status) VALUES ($1,$2,'declined')", [gigId, a.id]);
      return { status: "declined" };
    }
    if (action === "withdraw") {
      if (mine?.status !== "accepted") throw new FellowError(409, "Nothing to withdraw");
      if (+new Date(g.starts_at) - Date.now() < 24 * 3600_000) throw new FellowError(409, "Less than 24 hours to go. Use the help button so we can find cover.");
      await c.query("UPDATE gig_assignments SET status = 'withdrawn', responded_at = now() WHERE id = $1", [mine.id]);
      await c.query("UPDATE gigs SET status = 'open' WHERE id = $1 AND status = 'filled'", [gigId]);
      if (g.batch_id) await c.query("UPDATE batches SET educator_fellow_id = NULL WHERE id = $1 AND educator_fellow_id = $2", [g.batch_id, a.id]);
      return { status: "withdrawn" };
    }
    if (g.status !== "open") throw new FellowError(409, "This gig has been filled");
    if (mine) throw new FellowError(409, "You already responded to this gig");
    if (new Date(g.starts_at) <= new Date()) throw new FellowError(409, "This gig has started");
    const reason = await acceptability(c, fellow, steps, g);
    if (reason) throw new FellowError(409, reason);
    await c.query("INSERT INTO gig_assignments (gig_id, fellow_id, status) VALUES ($1,$2,'accepted')", [gigId, a.id]);
    const taken = (await c.query("SELECT count(*)::int AS n FROM gig_assignments WHERE gig_id = $1 AND status IN ('accepted','delivered')", [gigId])).rows[0].n;
    if (taken >= g.seats) await c.query("UPDATE gigs SET status = 'filled' WHERE id = $1", [gigId]);
    if (g.batch_id && ["live_batch", "build_session", "campus_session"].includes(g.kind)) await c.query("UPDATE batches SET educator_fellow_id = $2 WHERE id = $1", [g.batch_id, a.id]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id) VALUES ($1,'gig_accepted','gig',$2)", [a.id, gigId]);
    return { status: "accepted" };
  });
}

/** Ops creates a gig. Pay always comes from the rate card; no rate, no gig. */
export async function createGig(staff: Account, input: {
  kind: string; title: string; world: string; language: string; startsAt: string; durationMin: number; mode: "online" | "offline"; city: string;
  location?: string; responsibleAdult?: string; seats?: number; minTier?: string; batchId?: string; lessonPlan?: string; kitList?: string;
}) {
  return system(async (c) => {
    const rate = await rateFor(c, input.kind);
    if (!rate) throw new FellowError(409, "No approved rate for this gig type. Approve the rate card first.");
    const pay = Math.round((rate.per_session_paise * input.durationMin) / rate.minutes);
    const { rows } = await c.query(
      `INSERT INTO gigs (kind, batch_id, title, world, language, starts_at, duration_min, mode, location, responsible_adult, city, pay_paise, rate_sample, seats, min_tier, lesson_plan, kit_list, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
      [input.kind, input.batchId ?? null, input.title, input.world, input.language, input.startsAt, input.durationMin, input.mode, input.location ?? null, input.responsibleAdult ?? null,
        input.city, pay, rate.sample, input.seats ?? 1, input.minTier ?? "apprentice", input.lessonPlan ?? null, input.kitList ?? null, staff.id],
    ).catch((e) => { if (e.code === "23514") throw new FellowError(422, "In-person gigs need a partner location and a named responsible adult"); throw e; });
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id) VALUES ($1,'gig_created','gig',$2)", [staff.id, rows[0].id]);
    return rows[0].id as string;
  });
}

/** Teach mode data: gig, plan, kit, and a roster with first name, age band and progress only. */
export async function teach(a: Account, gigId: string) {
  await requireFellow(a);
  return asAccount(a, async (c) => {
    const g = (await c.query(
      "SELECT g.*, ga.id AS assignment_id, ga.status AS my_status FROM gigs g JOIN gig_assignments ga ON ga.gig_id = g.id AND ga.fellow_id = $2 WHERE g.id = $1 AND ga.status IN ('accepted','delivered')",
      [gigId, a.id],
    )).rows[0];
    if (!g) return null;
    const roster = (await c.query("SELECT * FROM fellow_roster($1)", [gigId])).rows as { booking_id: string; first_name: string; age_band: string; built: number; status: string }[];
    const projects = (await c.query("SELECT id, title FROM projects WHERE world = $1 OR world = 'coding' ORDER BY level", [g.world])).rows;
    return { gig: g, roster, projects };
  });
}

/**
 * Mark a session delivered: attendance and builds for each learner, then pay.
 * Paid bookings release one session's share from escrow to revenue; the
 * Fellow's fixed pay is booked as an expense owed to them.
 */
export async function deliver(a: Account, gigId: string, records: { bookingId: string; attended: boolean; builtProject?: string; feedback?: string }[]) {
  const { fellow } = await requireFellow(a);
  const t = await teach(a, gigId);
  if (!t) throw new FellowError(404, "Not your gig");
  if (t.gig.my_status === "delivered") throw new FellowError(409, "Already recorded");
  if (new Date(t.gig.starts_at).getTime() > Date.now() + 15 * 60_000) throw new FellowError(409, "You can record the session once it has started");
  const allowed = new Set(t.roster.map((r) => r.booking_id));
  if (records.some((r) => !allowed.has(r.bookingId))) throw new FellowError(403, "That learner is not in this class");
  return system(async (c) => {
    for (const r of records) {
      const bk = (await c.query("UPDATE bookings SET status = $2, feedback = coalesce($3, feedback) WHERE id = $1 AND status IN ('confirmed','attended','no_show') RETURNING learner_id", [r.bookingId, r.attended ? "attended" : "no_show", r.feedback ?? null])).rows[0];
      if (bk && r.attended && r.builtProject) {
        await c.query(
          "INSERT INTO learner_progress (learner_id, project_id, status, reviewed_by, completed_at) VALUES ($1,$2,'built',$3, now()) ON CONFLICT (learner_id, project_id) DO UPDATE SET status = 'built', reviewed_by = EXCLUDED.reviewed_by, completed_at = now()",
          [bk.learner_id, r.builtProject, `fellow:${a.id}`],
        );
      }
    }
    await c.query("UPDATE gig_assignments SET status = 'delivered', delivered_at = now() WHERE id = $1", [t.gig.assignment_id]);
    // Escrow: release one session's share of each paid order in this batch.
    if (t.gig.batch_id) {
      const orders = (await c.query(
        `SELECT o.id, o.amount_paise - o.gst_paise AS net, co.sessions FROM orders o JOIN bookings b ON b.id = o.booking_id JOIN batches bt ON bt.id = b.batch_id JOIN courses co ON co.id = bt.course_id
         WHERE b.batch_id = $1 AND o.status = 'paid'`,
        [t.gig.batch_id],
      )).rows;
      for (const o of orders) {
        const share = Math.round(o.net / Math.max(1, o.sessions));
        if (share > 0) await post(c, "escrow_release", `${t.gig.assignment_id}:${o.id}`, [["learner_escrow", share], ["platform_revenue", -share]]);
      }
    }
    await addEarning(c, a.id, { kind: t.gig.kind === "shadow" ? "shadow" : t.gig.kind === "co_teach" ? "co_teach" : "session", description: `${t.gig.title} · ${new Date(t.gig.starts_at).toISOString().slice(0, 16)}`, gross: t.gig.pay_paise, assignmentId: t.gig.assignment_id });
    if (t.gig.kind === "shadow" || t.gig.kind === "co_teach") {
      await c.query("UPDATE vetting_steps SET status = 'passed', detail = detail || $3, updated_at = now() WHERE fellow_id = $1 AND step = $2", [a.id, t.gig.kind, { gig: gigId }]);
    }
    await c.query("UPDATE gigs SET status = 'completed' WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM gig_assignments WHERE gig_id = $1 AND status = 'accepted')", [gigId]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'session_delivered','gig',$2,$3)", [a.id, gigId, { learners: records.length }]);
  });
}

export async function askHelp(a: Account, gigId: string | null, kind: "tech" | "kit" | "learner" | "safety" | "other") {
  await requireFellow(a);
  return system(async (c) => {
    const asg = gigId ? (await c.query("SELECT id FROM gig_assignments WHERE gig_id = $1 AND fellow_id = $2", [gigId, a.id])).rows[0] : null;
    const { rows } = await c.query("INSERT INTO help_requests (fellow_id, assignment_id, kind) VALUES ($1,$2,$3) RETURNING id", [a.id, asg?.id ?? null, kind]);
    if (kind === "safety") {
      await c.query("INSERT INTO safety_reports (reporter_account_id, page, category, details, respond_by) VALUES ($1,$2,'safety','Fellow pressed the safety help button in Teach mode', now() + interval '1 hour')", [a.id, `/app/fellow/gigs/${gigId ?? ""}`]);
    }
    return rows[0].id as string;
  });
}
