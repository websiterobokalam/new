import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { audit, system, uuid, type Tx } from "../db";
import { HttpError } from "../api";
import type { Account } from "../auth/session";
import { hasContactDetails } from "../fellows/community";
import { testProvidersAllowed } from "../providers";

/**
 * Quality tools. Rules and AI may FLAG; a person decides, with a written note.
 * Nothing here changes a tier, pay, gigs or a course on its own (brief: "AI may
 * flag issues, but a human decides any penalty"). Each check is an automated
 * system with a published notice and runs only from its effective date
 * (14 days' notice to Fellows).
 */

export type Flag = { code: string; severity: "info" | "warn" | "high"; message: string; evidence?: string };
export type Draft = { id: string; fellow_id: string; title: string; world: string; age_min: number; age_max: number; outcome: string; sessions: number; batch_size_max: number; kit: string | null; fee_paise: number; syllabus: { title: string; build: string }[] };

export async function systemEffective(c: Tx, id: string) {
  return !!(await c.query("SELECT 1 FROM automated_systems WHERE id = $1 AND effective_at <= UTC_TIMESTAMP(3)", [id])).rows[0];
}

const draftText = (d: Draft) => [d.title, d.outcome, d.kit ?? "", ...d.syllabus.flatMap((s) => [s.title, s.build])].join("\n");
const find = (text: string, re: RegExp) => text.match(re)?.[0];

/** Deterministic checks against the brief's hard rules. */
export function courseRuleChecks(d: Draft): Flag[] {
  const t = draftText(d);
  const out: Flag[] = [];
  const hit = (code: string, severity: Flag["severity"], message: string, re: RegExp) => {
    const e = find(t, re);
    if (e) out.push({ code, severity, message, evidence: e });
  };
  if (d.world === "finlit") hit("finlit_investment", "high", "Financial literacy covers money basics only: no stock tips, trading, crypto or investment advice.", /\b(stock tips?|trading|intraday|crypto\w*|bitcoin|invest(ing|ment)? advice|which shares?|options trading|forex|multibagger)\b/i);
  if (d.world === "space") hit("space_propellant", "high", "Space education uses safe models. No live propellants without a qualified adult and permission.", /\b(propellant|rocket (fuel|motor|engine)|solid motor|black powder|igniter|launch (a|an|the)? ?rocket)\b/i);
  if (hasContactDetails(t)) out.push({ code: "contact_details", severity: "high", message: "Contact details or social handles aren't allowed. All contact stays on the platform.", evidence: find(t, /(\+?\d[\d\s().-]{7,}\d)|([\w.%+-]+@[\w.-]+\.[a-z]{2,})|(https?:\/\/\S+|www\.\S+)|@\w{3,}/i) });
  hit("private_session", "high", "No private one-to-one sessions or home visits with children.", /\b(1[:-]1|one[- ]on[- ]one|one[- ]to[- ]one|private (session|class|lesson)s?|home visits?|at (your|the student'?s) home)\b/i);
  hit("guarantee_claim", "warn", "No guarantees, ranks, selection or absolute claims (for example 'guaranteed', 'No.1', 'top 1%').", /\b(guarantee[ds]?|100% (result|success|placement)s?|no\.? ?1|number one|top 1%|assured (job|admission|rank)s?|job guarantee)\b/i);
  hit("institute_link", "warn", "Don't imply that IITs, NITs or other institutes endorse the course.", /\b(IIT|NIT|IIIT|BITS)[- ]?(approved|certified|endorsed|recognised|recognized)\b/i);
  if (d.syllabus.length !== d.sessions) out.push({ code: "syllabus_count", severity: "warn", message: `The syllabus lists ${d.syllabus.length} sessions but the course says ${d.sessions}.` });
  if (d.syllabus.some((s) => s.build.trim().length < 10)) out.push({ code: "session_build", severity: "info", message: "Every session should end with something the learner builds. Some sessions don't say what." });
  if (d.age_max - d.age_min > 6) out.push({ code: "age_span", severity: "info", message: "A wide age range is hard to teach in one group. Consider splitting by age." });
  return out;
}

/* ---------------- AI review (Claude) ---------------- */

const AiIssues = z.object({
  issues: z.array(z.object({
    code: z.enum(["age_fit", "safety", "claims", "finlit_rules", "space_rules", "clarity", "outcome", "other"]),
    severity: z.enum(["info", "warn", "high"]),
    message: z.string(),
    evidence: z.string(),
  })),
});

const AI_SYSTEM = `You review course drafts written by college-student educators for Robokalam, which teaches robotics, IoT, AI, coding, money basics and space to children aged 6 to 18 in India.
Your notes go to a human reviewer, who makes every decision. You never approve or reject.
Check the draft against these rules and report only real issues, quoting the words that raise each one:
- Age fit: activities and language suit the stated ages.
- Safety: tools, electricity, heat, chemicals and sharp items are age-appropriate and supervised. No live rocket propellants. No private one-to-one sessions, home visits or contact outside the platform.
- Honest claims: no guarantees of results, ranks, jobs, admissions or earnings; no implied endorsement by institutes or famous people.
- Money basics: budgeting, saving, pricing and simple business only. No stock tips, trading calls, crypto promotion or investment advice.
- Clarity: a clear outcome, and each session ends with something the learner builds.
Write each message in one plain sentence for the reviewer. If there are no issues, return an empty list.`;

export type AiResult = { ok: true; flags: Flag[]; model: string } | { ok: false; reason: string };

export async function aiCourseReview(d: Draft): Promise<AiResult> {
  const draft = { title: d.title, world: d.world, ages: `${d.age_min}-${d.age_max}`, outcome: d.outcome, sessions: d.syllabus, kit: d.kit, groupSize: `up to ${d.batch_size_max}` };
  if (!process.env.ANTHROPIC_API_KEY) {
    if (!testProvidersAllowed()) return { ok: false, reason: "AI review isn't switched on (no API key)" };
    // Test double: deterministic, labelled.
    const vague = d.outcome.trim().split(/\s+/).length < 8;
    return { ok: true, model: "test-double", flags: vague ? [{ code: "ai_outcome", severity: "info", message: "The outcome is vague. Say what the learner will have built by the end.", evidence: d.outcome }] : [] };
  }
  try {
    const client = new Anthropic();
    const model = process.env.QUALITY_AI_MODEL || "claude-opus-5-5";
    const res = await client.beta.messages.parse({
      model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: AI_SYSTEM,
      output_config: { effort: "low", format: betaZodOutputFormat(AiIssues) },
      messages: [{ role: "user", content: `Course draft (JSON):\n${JSON.stringify(draft, null, 2)}` }],
    });
    if (res.stop_reason === "refusal") return { ok: false, reason: "The AI declined to review this draft. A person reviews it as usual." };
    if (!res.parsed_output) return { ok: false, reason: "The AI review came back incomplete. A person reviews it as usual." };
    return { ok: true, model: res.model, flags: res.parsed_output.issues.map((i) => ({ code: `ai_${i.code}`, severity: i.severity, message: i.message, evidence: i.evidence.slice(0, 500) })) };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { ok: false, reason: "AI review is busy. Run it again later." };
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, reason: "AI review key is not valid." };
    if (e instanceof Anthropic.APIError) return { ok: false, reason: `AI review failed (${e.status ?? "network"}).` };
    throw e;
  }
}

async function saveFlags(c: Tx, systemId: string, subject: { type: "course_draft" | "fellow"; id: string; fellowId: string }, flags: Flag[]) {
  let n = 0;
  for (const f of flags) {
    // Don't repeat a flag that is still open. For teaching signals, also not one raised in the last 30 days.
    const dup = (await c.query(
      `SELECT 1 FROM quality_flags WHERE subject_type = $1 AND subject_id = $2 AND code = $3
       AND (status = 'open' OR ($1 = 'fellow' AND created_at > UTC_TIMESTAMP(3) - INTERVAL 30 DAY)) LIMIT 1`,
      [subject.type, subject.id, f.code])).rows[0];
    if (dup) continue;
    await c.query(
      "INSERT INTO quality_flags (id, system_id, subject_type, subject_id, fellow_id, code, severity, message, evidence) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [uuid(), systemId, subject.type, subject.id, subject.fellowId, f.code, f.severity, f.message.slice(0, 500), f.evidence?.slice(0, 500) ?? null]);
    n++;
  }
  return n;
}

/** Runs every effective check on a submitted draft. Returns what ran, for the reviewer. */
export async function checkDraft(d: Draft) {
  const ran: string[] = [];
  let aiNote: string | null = null;
  const [rulesOn, aiOn] = await system(async (c) => [await systemEffective(c, "course-draft-rules"), await systemEffective(c, "course-draft-ai")]);
  const subject = { type: "course_draft" as const, id: d.id, fellowId: d.fellow_id };
  if (rulesOn) { await system((c) => saveFlags(c, "course-draft-rules", subject, courseRuleChecks(d))); ran.push("rules"); }
  if (aiOn) {
    const r = await aiCourseReview(d);
    if (r.ok) { await system((c) => saveFlags(c, "course-draft-ai", subject, r.flags)); ran.push(`ai:${r.model}`); }
    else aiNote = r.reason;
  }
  return { ran, aiNote };
}

/* ---------------- Teaching quality signals (rules only; no AI, no child data) ---------------- */

export async function sessionSignals(c: Tx, fellowId: string): Promise<Flag[]> {
  const out: Flag[] = [];
  const obs = (await c.query(
    `SELECT qr.rubric FROM quality_reviews qr JOIN gig_assignments ga ON ga.id = qr.assignment_id WHERE ga.fellow_id = $1 ORDER BY qr.created_at DESC LIMIT 5`, [fellowId])).rows;
  if (obs.length >= 2) {
    const avg = obs.reduce((s, r) => { const v = Object.values(r.rubric as Record<string, number>).map(Number); return s + v.reduce((a, b) => a + b, 0) / v.length; }, 0) / obs.length;
    if (avg < 2.5) out.push({ code: "low_observation", severity: "warn", message: `Recent observation scores average ${avg.toFixed(1)} of 4.`, evidence: `${obs.length} observations` });
    if (obs.some((r) => Number((r.rubric as Record<string, number>).safety) <= 1)) out.push({ code: "safety_score", severity: "high", message: "An observer scored safety 1 of 4 in a recent session." });
  }
  const noShows = Number((await c.query("SELECT COUNT(*) AS n FROM gig_assignments WHERE fellow_id = $1 AND status = 'no_show' AND responded_at > UTC_TIMESTAMP(3) - INTERVAL 30 DAY", [fellowId])).rows[0].n);
  if (noShows >= 2) out.push({ code: "no_shows", severity: "warn", message: `${noShows} missed sessions in the last 30 days.` });
  const low = Number((await c.query("SELECT COUNT(*) AS n FROM reviews WHERE fellow_id = $1 AND rating <= 2 AND NOT hidden AND created_at > UTC_TIMESTAMP(3) - INTERVAL 60 DAY", [fellowId])).rows[0].n);
  if (low >= 1) out.push({ code: "low_rating", severity: "warn", message: `${low} verified parent rating${low > 1 ? "s" : ""} of 2 or less in the last 60 days.` });
  const blocked = Number((await c.query(
    "SELECT COUNT(*) AS n FROM messages m WHERE m.sender_account_id = $1 AND m.blocked AND m.created_at > UTC_TIMESTAMP(3) - INTERVAL 60 DAY", [fellowId])).rows[0].n);
  if (blocked >= 1) out.push({ code: "contact_attempt", severity: "high", message: `${blocked} message${blocked > 1 ? "s" : ""} with contact details were blocked in the last 60 days.` });
  return out;
}

/** Ops runs the teaching signals across live Fellows. */
export async function runSessionSignals(ops: Account) {
  return system(async (c) => {
    if (!(await systemEffective(c, "session-signals"))) throw new HttpError(409, "Teaching quality signals take effect after their 14-day notice to Fellows.");
    const fellows = (await c.query("SELECT account_id FROM fellows WHERE status IN ('live','paused')")).rows;
    let raised = 0;
    for (const f of fellows) raised += await saveFlags(c, "session-signals", { type: "fellow", id: f.account_id, fellowId: f.account_id }, await sessionSignals(c, f.account_id));
    await audit(c, ops.id, "quality_signals_run", "market", "quality", { fellows: fellows.length, raised });
    return { fellows: fellows.length, raised };
  });
}

/** A person decides. The note is required and the Fellow can read it. */
export async function decideFlag(ops: Account, id: string, status: "dismissed" | "actioned", note: string) {
  if (note.trim().length < 5) throw new HttpError(422, "Write what you decided and why", { fields: { note: "Required" } });
  return system(async (c) => {
    const r = await c.query("UPDATE quality_flags SET status = $2, decided_by = $3, decided_at = UTC_TIMESTAMP(3), decision_note = $4 WHERE id = $1 AND status = 'open'", [id, status, ops.id, note]);
    if (!r.affectedRows) throw new HttpError(409, "Already decided");
    await audit(c, ops.id, `flag_${status}`, "quality_flag", id);
  });
}
