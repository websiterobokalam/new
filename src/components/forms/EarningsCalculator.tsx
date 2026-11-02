"use client";
import { useState } from "react";
import { rateCard, estimateWeekly } from "@/content/rates";

export function EarningsCalculator() {
  const [gig, setGig] = useState(rateCard.rates[0].gig);
  const [sessions, setSessions] = useState(4);
  const rate = rateCard.rates.find((r) => r.gig === gig)!;
  const ready = rateCard.approved && rate.perSession !== null && rateCard.deductions.every((d) => d.percent !== null);
  const est = ready ? estimateWeekly(rate.perSession!, sessions, rateCard.deductions.map((d) => d.percent!)) : null;
  const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="card grid gap-6 p-5 sm:p-8 lg:grid-cols-2">
      <div className="grid content-start gap-5">
        <label className="field">
          <span>Gig type</span>
          <select className="input" value={gig} onChange={(e) => setGig(e.target.value)}>
            {rateCard.rates.map((r) => <option key={r.gig}>{r.gig}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Sessions a week: <output className="font-mono">{sessions}</output></span>
          <input type="range" min={1} max={12} value={sessions} onChange={(e) => setSessions(Number(e.target.value))} className="accent-[var(--color-navy)]" />
        </label>
        <p className="text-sm text-muted">During term, a weekly hours cap protects your studies. Exam Mode pauses work with no ranking loss.</p>
      </div>
      <div className="rounded-2xl bg-panel p-5" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">Estimate, not a promise</p>
        {est ? (
          <>
            <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold text-heading">{inr(est.net)}<span className="text-lg font-semibold text-muted"> / week</span></p>
            <dl className="mt-4 grid gap-1 text-sm">
              <div className="flex justify-between"><dt>{sessions} × {inr(rate.perSession!)}</dt><dd>{inr(est.gross)}</dd></div>
              <div className="flex justify-between"><dt>Deductions</dt><dd>− {inr(est.deductions)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">Rates as of {rateCard.asOf}. Actual pay depends on gigs you accept.</p>
          </>
        ) : (
          <>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-heading">Rates publish before the pilot opens.</p>
            <p className="mt-2 text-sm">How your pay is worked out:</p>
            <p className="mt-2 rounded-xl bg-surface p-3 font-mono text-sm">pay = sessions × fixed rate per session − deductions shown up front</p>
            <p className="mt-3 text-sm text-muted">We will not show a number until the rate card is approved and dated.</p>
          </>
        )}
      </div>
    </div>
  );
}
