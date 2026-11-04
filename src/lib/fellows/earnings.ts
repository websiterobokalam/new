import { insertOnce, system, uuid } from "../db";
import { asAccount, type Account } from "../auth/session";
import { post } from "../ledger";
import { weekStartIST } from "./pay";
import { payoutSent } from "../email/notify";

export async function earnings(a: Account) {
  return asAccount(a, async (c) => {
    const start = weekStartIST();
    const lines = (await c.query("SELECT id, kind, description, gross_paise, deductions, net_paise, earned_at, payout_id FROM earnings_lines WHERE fellow_id = $1 ORDER BY earned_at DESC LIMIT 200", [a.id])).rows;
    const payouts = (await c.query("SELECT id, period_end, gross_paise, deductions_paise, net_paise, status, provider_ref, paid_at FROM payouts WHERE fellow_id = $1 ORDER BY period_end DESC", [a.id])).rows;
    const week = lines.filter((l) => new Date(l.earned_at) >= start);
    const unpaid = lines.filter((l) => !l.payout_id);
    const nextPayout = new Date(start.getTime() + 7 * 86400_000);
    return {
      lines, payouts,
      week: { gross: week.reduce((s, l) => s + l.gross_paise, 0), net: week.reduce((s, l) => s + l.net_paise, 0), sessions: week.filter((l) => l.kind === "session").length },
      unpaidNet: unpaid.reduce((s, l) => s + l.net_paise, 0),
      nextPayout,
    };
  });
}

export function statementCsv(lines: { earned_at: string; kind: string; description: string; gross_paise: number; deductions: { label: string; paise: number }[]; net_paise: number; payout_id: string | null }[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [["Date", "Type", "Description", "Gross (INR)", "Deductions", "Net (INR)", "Paid"].join(",")];
  for (const l of lines) {
    rows.push([new Date(l.earned_at).toISOString().slice(0, 10), l.kind, esc(l.description), (l.gross_paise / 100).toFixed(2), esc(l.deductions.map((d) => `${d.label} ${(d.paise / 100).toFixed(2)}`).join("; ") || "none"), (l.net_paise / 100).toFixed(2), l.payout_id ? "yes" : "pending"].join(","));
  }
  return rows.join("\n") + "\n";
}

/**
 * Weekly payout run (ops). Groups every unpaid line earned before the period
 * end into one payout per Fellow. Bank transfer is recorded by ops (manual)
 * until a payouts provider (e.g. RazorpayX) is connected.
 */
export async function runPayouts(staff: Account, periodEnd: string) {
  return system(async (c) => {
    const due = (await c.query(
      `SELECT fellow_id, sum(gross_paise) AS gross, sum(gross_paise - net_paise) AS ded, sum(net_paise) AS net
       FROM earnings_lines WHERE payout_id IS NULL AND earned_at < DATE_ADD($1, INTERVAL 1 DAY) GROUP BY fellow_id`,
      [periodEnd],
    )).rows;
    const made: string[] = [];
    for (const d of due) {
      const p = { id: uuid() };
      const wrote = await insertOnce(c,
        "INSERT INTO payouts (id, fellow_id, period_end, gross_paise, deductions_paise, net_paise) VALUES ($1,$2,$3,$4,$5,$6)",
        [p.id, d.fellow_id, periodEnd, d.gross, d.ded, d.net],
      );
      if (!wrote) continue; // already created for this week
      await c.query("UPDATE earnings_lines SET payout_id = $1 WHERE fellow_id = $2 AND payout_id IS NULL AND earned_at < DATE_ADD($3, INTERVAL 1 DAY)", [p.id, d.fellow_id, periodEnd]);
      made.push(p.id);
    }
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, meta) VALUES ($1,'payout_run','payouts',$2)", [staff.id, { periodEnd, count: made.length }]);
    return made;
  });
}

export async function markPayoutPaid(staff: Account, payoutId: string, bankRef: string) {
  return system(async (c) => {
    const p = (await c.query("SELECT gross_paise, deductions_paise, net_paise FROM payouts WHERE id = $1 AND status = 'pending' FOR UPDATE", [payoutId])).rows[0];
    if (!p) throw new Error("Payout is not pending");
    await c.query("UPDATE payouts SET status = 'paid', provider_ref = $2, paid_at = now() WHERE id = $1", [payoutId, bankRef]);
    await post(c, "payout_paid", payoutId, [["educator_payable", p.gross_paise], ["deductions_payable", -p.deductions_paise], ["payouts_bank", -p.net_paise]]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'payout_paid','payout',$2,$3)", [staff.id, payoutId, { bankRef }]);
    await payoutSent(c, payoutId);
  });
}
