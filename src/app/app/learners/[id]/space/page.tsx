import Link from "next/link";
import { notFound } from "next/navigation";
import { appContext, fmtDate } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { loadJourney } from "@/lib/learn/journey";
import { KalamBot } from "@/components/art/Small";

export const metadata = { title: "Learner space" };

/**
 * The child-facing space, opened from the parent's account (under-18s do not
 * have their own login). Big type, one mission, no streaks, no leaderboards.
 */
export default async function LearnerSpace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { account, locale, t } = await appContext(`/app/learners/${id}/space`);
  const d = await asAccount(account, async (c) => {
    const l = (await c.query("SELECT id, first_name, age_band, interests FROM learners WHERE id = $1 AND erased_at IS NULL", [id])).rows[0];
    if (!l) return null;
    const nodes = await loadJourney(c, l);
    const next = (await c.query(
      "SELECT co.title, b.starts_at, b.mode FROM bookings bk JOIN batches b ON b.id = bk.batch_id JOIN courses co ON co.id = b.course_id WHERE bk.learner_id = $1 AND bk.status = 'confirmed' AND b.starts_at > now() - interval '2 hours' ORDER BY b.starts_at LIMIT 1",
      [id],
    )).rows[0];
    return { l, nodes, next };
  });
  if (!d) notFound();
  const mission = d.nodes.find((n) => n.recommended);
  const built = d.nodes.filter((n) => n.state === "built");
  return (
    <section className="py-10">
      <div className="wrap grid max-w-3xl gap-6">
        <div className="flex items-center gap-4">
          <KalamBot className="h-20 w-20" mood="wave" />
          <h1 className="display-lg">Hi {d.l.first_name}!</h1>
        </div>
        <div className="card grad-border p-6" data-lit="true">
          <p className="eyebrow">{t.todays_mission}</p>
          {mission ? (<><p className="mt-2 text-3xl font-bold text-heading">{mission.title}</p><p className="mt-1 text-lg">{mission.builds}.</p></>) : <p className="mt-2 text-lg">Ask your educator for your next build.</p>}
        </div>
        {d.next && <div className="card p-6"><p className="eyebrow">Next class</p><p className="mt-2 text-xl font-semibold">{d.next.title}</p><p className="text-muted">{fmtDate(d.next.starts_at, locale)}</p></div>}
        <div className="card p-6">
          <p className="eyebrow">Things you built</p>
          {built.length === 0 ? <p className="mt-2">Your first build will show up here.</p> : <ul className="mt-2 flex flex-wrap gap-2">{built.map((b) => <li key={b.id} className="rounded-full bg-leafmist px-3 py-1 font-semibold text-navy">⭐ {b.title}</li>)}</ul>}
        </div>
        <p className="text-sm text-muted">{t.ai_helper_note} Your work is private. If anything feels wrong, press the red button.</p>
        <Link href={`/app/learners/${id}`} className="text-sm font-semibold text-link underline">Grown-ups: back to the journey</Link>
      </div>
    </section>
  );
}
