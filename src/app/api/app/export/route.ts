import { handler, requireAccount } from "@/lib/api";
import { asAccount } from "@/lib/auth/session";

/** Everything we hold about this family, as JSON. Every query is filtered to this account. */
export const GET = handler(async () => {
  const a = await requireAccount();
  const data = await asAccount(a, async (c) => {
    const q = async (sql: string, p: unknown[] = []) => (await c.query(sql, p)).rows;
    return {
      exportedAt: new Date().toISOString(),
      account: (await q("SELECT phone_e164, login_email, email, language, region, adult_declared_at, created_at FROM accounts WHERE id = $1", [a.id]))[0],
      learners: await q("SELECT id, first_name, age_band, interests, portfolio_public, created_at FROM learners WHERE guardian_account_id = $1 AND erased_at IS NULL", [a.id]),
      consentHistory: await q("SELECT learner_id, purpose, granted, notice_id, method, created_at FROM consent_events WHERE guardian_account_id = $1 ORDER BY id", [a.id]),
      bookings: await q("SELECT id, batch_id, learner_id, status, feedback, next_step, created_at FROM bookings WHERE guardian_account_id = $1", [a.id]),
      orders: await q("SELECT id, amount_paise, gst_paise, status, invoice_no, paid_at FROM orders WHERE account_id = $1", [a.id]),
      refunds: await q("SELECT id, order_id, amount_paise, status, created_at FROM refund_requests WHERE account_id = $1", [a.id]),
      progress: await q("SELECT lp.learner_id, lp.project_id, lp.status, lp.completed_at FROM learner_progress lp JOIN learners l ON l.id = lp.learner_id WHERE l.guardian_account_id = $1", [a.id]),
      certificates: await q("SELECT code, kind, holder_name, title, issued_at, revoked_at FROM certificates WHERE account_id = $1", [a.id]),
      reports: await q("SELECT id, category, status, created_at FROM safety_reports WHERE reporter_account_id = $1", [a.id]),
    };
  });
  return new Response(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="robokalam-my-data.json"', "cache-control": "no-store" } });
});
