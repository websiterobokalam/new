import { fellowContext } from "@/lib/fellows/context";
import { earnings } from "@/lib/fellows/earnings";
import { inr } from "@/lib/money";

export const metadata = { title: "Earnings" };

export default async function Earnings() {
  const { account } = await fellowContext("/app/fellow/earnings");
  const e = await earnings(account);
  return (
    <section className="py-10"><div className="wrap grid gap-6 [&>*]:min-w-0">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Earnings</p><h1 className="display-lg mt-2">Every rupee, line by line.</h1></div>
        <a href="/api/fellow/statement" className="btn btn-ghost">Download statement (CSV)</a>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["This week (net)", inr(e.week.net)], ["Waiting for payout", inr(e.unpaidNet)], ["Next payout", e.nextPayout.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })]].map(([k, v]) => <div key={k} className="card p-5"><p className="text-sm text-muted">{k}</p><p className="mt-1 text-2xl font-bold text-heading">{v}</p></div>)}
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface" tabIndex={0} role="region" aria-label="Earnings lines">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-line text-muted"><th className="p-3">Date</th><th className="p-3">What</th><th className="p-3 text-right">Gross</th><th className="p-3">Deductions</th><th className="p-3 text-right">Net</th><th className="p-3">Paid</th></tr></thead>
          <tbody>
            {e.lines.length === 0 && <tr><td colSpan={6} className="p-4 text-muted">Nothing yet. Academy modules and your demo are paid too.</td></tr>}
            {e.lines.map((l) => (
              <tr key={l.id} className="border-b border-line/60"><td className="p-3 whitespace-nowrap">{new Date(l.earned_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td><td className="p-3">{l.description}</td><td className="p-3 text-right tabular-nums">{inr(l.gross_paise)}</td><td className="p-3">{l.deductions.length ? l.deductions.map((d: { label: string; paise: number }) => `${d.label} ${inr(d.paise)}`).join(", ") : "None"}</td><td className="p-3 text-right font-semibold tabular-nums">{inr(l.net_paise)}</td><td className="p-3">{l.payout_id ? "Paid out" : "Next payout"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {e.payouts.length > 0 && (
        <section><h2 className="display-md">Payouts</h2>
          <ul className="mt-3 grid gap-2">{e.payouts.map((p) => <li key={p.id} className="card flex flex-wrap justify-between gap-3 p-4"><span>Week ending {new Date(p.period_end).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {p.status}{p.provider_ref ? ` · ref ${p.provider_ref}` : ""}</span><span className="font-semibold">{inr(p.net_paise)} <span className="text-sm font-normal text-muted">({inr(p.gross_paise)} − {inr(p.deductions_paise)})</span></span></li>)}</ul>
        </section>
      )}
    </div></section>
  );
}
