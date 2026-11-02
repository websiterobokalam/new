import type { Tx } from "../db";
import { post } from "../ledger";

/**
 * Pay rules. Rates come from rate_card and are usable only when approved, or
 * when flagged sample (sample rows exist only in review/test databases).
 */
export type Rate = { gig_kind: string; per_session_paise: number; minutes: number; approved: boolean; sample: boolean };

export async function rateFor(c: Tx, kind: string): Promise<Rate | null> {
  const r = (await c.query("SELECT gig_kind, per_session_paise, minutes, approved, sample FROM rate_card WHERE gig_kind = $1 AND effective_at <= now()", [kind])).rows[0];
  return r && (r.approved || r.sample) ? r : null;
}

export type DeductionLine = { code: string; label: string; percent: number; paise: number };

/** Only approved deductions apply, and each is shown before a gig is accepted. */
export async function deductionsFor(c: Tx, gross: number): Promise<DeductionLine[]> {
  const rows = (await c.query("SELECT code, label, percent::float AS percent FROM deductions WHERE approved ORDER BY code")).rows;
  return rows.map((d) => ({ ...d, paise: Math.round((gross * d.percent) / 100) }));
}

export async function addEarning(c: Tx, fellowId: string, e: { kind: string; description: string; gross: number; assignmentId?: string }) {
  const ded = await deductionsFor(c, e.gross);
  const net = e.gross - ded.reduce((s, d) => s + d.paise, 0);
  const { rows } = await c.query(
    `INSERT INTO earnings_lines (fellow_id, assignment_id, kind, description, gross_paise, deductions, net_paise) VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT DO NOTHING RETURNING id`,
    [fellowId, e.assignmentId ?? null, e.kind, e.description, e.gross, JSON.stringify(ded), net],
  );
  // Educator earned: platform expense becomes a payable to the Fellow.
  if (rows[0]) await post(c, "educator_earned", rows[0].id, [["platform_expense", e.gross], ["educator_payable", -e.gross]]);
  return rows[0]?.id as string | undefined;
}

/** Start of the current pay week (Monday 00:00, India time). */
export function weekStartIST(d = new Date()) {
  const ist = new Date(d.getTime() + 5.5 * 3600_000);
  const day = (ist.getUTCDay() + 6) % 7;
  ist.setUTCHours(0, 0, 0, 0);
  ist.setUTCDate(ist.getUTCDate() - day);
  return new Date(ist.getTime() - 5.5 * 3600_000);
}
