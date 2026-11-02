import Link from "next/link";
import { appContext } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { inr } from "@/lib/money";
import { RefundForm } from "@/components/app/RefundForm";
import { refundPolicy } from "@/lib/learn/refunds";

export const metadata = { title: "Payments and refunds" };

export default async function Orders() {
  const { account, t } = await appContext("/app/orders");
  const orders = await asAccount(account, async (c) => {
    const refunds = (await c.query("SELECT order_id, status, amount_paise AS amount, decision, created_at AS at FROM refund_requests WHERE account_id = $1 ORDER BY created_at DESC", [account.id])).rows;
    const os = (await c.query(
    `SELECT o.id, o.amount_paise, o.gst_paise, o.status, o.invoice_no, o.paid_at, co.title, l.first_name
     FROM orders o JOIN bookings b ON b.id = o.booking_id JOIN batches bt ON bt.id = b.batch_id JOIN courses co ON co.id = bt.course_id JOIN learners l ON l.id = b.learner_id
     WHERE o.account_id = $1 AND o.status <> 'created' ORDER BY o.created_at DESC`,
    [account.id],
  )).rows;
    return os.map((o) => { const r = refunds.filter((x) => x.order_id === o.id); return { ...o, refunds: r.length ? r : null }; });
  });
  return (
    <section className="py-10">
      <div className="wrap grid max-w-4xl gap-6">
        <header>
          <p className="eyebrow">{t.orders}</p>
          <h1 className="display-lg mt-2">{t.orders}</h1>
          <p className="lede mt-2">Every payment, invoice and refund in one place. Refund requests are self-serve.</p>
        </header>
        <div className="rounded-2xl bg-panel p-5 text-sm">
          <p className="font-semibold text-heading">Refund terms {refundPolicy.approved() ? "" : "(draft, pending approval)"}</p>
          <p className="mt-1">Full refund if you ask at least {refundPolicy.fullRefundHoursBeforeStart} hours before the first class. After classes start, you get back the share for classes not yet delivered. <Link className="underline" href="/refunds">Full refund policy</Link></p>
        </div>
        {orders.length === 0 ? <p className="text-muted">No payments yet. Free Build Sessions never need one.</p> : (
          <ul className="grid gap-4">
            {orders.map((o) => (
              <li key={o.id} className="card grid gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-heading">{o.title} · {o.first_name}</p>
                    <p className="text-sm text-muted">{o.invoice_no} · {o.paid_at ? new Date(o.paid_at).toLocaleDateString("en-IN") : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-heading">{inr(o.amount_paise)}</p>
                    <p className="text-xs text-muted">{t.includes_gst} {inr(o.gst_paise)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-panel px-3 py-1 font-semibold">{o.status.replace("_", " ")}</span>
                  {o.invoice_no && <Link className="font-semibold text-link underline" href={`/app/orders/${o.id}/invoice`}>{t.invoice}</Link>}
                </div>
                {o.refunds?.map((r: { status: string; amount: number; decision: { explanation: string }; at: string }, i: number) => (
                  <p key={i} className="rounded-xl bg-leafmist p-3 text-sm dark:bg-panel-2">{t.refund_status}: <strong>{r.status}</strong> · {inr(r.amount)} · {r.decision.explanation}</p>
                ))}
                {o.status === "paid" && !o.refunds?.some((r: { status: string }) => ["requested", "approved"].includes(r.status)) && <RefundForm orderId={o.id} t={t} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
