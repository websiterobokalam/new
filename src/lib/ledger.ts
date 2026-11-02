import type { Tx } from "./db";

export type LedgerAccount = "gateway_clearing" | "learner_escrow" | "gst_payable" | "platform_revenue" | "educator_payable" | "refunds";
type Posting = [LedgerAccount, number]; // debit positive, credit negative

/**
 * Post a balanced journal. Idempotent on (kind, ref): a repeated webhook
 * returns false instead of double-posting. The database also rejects any
 * journal that does not sum to zero.
 */
export async function post(c: Tx, kind: string, ref: string, postings: Posting[]): Promise<boolean> {
  const sum = postings.reduce((s, [, a]) => s + a, 0);
  if (sum !== 0) throw new Error(`Unbalanced journal ${kind}/${ref}: ${sum}`);
  const { rows } = await c.query("INSERT INTO ledger_journals (kind, ref) VALUES ($1, $2) ON CONFLICT (kind, ref) DO NOTHING RETURNING id", [kind, ref]);
  if (!rows[0]) return false;
  for (const [account, amount] of postings) {
    if (amount !== 0) await c.query("INSERT INTO ledger_postings (journal_id, account, amount_paise) VALUES ($1, $2, $3)", [rows[0].id, account, amount]);
  }
  return true;
}

/** Money in: held in escrow until the session is delivered (released in Phase 3). */
export const paymentCaptured = (c: Tx, orderId: string, total: number, gst: number) =>
  post(c, "payment_captured", orderId, [["gateway_clearing", total], ["learner_escrow", -(total - gst)], ["gst_payable", -gst]]);

/** Money out: refund reverses escrow and GST proportionally. */
export const refundPaid = (c: Tx, refundId: string, amount: number, gst: number) =>
  post(c, "refund_paid", refundId, [["learner_escrow", amount - gst], ["gst_payable", gst], ["gateway_clearing", -amount]]);
