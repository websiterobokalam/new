import Link from "next/link";
import { notFound } from "next/navigation";
import { appContext, fmtDate } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { loadJourney, plainProgress } from "@/lib/learn/journey";
import { JourneyMap } from "@/components/app/JourneyMap";

export const metadata = { title: "Journey" };

export default async function LearnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { account, locale, t } = await appContext(`/app/learners/${id}`);
  const d = await asAccount(account, async (c) => {
    const l = (await c.query("SELECT id, first_name, age_band, interests, portfolio_public FROM learners WHERE id = $1 AND guardian_account_id = $2 AND erased_at IS NULL", [id, account.id])).rows[0];
    if (!l) return null;
    const nodes = await loadJourney(c, l);
    const bookings = (await c.query(
      "SELECT bk.status, co.title, b.starts_at FROM bookings bk JOIN batches b ON b.id = bk.batch_id JOIN courses co ON co.id = b.course_id WHERE bk.learner_id = $1 AND bk.guardian_account_id = $2 ORDER BY b.starts_at DESC",
      [id, account.id],
    )).rows;
    return { l, nodes, bookings };
  });
  if (!d) notFound();
  const badges = d.nodes.filter((n) => n.state === "built");
  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <p className="eyebrow">{t.journey}</p>
          <h1 className="display-lg mt-2">{d.l.first_name}</h1>
          <p className="lede mt-2">{plainProgress(d.l.first_name, d.nodes)}</p>
          <p className="mt-2 text-sm text-muted">Suggestions come only from finished builds and the interests you chose. We never track behaviour.</p>
        </header>
        <JourneyMap nodes={d.nodes} t={t} />
        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold">{t.badges}</h2>
            {badges.length === 0 ? <p className="mt-2 text-muted">{t.no_badges}</p> : (
              <ul className="mt-3 flex flex-wrap gap-2">{badges.map((b) => <li key={b.id} className="rounded-full bg-leafmist px-3 py-1 text-sm font-semibold text-navy">{b.title}</li>)}</ul>
            )}
            <p className="mt-4 text-sm text-muted">{d.l.portfolio_public ? "Portfolio is shareable by link." : t.portfolio_private}. No public leaderboards, ever.</p>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold">Classes</h2>
            {d.bookings.length === 0 ? <p className="mt-2 text-muted">{t.none_upcoming}</p> : (
              <ul className="mt-3 grid gap-2 text-sm">{d.bookings.map((b, i) => <li key={i} className="flex justify-between gap-3"><span>{b.title} · {fmtDate(b.starts_at, locale)}</span><span className="font-semibold">{t[b.status as "confirmed"] ?? b.status}</span></li>)}</ul>
            )}
          </div>
        </section>
        <Link href={`/app/learners/${id}/space`} className="btn btn-primary justify-self-start">{t.learner_mode}</Link>
      </div>
    </section>
  );
}
