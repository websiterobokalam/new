import { system, uuid } from "../db";
import { asAccount, type Account } from "../auth/session";
import { gateway } from "../payments";
import { refundPaid } from "../ledger";
import { gstSplit } from "../money";
import { refundChanged } from "../email/notify";

/**
 * Refund policy. DRAFT RULES pending your published refund policy. Until it is
 * approved (REFUND_POLICY_APPROVED=1), every request is accepted for human
 * review and nothing is auto-decided against the parent.
 */
export const refundPolicy = {
  /** Approved by Robokalam on 4 November 2026. REFUND_POLICY_APPROVED=0 sends every request to a person again. */
  approved: () => process.env.REFUND_POLICY_APPROVED !== "0",
  fullRefundHoursBeforeStart: 24,
  afterStart: "pro_rata_undelivered_sessions" as const,
};

export type Decision = { rule: string; amountPaise: number; auto: boolean; explanation: string };

export function evaluate(order: { amount_paise: number }, startsAt: Date, sessionsTotal: number, sessionsDelivered: number, now = new Date()): Decision {
  const hours = (startsAt.getTime() - now.getTime()) / 3_600_000;
  const auto = refundPolicy.approved();
  if (hours >= refundPolicy.fullRefundHoursBeforeStart)
    return { rule: "full_before_start", amountPaise: order.amount_paise, auto, explanation: `Full refund: requested ${Math.floor(hours)} hours before the first class.` };
  const left = Math.max(0, sessionsTotal - sessionsDelivered);
  const amount = Math.round((order.amount_paise * left) / Math.max(1, sessionsTotal));
  return { rule: "pro_rata", amountPaise: amount, auto: auto && amount > 0, explanation: `${left} of ${sessionsTotal} classes not yet delivered: refund for those classes.` };
}

export class RefundError extends Error {}

export async function requestRefund(account: Account, orderId: string, reason: string) {
  // Only the parent's own order (filtered by account).
  const o = await asAccount(account, async (c) => {
    const { rows } = await c.query(
      `SELECT o.id, o.amount_paise, o.status, o.provider_payment_id, b.id AS booking_id, bt.starts_at, co.sessions,
              (SELECT count(*) FROM bookings x WHERE x.id = b.id AND x.status = 'attended') AS delivered
       FROM orders o JOIN bookings b ON b.id = o.booking_id JOIN batches bt ON bt.id = b.batch_id JOIN courses co ON co.id = bt.course_id
       WHERE o.id = $1 AND o.account_id = $2`,
      [orderId, account.id],
    );
    return rows[0];
  });
  if (!o) throw new RefundError("Order not found");
  if (o.status !== "paid") throw new RefundError("This order is not eligible for a refund request");
  const d = evaluate(o, new Date(o.starts_at), o.sessions, o.delivered);
  if (d.amountPaise <= 0) throw new RefundError("Nothing left to refund on this order");

  const id = await asAccount(account, async (c) => {
    const id = uuid();
    await c.query(
      "INSERT INTO refund_requests (id, order_id, account_id, reason, amount_paise, decision, status, open_order_id) VALUES ($1,$2,$3,$4,$5,$6,'requested',$2)",
      [id, orderId, account.id, reason, d.amountPaise, d],
    ).catch((e) => { if (e.code === "23505") throw new RefundError("A refund request is already open for this order"); throw e; });
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'refund_requested','refund',$2,$3)", [account.id, id, d]);
    await refundChanged(c, id);
    return id;
  });

  if (d.auto) await payRefund(id);
  return { id, decision: d };
}

/** Pay an approved refund through the gateway and post the ledger journal. */
export async function payRefund(refundId: string) {
  const r = await system(async (c) => {
    const { rows } = await c.query(
      "SELECT r.id, r.amount_paise, r.status, o.id AS order_id, o.amount_paise AS order_amount, o.provider_payment_id FROM refund_requests r JOIN orders o ON o.id = r.order_id WHERE r.id = $1 FOR UPDATE",
      [refundId],
    );
    return rows[0];
  });
  if (!r || r.status === "paid") return;
  const { refundId: providerRefund } = await gateway().refund(r.provider_payment_id, r.amount_paise, { refund_request: refundId });
  await system(async (c) => {
    const { gst } = gstSplit(r.amount_paise);
    await c.query("UPDATE refund_requests SET status = 'paid', open_order_id = NULL, provider_refund_id = $2, decided_at = now() WHERE id = $1", [refundId, providerRefund]);
    const full = r.amount_paise === r.order_amount;
    await c.query("UPDATE orders SET status = $2 WHERE id = $1", [r.order_id, full ? "refunded" : "partially_refunded"]);
    if (full) await c.query("UPDATE bookings SET status = 'refunded' WHERE id = (SELECT booking_id FROM orders WHERE id = $1)", [r.order_id]);
    await refundPaid(c, refundId, r.amount_paise, gst);
    await c.query("INSERT INTO audit_log (action, entity, entity_id, meta) VALUES ('refund_paid','refund',$1,$2)", [refundId, { providerRefund }]);
    await refundChanged(c, refundId);
  });
}
