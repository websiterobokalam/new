import { fellowContext } from "@/lib/fellows/context";
import { ambassadorView } from "@/lib/market/ambassadors";
import { collegesIn } from "@/lib/market/cities";
import { SITE } from "@/lib/site";
import { inr } from "@/lib/money";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Campus Ambassador" };
const STAGE: Record<string, string> = { applied: "Applied", vetting: "In checks", live: "Live", waitlisted: "Waitlisted", paused: "Paused", suspended: "Suspended", removed: "Left" };
const ist = (x: Date) => new Date(x).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function Ambassador() {
  const { account, fellow } = await fellowContext("/app/fellow/ambassador");
  const [v, colleges] = await Promise.all([ambassadorView(account), collegesIn(fellow.city)]);
  const link = v.amb ? `${SITE.url}/fellows/apply?ref=${v.amb.code}` : null;

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <p className="eyebrow">Campus Ambassadors</p>
          <h1 className="display-lg mt-2">Bring classmates who&apos;d teach well</h1>
          <p className="mt-2 max-w-2xl text-muted">Ambassadors run short info sessions at their college and help classmates apply. You recruit Fellows only, never families or children, and you never promise earnings.</p>
        </header>

        <section className="card p-6" aria-labelledby="rules-h">
          <h2 id="rules-h" className="text-xl font-bold">The rules</h2>
          <ul className="mt-2 list-inside list-disc grid gap-1">
            <li>Talk to college students aged 18 and over. Never to school students or parents.</li>
            <li>Say &quot;steady part-time income&quot;. No earnings figures beyond the published, dated examples.</li>
            <li>No college logos, and never suggest your college endorses Robokalam.</li>
            <li>Use your link so we can count referrals. You see counts only, never names.</li>
            <li>{v.reward ? `Reward: ${inr(v.reward)} for each Fellow you referred who goes live.` : "There is no referral reward yet. If one is approved, we'll tell you 14 days before it starts."}</li>
          </ul>
        </section>

        {!v.amb && (
          <section className="card max-w-2xl p-6" aria-labelledby="apply-h">
            <h2 id="apply-h" className="text-xl font-bold">Apply</h2>
            <ul className="mt-2 grid gap-1 text-sm">
              {v.checks.checks.map((k) => <li key={k.label}><strong>{k.ok ? "Yes" : "Not yet"}</strong> · {k.label} <span className="text-muted">({k.detail})</span></li>)}
            </ul>
            {colleges.length === 0 ? <p className="mt-3 text-muted">Your college isn&apos;t on our list for {fellow.city} yet. Ask your point of contact to add it.</p> : (
              <div className="mt-4"><JsonForm url="/api/fellow/ambassador" submit="Apply to be an ambassador" done="Applied. A person will reply." fields={[
                { name: "collegeId", label: "Your college", type: "select", options: [["", "Choose"], ...colleges.map((c): [string, string] => [c.id, c.name])] },
                { name: "pitch", label: "Why you, and how you'd reach classmates", type: "textarea" },
              ]} /></div>
            )}
          </section>
        )}

        {v.amb && (
          <>
            <section className="card p-6" aria-labelledby="me-h">
              <h2 id="me-h" className="text-xl font-bold">{v.amb.college}</h2>
              <p className="mt-1"><strong>Status:</strong> {v.amb.status === "applied" ? "Applied, waiting for a person to review" : v.amb.status === "active" ? "Active" : v.amb.status}{v.amb.decision_note ? ` · ${v.amb.decision_note}` : ""}</p>
              {v.amb.status === "active" && link && <p className="mt-2 break-all">Your link: <code className="rounded bg-panel px-2 py-1">{link}</code></p>}
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {v.stages.length === 0 ? <p className="text-muted">No referrals yet.</p> : v.stages.map((s) => <div key={s.status}><dt className="text-sm text-muted">{STAGE[s.status] ?? s.status}</dt><dd className="text-2xl font-bold text-heading">{s.n}</dd></div>)}
              </dl>
            </section>
            {v.amb.status === "active" && (
              <section className="card p-6" aria-labelledby="ev-h">
                <h2 id="ev-h" className="text-xl font-bold">Info sessions</h2>
                <ul className="mt-3 grid gap-3">
                  {v.events.map((e) => (
                    <li key={e.id} className="border-t border-line pt-3">
                      <p><strong className="text-heading">{e.title}</strong> · {ist(e.planned_at)} · {e.venue} · {e.status}{e.attendees != null ? ` · ${e.attendees} attended` : ""}{e.note ? ` · ${e.note}` : ""}</p>
                      {e.status === "approved" && <div className="mt-2 max-w-xs"><JsonForm compact url={`/api/fellow/ambassador/events/${e.id}`} submit="Mark as held" done="Recorded" fields={[{ name: "attendees", label: `How many came to ${e.title}`, type: "number" }]} /></div>}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 max-w-md"><JsonForm url="/api/fellow/ambassador/events" submit="Propose an info session" done="Sent for approval" fields={[
                  { name: "title", label: "Title", defaultValue: "Teach with Kalam Fellows: info session" },
                  { name: "plannedAt", label: "When", type: "datetime" },
                  { name: "venue", label: "Where on campus" },
                ]} /></div>
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}
