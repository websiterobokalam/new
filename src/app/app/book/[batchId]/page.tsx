import Link from "next/link";
import { notFound } from "next/navigation";
import { appContext, fmtDate } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { currentConsents, hasRequired } from "@/lib/learn/consent";
import { ageFits } from "@/lib/learn/booking";
import { gstSplit, inr } from "@/lib/money";
import { Checkout } from "@/components/app/Checkout";

export const metadata = { title: "Book a class" };

/** Fee shown in full, GST included, before any payment. */
export default async function BookPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(batchId)) notFound();
  const { account, locale, t } = await appContext(`/app/book/${batchId}`);
  const d = await asAccount(account, async (c) => {
    const b = (await c.query("SELECT b.id, b.starts_at, b.mode, b.location, b.language, c.title, c.slug, c.sessions, c.age_min, c.age_max, c.fee_paise, c.fee_approved, c.sample, c.kit FROM batches b JOIN courses c ON c.id = b.course_id WHERE b.id = $1", [batchId])).rows[0];
    if (!b) return null;
    const ls = (await c.query("SELECT id, first_name, age_band FROM learners WHERE erased_at IS NULL ORDER BY created_at")).rows;
    const learners = await Promise.all(ls.map(async (l) => ({ ...l, ready: hasRequired(await currentConsents(c, l.id)), fits: ageFits(l.age_band, b.age_min, b.age_max) })));
    return { b, learners };
  });
  if (!d) notFound();
  const { b } = d;
  const fee = b.fee_paise as number | null;
  const published = fee !== null && (fee === 0 || b.fee_approved || b.sample);
  const split = fee ? gstSplit(fee) : null;
  return (
    <section className="py-10">
      <div className="wrap grid max-w-3xl gap-6">
        <header>
          <p className="eyebrow">Book</p>
          <h1 className="display-lg mt-2">{b.title}</h1>
          <p className="lede mt-2">{fmtDate(b.starts_at, locale)} · {b.mode === "online" ? "Online" : b.location} · {b.sessions} classes</p>
        </header>
        <div className="card p-6">
          <h2 className="text-xl font-bold">{t.fee}</h2>
          {!published ? <p className="mt-2">The fee for this course is not published yet, so it cannot be booked.</p> : fee === 0 ? <p className="mt-2 text-2xl font-bold">{t.free}</p> : (
            <dl className="mt-3 grid gap-1">
              <div className="flex justify-between"><dt>Course fee</dt><dd>{inr(split!.net)}</dd></div>
              <div className="flex justify-between text-muted"><dt>GST</dt><dd>{inr(split!.gst)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-2xl font-bold text-heading"><dt>Total</dt><dd>{inr(split!.total)}</dd></div>
              {b.sample && <dd className="mt-2 rounded-lg bg-[#FEEBD0] px-3 py-2 text-sm font-semibold text-[#6B3F00]">{t.sample_fee}</dd>}
              {b.kit && <dd className="text-sm text-muted">Kit: {b.kit}</dd>}
            </dl>
          )}
          <p className="mt-3 text-sm text-muted">No loans, no financing, no multi-year plans. <Link className="underline" href="/app/orders">Refund terms</Link></p>
        </div>
        {published && (d.learners.length === 0 ? (
          <p>Add a learner first. <Link className="text-link underline" href="/app/learners/new">{t.add_learner}</Link></p>
        ) : (
          <Checkout batchId={b.id} learners={d.learners} payLabel={fee ? `${t.pay_now} ${inr(fee)}` : t.continue} />
        ))}
      </div>
    </section>
  );
}
