import { fellowContext } from "@/lib/fellows/context";
import { board } from "@/lib/fellows/gigs";
import { inr } from "@/lib/money";
import { GigActions } from "@/components/fellow/GigActions";

export const metadata = { title: "Gig board" };
const KIND: Record<string, string> = { live_batch: "Live Batch", campus_session: "Campus Session", weekend_workshop: "Weekend Workshop", doubt_desk: "Doubt Desk", project_mentor: "Project Mentor", build_session: "Free Build Session", shadow: "Shadow (paid)", co_teach: "Co-teach (paid)" };

export default async function GigBoard() {
  const { account } = await fellowContext("/app/fellow/gigs");
  const { items, fellow, weekMinutes } = await board(account);
  return (
    <section className="py-10"><div className="wrap grid gap-6 [&>*]:min-w-0">
      <header>
        <p className="eyebrow">Gig board · {fellow.city}</p>
        <h1 className="display-lg mt-2">Pick what fits.</h1>
        <p className="lede mt-2">Pay, duration, subject and deductions are shown before you accept. Declining costs you nothing.</p>
        <p className="mt-2 text-sm text-muted">This week: {Math.round(weekMinutes / 6) / 10} of {fellow.weekly_cap_hours} hours. Ordered by: your worlds first, then earliest start. <a className="underline" href="/app/fellow/growth#formula">How matching works</a></p>
      </header>
      {items.length === 0 ? <div className="card p-8 text-center"><p className="text-xl font-bold text-heading">No open gigs for you right now.</p><p className="mt-1 text-muted">New gigs from partner schools, camps and Code Week land here.</p></div> : (
        <ul className="grid gap-4">
          {items.map((g) => (
            <li key={g.id} className="card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-link">{KIND[g.kind] ?? g.kind} · {g.world} · {g.language.toUpperCase()}</p>
                <h2 className="mt-1 text-xl font-bold">{g.title}</h2>
                <p className="text-sm text-muted">{new Date(g.starts_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} · {g.duration_min} min · {g.mode === "online" ? "Online, recorded" : `${g.location} · adult present: ${g.responsible_adult}`}</p>
                <p className="mt-2 text-sm"><strong className="text-heading">{inr(g.pay_paise)}</strong> gross{g.deductions.length ? ` · ${g.deductions.map((d) => `${d.label} ${inr(d.paise)}`).join(", ")} · ${inr(g.net_paise)} to you` : " · no deductions"}{g.rate_sample && <span className="ml-2 rounded bg-[#FEEBD0] px-1.5 py-0.5 text-xs font-semibold text-[#6B3F00]">Sample rate</span>}</p>
                <p className="mt-1 text-xs text-muted">Why you see this: {g.why}</p>
              </div>
              <GigActions gigId={g.id} canAccept={g.canAccept} reason={g.reason} myStatus={g.myStatus} />
            </li>
          ))}
        </ul>
      )}
    </div></section>
  );
}
