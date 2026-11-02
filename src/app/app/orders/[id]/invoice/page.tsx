import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { inr, GST_RATE } from "@/lib/money";
import { SITE } from "@/lib/site";

export const metadata = { title: "Invoice" };

/** GST tax invoice. Supplier GSTIN, address and SAC code are pending (open question). */
export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { account } = await appContext(`/app/orders/${id}/invoice`);
  const o = await asAccount(account, async (c) => (await c.query(
    "SELECT o.*, co.title, l.first_name FROM orders o JOIN bookings b ON b.id = o.booking_id JOIN batches bt ON bt.id = b.batch_id JOIN courses co ON co.id = bt.course_id JOIN learners l ON l.id = b.learner_id WHERE o.id = $1 AND o.account_id = $2 AND o.invoice_no IS NOT NULL",
    [id, account.id],
  )).rows[0]);
  if (!o) notFound();
  const half = Math.round(o.gst_paise / 2);
  return (
    <section className="py-10">
      <article className="wrap max-w-3xl">
        <div className="card p-8">
          <header className="flex flex-wrap justify-between gap-4 border-b border-line pb-4">
            <div><h1 className="text-2xl font-bold">Tax invoice</h1><p className="font-mono text-sm">{o.invoice_no}</p></div>
            <div className="text-right text-sm"><p className="font-semibold">{SITE.legalName}</p><p className="text-muted">GSTIN: {process.env.SUPPLIER_GSTIN ?? "pending"}</p><p className="text-muted">{process.env.SUPPLIER_ADDRESS ?? "Registered address pending"}</p></div>
          </header>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted">Billed to</dt><dd>{account.phone.slice(0, 3)}•••••{account.phone.slice(-3)}</dd>
            <dt className="text-muted">Date</dt><dd>{new Date(o.paid_at).toLocaleDateString("en-IN", { dateStyle: "long" })}</dd>
            <dt className="text-muted">Payment ref</dt><dd className="font-mono">{o.provider_payment_id}</dd>
          </dl>
          <table className="mt-6 w-full text-sm">
            <thead><tr className="border-b border-line text-left text-muted"><th className="py-2">Item</th><th className="py-2 text-right">Amount</th></tr></thead>
            <tbody>
              <tr className="border-b border-line/60"><td className="py-2">{o.title} (learner: {o.first_name}) · SAC {process.env.SAC_CODE ?? "pending"}</td><td className="py-2 text-right">{inr(o.amount_paise - o.gst_paise)}</td></tr>
              <tr><td className="py-1 text-muted">CGST {GST_RATE / 2}%</td><td className="py-1 text-right">{inr(half)}</td></tr>
              <tr><td className="py-1 text-muted">SGST {GST_RATE / 2}%</td><td className="py-1 text-right">{inr(o.gst_paise - half)}</td></tr>
              <tr className="border-t border-line font-bold"><td className="py-2">Total</td><td className="py-2 text-right">{inr(o.amount_paise)}</td></tr>
            </tbody>
          </table>
          <p className="mt-6 text-xs text-muted">IGST applies instead of CGST and SGST for out-of-state customers. Final invoice format to be confirmed by your CA.</p>
        </div>
      </article>
    </section>
  );
}
