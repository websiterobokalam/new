import { system } from "./db";

/**
 * Tidy-up (Phase 6). Safe to run as often as you like.
 * - Unpaid seat holds: a hold stops counting after 30 minutes (booking.ts); after
 *   24 hours the booking is cancelled and its unpaid order marked failed, so
 *   lists stay honest. A payment that still arrives later is flagged for a
 *   person (see markPaid), never silently lost.
 * - Sign-in codes older than a day are deleted (useless, and personal).
 * - Sessions that expired or were revoked over 30 days ago are deleted.
 */
export const STALE_HOLD_HOURS = 24;

export async function housekeeping(now = new Date()) {
  return system(async (c) => {
    const cutoff = new Date(now.getTime() - STALE_HOLD_HOURS * 3_600_000);
    const stale = (await c.query("SELECT id FROM bookings WHERE status = 'pending_payment' AND created_at < $1", [cutoff])).rows.map((r) => r.id as string);
    let orders = 0;
    if (stale.length) {
      const marks = stale.map((_, i) => `$${i + 1}`).join(",");
      orders = (await c.query(`UPDATE orders SET status = 'failed' WHERE status = 'created' AND booking_id IN (${marks})`, stale)).affectedRows;
      await c.query(`UPDATE bookings SET status = 'cancelled' WHERE status = 'pending_payment' AND id IN (${marks})`, stale);
      await c.query("INSERT INTO audit_log (action, entity, entity_id, meta) VALUES ('holds_expired','booking','batch',$1)", [{ bookings: stale.length, orders }]);
    }
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const otps = (await c.query("DELETE FROM otp_challenges WHERE created_at < $1", [dayAgo])).affectedRows
      + (await c.query("DELETE FROM email_otp_challenges WHERE created_at < $1", [dayAgo])).affectedRows;
    const old = new Date(now.getTime() - 30 * 86_400_000);
    const sessions = (await c.query("DELETE FROM sessions WHERE expires_at < $1 OR revoked_at < $1", [old])).affectedRows;
    return { expiredHolds: stale.length, failedOrders: orders, deletedOtps: otps, deletedSessions: sessions };
  });
}
