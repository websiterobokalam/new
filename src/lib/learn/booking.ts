import { system, uuid, type Tx } from "../db";
import { asAccount, type Account } from "../auth/session";
import { currentConsents, hasRequired } from "./consent";
import { gateway, type CheckoutPayload } from "../payments";
import { gstSplit } from "../money";
import { checkOneToOneBooking, ONE_TO_ONE_ACK_SHA } from "./oneToOne";
import { bookingConfirmed, paymentReceived } from "../email/notify";

const HOLD_MINUTES = 30;
const BAND: Record<string, [number, number]> = { "6-8": [6, 8], "9-11": [9, 11], "12-14": [12, 14], "15-17": [15, 17], "18+": [18, 99] };

export class BookingError extends Error {
  constructor(public code: "not_found" | "consent" | "age" | "full" | "past" | "fee_unpublished" | "duplicate", msg: string) { super(msg); }
}

export function ageFits(band: string, min: number, max: number | null) {
  const [lo, hi] = BAND[band] ?? [0, 0];
  return hi >= min && (max == null || lo <= max);
}

export type BookingResult = { bookingId: string; status: "confirmed" | "pending_payment"; checkout?: CheckoutPayload & { localOrderId: string } };

export async function book(account: Account, learnerId: string, batchId: string, opts: { oneToOneAck?: boolean } = {}): Promise<BookingResult> {
  // 1. As the guardian (RLS): the learner must be theirs and consented.
  const learner = await asAccount(account, async (c) => {
    const { rows } = await c.query("SELECT id, age_band FROM learners WHERE id = $1 AND guardian_account_id = $2 AND erased_at IS NULL", [learnerId, account.id]);
    if (!rows[0]) throw new BookingError("not_found", "Learner not found");
    if (!hasRequired(await currentConsents(c, learnerId))) throw new BookingError("consent", "Please complete consent before booking");
    return rows[0] as { id: string; age_band: string };
  });

  // 2. Seat allocation needs all bookings for the batch, so it runs as a server task with a lock.
  const res = await system(async (c: Tx) => {
    // Lock the batch row so two parents can't take the last seat at once.
    const { rows } = await c.query(
      `SELECT b.id, b.capacity, (b.starts_at > UTC_TIMESTAMP(3)) AS future, c.id AS course_id, c.slug, c.title, c.age_min, c.age_max, c.fee_paise, c.fee_approved, c.sample, c.kind, c.format
       FROM batches b JOIN courses c ON c.id = b.course_id WHERE b.id = $1 AND c.published FOR UPDATE`,
      [batchId],
    );
    const b = rows[0];
    if (!b) throw new BookingError("not_found", "This class is not available");
    if (!b.future) throw new BookingError("past", "This class has already started");
    if (!ageFits(learner.age_band, b.age_min, b.age_max)) throw new BookingError("age", "This class is for a different age group");
    // One-to-one: this child's specific consent, the parent's confirmed email, and today's acknowledgement.
    if (b.format === "one_to_one") await checkOneToOneBooking(c, account.id, learnerId, opts.oneToOneAck);
    const fee: number | null = b.fee_paise;
    const payable = fee !== null && fee > 0;
    if (fee === null || (payable && !b.fee_approved && !b.sample)) throw new BookingError("fee_unpublished", "The fee for this class is not published yet");
    const taken = await c.query(
      `SELECT COUNT(*) AS n FROM bookings WHERE batch_id = $1 AND (status IN ('confirmed','attended') OR (status = 'pending_payment' AND created_at > $2))`,
      [batchId, new Date(Date.now() - HOLD_MINUTES * 60_000)],
    );
    if (taken.rows[0].n >= b.capacity) throw new BookingError("full", "This class is full. Pick another time.");
    const existing = await c.query("SELECT id, status FROM bookings WHERE batch_id = $1 AND learner_id = $2", [batchId, learnerId]);
    if (existing.rows[0] && existing.rows[0].status !== "pending_payment" && existing.rows[0].status !== "cancelled") throw new BookingError("duplicate", "Already booked");
    const status = payable ? "pending_payment" : "confirmed";
    await c.query(
      `INSERT INTO bookings (id, batch_id, learner_id, guardian_account_id, status) VALUES ($1,$2,$3,$4,$5)
       ON DUPLICATE KEY UPDATE status = VALUES(status), created_at = UTC_TIMESTAMP(3)`,
      [uuid(), batchId, learnerId, account.id, status],
    );
    const bookingId: string = (await c.query("SELECT id FROM bookings WHERE batch_id = $1 AND learner_id = $2", [batchId, learnerId])).rows[0].id;
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'book','booking',$2,$3)", [account.id, bookingId, { batchId, status }]);
    if (b.format === "one_to_one") {
      await c.query("INSERT INTO one_to_one_acks (booking_id, guardian_account_id, learner_id, text_sha256) VALUES ($1,$2,$3,$4) ON DUPLICATE KEY UPDATE text_sha256 = VALUES(text_sha256), acknowledged_at = UTC_TIMESTAMP(3)", [bookingId, account.id, learnerId, ONE_TO_ONE_ACK_SHA]);
    }
    if (status === "confirmed") await bookingConfirmed(c, bookingId);
    return { bookingId, status, fee: fee ?? 0, slug: b.slug as string };
  });

  if (res.status === "confirmed") return { bookingId: res.bookingId, status: "confirmed" };

  // 3. Paid class: create the gateway order. The fee shown is the fee charged.
  const gw = gateway();
  const { gst } = gstSplit(res.fee);
  const { orderId } = await gw.createOrder(res.fee, res.bookingId.slice(0, 32), { booking: res.bookingId, course: res.slug });
  const local = await system(async (c) => {
    const id = uuid();
    await c.query(
      "INSERT INTO orders (id, booking_id, account_id, amount_paise, gst_paise, status, provider, provider_order_id) VALUES ($1,$2,$3,$4,$5,'created',$6,$7)",
      [id, res.bookingId, account.id, res.fee, gst, gw.name, orderId],
    );
    return id;
  });
  return { bookingId: res.bookingId, status: "pending_payment", checkout: { ...gw.checkout(orderId, res.fee), localOrderId: local } };
}

/** Indian financial year invoice number, e.g. RK/2026-27/000042. */
function invoiceNo(seq: number, d = new Date()) {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `RK/${y}-${String((y + 1) % 100).padStart(2, "0")}/${String(seq).padStart(6, "0")}`;
}

/** Mark an order paid. Idempotent: checkout callback and webhook may both arrive. */
export async function markPaid(c: Tx, providerOrderId: string, paymentId: string) {
  const { rows } = await c.query("SELECT id, booking_id, amount_paise, gst_paise, status FROM orders WHERE provider_order_id = $1 FOR UPDATE", [providerOrderId]);
  const o = rows[0];
  if (!o) return null;
  if (o.status === "paid" || o.status.includes("refunded")) return o.id as string;
  // Gap-free invoice counter, locked for the rest of this transaction.
  await c.query("UPDATE counters SET value = value + 1 WHERE name = 'invoice'");
  const seq = Number((await c.query("SELECT value AS n FROM counters WHERE name = 'invoice'")).rows[0].n);
  await c.query("UPDATE orders SET status = 'paid', provider_payment_id = $2, paid_at = UTC_TIMESTAMP(3), invoice_no = $3 WHERE id = $1", [o.id, paymentId, invoiceNo(seq)]);
  const confirmed = await c.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1 AND status = 'pending_payment'", [o.booking_id]);
  // Paid after the hold was tidied away: keep the money safe and flag it for a person.
  if (!confirmed.affectedRows) await c.query("INSERT INTO audit_log (action, entity, entity_id, meta) VALUES ('late_payment_review','order',$1,$2)", [o.id, { bookingId: o.booking_id }]);
  const { paymentCaptured } = await import("../ledger");
  await paymentCaptured(c, o.id, o.amount_paise, o.gst_paise);
  await c.query("INSERT INTO audit_log (action, entity, entity_id, meta) VALUES ('payment_captured','order',$1,$2)", [o.id, { paymentId }]);
  await paymentReceived(c, o.id);
  return o.id as string;
}
