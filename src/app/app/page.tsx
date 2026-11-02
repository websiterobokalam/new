import Link from "next/link";
import { appContext, fmtDate } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { loadJourney, plainProgress } from "@/lib/learn/journey";
import { currentConsents, hasRequired } from "@/lib/learn/consent";
import { MessageEducator, ReviewForm } from "@/components/app/Messaging";

export const metadata = { title: "Family home" };

export default async function FamilyHome() {
  const { account, locale, t } = await appContext("/app");
  const data = await asAccount(account, async (c) => {
    const learners = (await c.query("SELECT id, first_name, age_band, interests FROM learners WHERE erased_at IS NULL ORDER BY created_at")).rows;
    const withProgress = await Promise.all(learners.map(async (l) => {
      const nodes = await loadJourney(c, l);
      return { ...l, summary: plainProgress(l.first_name, nodes), built: nodes.filter((n) => n.state === "built").length, total: nodes.length, ready: hasRequired(await currentConsents(c, l.id)) };
    }));
    const upcoming = (await c.query(
      `SELECT bk.id, bk.status, l.first_name, co.title, co.kind, b.starts_at, b.mode, b.location, coalesce(fp.display_name, b.educator_label) AS educator_label, fp.id AS fellow_id
       FROM bookings bk JOIN learners l ON l.id = bk.learner_id JOIN batches b ON b.id = bk.batch_id JOIN courses co ON co.id = b.course_id LEFT JOIN fellow_profiles fp ON fp.id = b.educator_fellow_id
       WHERE b.starts_at > now() - interval '2 hours' AND bk.status IN ('confirmed','pending_payment') ORDER BY b.starts_at`,
    )).rows;
    const past = (await c.query(
      `SELECT bk.id, bk.status, bk.feedback, bk.next_step, l.first_name, co.title, b.starts_at, b.educator_fellow_id IS NOT NULL AS has_fellow,
              EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = bk.id) AS reviewed
       FROM bookings bk JOIN learners l ON l.id = bk.learner_id JOIN batches b ON b.id = bk.batch_id JOIN courses co ON co.id = b.course_id
       WHERE b.starts_at <= now() - interval '2 hours' ORDER BY b.starts_at DESC LIMIT 10`,
    )).rows;
    return { learners: withProgress, upcoming, past };
  });

  return (
    <section className="py-10">
      <div className="wrap grid gap-10 [&>*]:min-w-0">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t.app_home}</p>
            <h1 className="display-lg mt-2">{t.hello}.</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/learn/build-session" className="btn btn-primary">{t.book_build}</Link>
            <Link href="/app/learners/new" className="btn btn-ghost">{t.add_learner}</Link>
          </div>
        </header>

        <section aria-labelledby="learners-h">
          <h2 id="learners-h" className="display-md">{t.your_learners}</h2>
          {data.learners.length === 0 ? (
            <div className="card mt-4 p-6"><p>No learners yet.</p><Link className="btn btn-primary mt-4" href="/app/learners/new">{t.add_learner}</Link></div>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {data.learners.map((l) => (
                <li key={l.id} className="card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-2xl font-bold">{l.first_name}</h3><p className="text-sm text-muted">Age {l.age_band}</p></div>
                    <span className="rounded-full bg-panel px-3 py-1 font-mono text-xs">{l.built}/{l.total}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-panel"><div className="h-2 rounded-full bg-gradient-to-r from-sky via-aqua to-leaf" style={{ width: `${Math.max(4, (l.built / l.total) * 100)}%` }} /></div>
                  <p className="mt-3">{l.summary}</p>
                  {!l.ready && <p className="mt-2 text-sm font-semibold text-[#8A4B00] dark:text-spark">Classes paused: a required consent is off. <Link className="underline" href="/app/consent">Review</Link></p>}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                    <Link className="text-link underline" href={`/app/learners/${l.id}`}>{t.journey}</Link>
                    <Link className="text-link underline" href={`/app/learners/${l.id}/space`}>{t.learner_mode}</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="up-h">
          <h2 id="up-h" className="display-md">{t.upcoming}</h2>
          {data.upcoming.length === 0 ? <p className="mt-3 text-muted">{t.none_upcoming}</p> : (
            <ul className="mt-4 grid gap-3">
              {data.upcoming.map((b) => (
                <li key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-heading">{b.title} · {b.first_name}</p>
                    <p className="text-sm text-muted">{fmtDate(b.starts_at, locale)} · {b.mode === "online" ? "Online" : b.location}{b.educator_label ? <> · {b.fellow_id ? <Link className="underline" href={`/educators/${b.fellow_id}`}>{b.educator_label}</Link> : b.educator_label}</> : ""}</p>
                    {b.fellow_id && <MessageEducator bookingId={b.id} />}
                  </div>
                  <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold">{t[b.status as "confirmed"]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {data.past.length > 0 && (
          <section aria-labelledby="past-h">
            <h2 id="past-h" className="display-md">Attendance and feedback</h2>
            <ul className="mt-4 grid gap-3">
              {data.past.map((b) => (
                <li key={b.id} className="card p-4">
                  <p className="font-semibold text-heading">{b.title} · {b.first_name} · {t[b.status as "attended"] ?? b.status}</p>
                  {b.feedback && <p className="mt-1">{b.feedback}</p>}
                  {b.next_step && <p className="mt-1 text-sm text-muted">{t.next_up}: {b.next_step}</p>}
                  {b.status === "attended" && b.has_fellow && !b.reviewed && <ReviewForm bookingId={b.id} />}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card p-6">
          <h2 className="text-xl font-bold">Messages</h2>
          <p className="mt-1 text-muted">Message your child&apos;s educator from an upcoming class. Messages stay inside Robokalam and contact details are always blocked. <Link className="underline" href="/app/messages">Open messages</Link></p>
        </section>
      </div>
    </section>
  );
}
