import Link from "next/link";
import { fellowContext } from "@/lib/fellows/context";
import { STEPS, STEP_LABEL, PILOT } from "@/lib/fellows/core";
import { earnings } from "@/lib/fellows/earnings";
import { asAccount } from "@/lib/auth/session";
import { inr } from "@/lib/money";
import { JsonForm } from "@/components/app/JsonForm";
import { tierLabel } from "@/lib/fellows/gigs";

export const metadata = { title: "Kalamite home" };

const STEP_HREF: Partial<Record<(typeof STEPS)[number], string>> = { subject_test: "/app/fellow/test", demo: "/app/fellow/demo", identity: "/app/fellow/checks", background: "/app/fellow/checks", references: "/app/fellow/checks", academy: "/app/fellow/academy", terms: "/app/fellow/terms", shadow: "/app/fellow/gigs", co_teach: "/app/fellow/gigs" };
const BADGE: Record<string, string> = { passed: "bg-leafmist text-navy", submitted: "bg-panel text-heading", failed: "bg-[#fde8e7] text-[#8a1c13]", pending: "bg-surface text-muted border border-line" };

export default async function FellowHome() {
  const { account, fellow, steps } = await fellowContext("/app/fellow");
  const e = await earnings(account);
  const today = await asAccount(account, async (c) => (await c.query(
    `SELECT g.id, g.title, g.starts_at, g.mode, g.location FROM gig_assignments ga JOIN gigs g ON g.id = ga.gig_id
     WHERE ga.fellow_id = $1 AND ga.status = 'accepted' AND g.starts_at > now() - INTERVAL 3 HOUR ORDER BY g.starts_at LIMIT 5`, [account.id])).rows);
  const exam = fellow.exam_mode_until && new Date(fellow.exam_mode_until) >= new Date(new Date().toDateString());
  const done = STEPS.filter((s) => steps[s].status === "passed").length;

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{tierLabel(fellow.tier)} · {fellow.status}</p>
            <h1 className="display-lg mt-2">Hey {fellow.display_name.split(" ")[0]}.</h1>
          </div>
          {fellow.status === "live" && <Link href="/app/fellow/gigs" className="btn btn-primary">Open gig board</Link>}
        </header>

        {fellow.status === "waitlisted" && (
          <div className="card p-6"><p className="text-lg font-semibold text-heading">You&apos;re on the waitlist.</p><p className="mt-1 text-muted">The pilot runs in {PILOT.city} first. We&apos;ll message you when your city opens. Nothing for you to do now.</p></div>
        )}

        {fellow.status === "live" && (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Today and next", today.length ? `${today.length} session${today.length > 1 ? "s" : ""}` : "None booked"],
              ["Earned this week", inr(e.week.net)],
              ["Next payout", `${e.nextPayout.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${inr(e.unpaidNet)}`],
              ["Weekly cap", `${fellow.weekly_cap_hours} hours`],
            ].map(([k, v]) => <div key={k} className="card p-5"><p className="text-sm text-muted">{k}</p><p className="mt-1 text-2xl font-bold text-heading">{v}</p></div>)}
          </div>
        )}

        {today.length > 0 && (
          <section className="card p-6">
            <h2 className="text-xl font-bold">Your sessions</h2>
            <ul className="mt-3 grid gap-2">{today.map((g) => <li key={g.id} className="flex flex-wrap items-center justify-between gap-3"><span>{g.title} · {new Date(g.starts_at).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} · {g.mode === "online" ? "Online" : g.location}</span><Link className="btn btn-ghost !min-h-10 text-sm" href={`/app/fellow/gigs/${g.id}`}>Teach mode</Link></li>)}</ul>
          </section>
        )}

        {fellow.status !== "waitlisted" && (
          <section aria-labelledby="journey-h">
            <h2 id="journey-h" className="display-md">Your path to teaching <span className="text-base font-normal text-muted">· {done} of {STEPS.length}</span></h2>
            <ol className="mt-4 grid gap-2 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s} className="card flex items-center justify-between gap-3 p-4">
                  <span><span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span> <span className="font-semibold text-heading">{STEP_LABEL[s]}</span></span>
                  <span className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[steps[s].status]}`}>{steps[s].status}</span>
                    {steps[s].status !== "passed" && STEP_HREF[s] && <Link className="text-sm font-semibold text-link underline" href={STEP_HREF[s]!}>Go</Link>}
                  </span>
                </li>
              ))}
            </ol>
            {fellow.status === "vetting" && done === STEPS.length && <p className="mt-3 font-semibold text-heading">All steps passed. Our team will switch you live shortly.</p>}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold">Exam Mode</h2>
            <p className="mt-1 text-muted">{exam ? `On until ${new Date(fellow.exam_mode_until!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. No new gigs, no effect on your tier.` : "Pause all gigs during exams. No effect on your tier."}</p>
            <div className="mt-4">
              {exam ? <JsonForm url="/api/fellow/exam-mode" fixed={{ until: null }} fields={[]} submit="Turn Exam Mode off" done="Exam Mode off" compact />
                : <JsonForm url="/api/fellow/exam-mode" fields={[{ name: "until", label: "Pause until", type: "date" }]} submit="Turn on Exam Mode" done="Exam Mode on" compact />}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold">Your point of contact</h2>
            <p className="mt-1 text-muted">{fellow.point_of_contact ?? "Assigned when you go live. They speak English, Telugu or Hindi."}</p>
            <Link href="/app/fellow/support" className="mt-3 inline-block font-semibold text-link underline">Help, disputes and your rights</Link>
          </div>
        </section>
      </div>
    </section>
  );
}
