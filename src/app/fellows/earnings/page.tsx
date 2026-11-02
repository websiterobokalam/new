import type { Metadata } from "next";
import { EarningsCalculator } from "@/components/forms/EarningsCalculator";

export const metadata: Metadata = { title: "How Fellow pay works" };

const rules = [
  "Robokalam-curriculum gigs pay a fixed amount per session, shown before you accept.",
  "Every deduction is shown before you accept a gig.",
  "Payouts are weekly, with per-session breakdowns and downloadable statements.",
  "Demo, shadow, co-teach and Kalam Academy training hours are paid. We never ask for free trial classes.",
  "No incentives for converting families. Your pay never depends on selling.",
  "The formula behind ranking and gig matching is published. Changes come with 14 days' notice.",
];

export default function EarningsPage() {
  return (
    <section className="py-12 sm:py-20">
      <div className="wrap max-w-4xl">
        <p className="eyebrow">Kalam Fellows</p>
        <h1 className="display-lg mt-3">How pay works.</h1>
        <ul className="mt-8 grid gap-3">{rules.map((r) => <li key={r} className="card p-5">{r}</li>)}</ul>
        <div className="mt-10"><EarningsCalculator /></div>
      </div>
    </section>
  );
}
