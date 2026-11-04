import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { readiness, fmt, WINDOW_DAYS } from "@/lib/market/gate";
import { citiesWithDemand, collegesIn } from "@/lib/market/cities";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Marketplace readiness" };
const d = (x: Date) => new Date(x).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function Marketplace() {
  const { account } = await appContext("/app/ops/marketplace");
  if (account.role !== "ops") notFound();
  const [r, cities, colleges] = await Promise.all([readiness(), citiesWithDemand(), collegesIn()]);

  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <header>
        <h1 className="display-lg">Marketplace readiness</h1>
        <p className="mt-2 max-w-3xl text-muted">The open marketplace (Fellow-authored courses, new cities, Campus Ambassadors) starts only when fill rate, safety and parent satisfaction meet agreed targets. A rising safety, refund or complaint rate pauses growth. Last {WINDOW_DAYS} days ({d(r.window.from)} to {d(r.window.to)}), compared with the {WINDOW_DAYS} days before.</p>
      </header>

      <section className={`card p-6 ${r.open ? "border-heading" : ""}`} aria-labelledby="gate-h" data-gate={r.open ? "open" : r.gate.isOpen ? "paused" : "closed"}>
        <h2 id="gate-h" className="text-2xl font-bold">{r.open ? "Open" : r.gate.isOpen ? "Opened, but growth is paused" : "Closed"}</h2>
        {r.gate.changedAt && <p className="mt-1 text-sm text-muted">Last changed {d(r.gate.changedAt)}: {r.gate.note}</p>}
        {r.blockers.length > 0 ? (
          <><p className="mt-3 font-semibold">{r.gate.isOpen ? "Why growth is paused" : "What has to be true first"}</p>
          <ul className="mt-1 list-inside list-disc grid gap-1">{r.blockers.map((b) => <li key={b}>{b}</li>)}</ul></>
        ) : <p className="mt-3">Every condition is met.</p>}
        <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
          {!r.gate.isOpen && <JsonForm compact url="/api/ops/market/gate" fixed={{ action: "open" }} submit="Open the marketplace" done="Opened" fields={[{ name: "note", label: "Why now (recorded)" }]} />}
          {r.gate.isOpen && <JsonForm compact tone="danger" url="/api/ops/market/gate" fixed={{ action: "close" }} submit="Close the marketplace" done="Closed" fields={[{ name: "note", label: "Why (recorded)" }]} />}
        </div>
      </section>

      <section aria-labelledby="m-h">
        <h2 id="m-h" className="text-xl font-bold">Measures and targets</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {r.rows.map((m) => (
            <li key={m.id} className="card grid gap-2 p-5" data-metric={m.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold">{m.label}</h3>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${m.met && !m.rising ? "bg-leafmist text-navy" : "bg-[#fff1d6] text-[#7a4a00]"}`}>{m.target == null ? "No target" : m.value == null ? "No data" : m.met ? (m.rising ? "Met, but rising" : "Met") : "Not met"}</span>
              </div>
              <p><strong className="text-2xl text-heading">{m.value == null ? "–" : fmt(m.value)}</strong> {m.unit} <span className="text-sm text-muted">(from {m.n}; before: {m.previous == null ? "–" : fmt(m.previous)})</span></p>
              <p className="text-sm text-muted">{m.how}</p>
              <p className="text-sm">{m.target == null ? "No agreed target yet." : `Target: ${m.better === "higher" ? "at least" : "at most"} ${fmt(m.target)} ${m.unit}, set by ${m.setBy ?? "staff"} on ${d(m.setAt!)}.`}</p>
              <details><summary className="cursor-pointer text-sm font-semibold text-link">Set the agreed target</summary>
                <div className="mt-2 max-w-sm"><JsonForm compact url="/api/ops/market/targets" fixed={{ metric: m.id }} submit="Save target" done="Saved" fields={[
                  { name: "target", label: `${m.label} target (${m.better === "higher" ? "at least" : "at most"}, ${m.unit})`, type: "number", defaultValue: m.target ?? "" },
                  { name: "note", label: "Where it was agreed (optional)", optional: true },
                ]} /></div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="c-h">
          <h2 id="c-h" className="text-xl font-bold">Cities</h2>
          <ul className="mt-3 grid gap-2">
            {cities.map((c) => (
              <li key={c.slug} className="flex flex-wrap justify-between gap-2 border-t border-line pt-2">
                <span><strong className="text-heading">{c.name}</strong> · {c.status === "waitlist" ? "Waitlist" : c.status === "pilot" ? "Pilot" : "Open"}</span>
                <span className="text-sm text-muted">{c.live} live{c.status !== "waitlist" ? ` of ${c.max_live}` : ""} · {c.waitlisted} waiting · {c.colleges} colleges</span>
              </li>
            ))}
          </ul>
          <div className="mt-4"><JsonForm url="/api/ops/market/cities" fixed={{ action: "open" }} submit="Open this city" done="City opened. Waitlisted applicants there have moved to checks." fields={[
            { name: "name", label: "City to open" },
            { name: "maxLive", label: "Most live Fellows there", type: "number", defaultValue: 25 },
            { name: "note", label: "Why, and who agreed (recorded)" },
          ]} /></div>
          <p className="mt-2 text-sm text-muted">Opening a city needs the marketplace open. Applicants waiting there move to checks at once.</p>
        </section>
        <section className="card p-6" aria-labelledby="col-h">
          <h2 id="col-h" className="text-xl font-bold">Colleges</h2>
          <p className="mt-1 text-sm text-muted">Names only. No logos, and nothing that suggests a college endorses Robokalam.</p>
          <ul className="mt-3 grid gap-1 text-sm">{colleges.map((c) => <li key={c.id}>{c.name} · {c.city}{c.email_domain ? ` · @${c.email_domain}` : ""}</li>)}</ul>
          <div className="mt-4"><JsonForm url="/api/ops/market/colleges" submit="Add college" done="College added" fields={[
            { name: "name", label: "College name" },
            { name: "city", label: "College city" },
            { name: "emailDomain", label: "Student email domain (optional)", optional: true },
          ]} /></div>
        </section>
      </div>
    </div></section>
  );
}
