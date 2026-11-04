import type { Metadata } from "next";
import { fellowRules } from "@/content/site";
import { Claim } from "@/components/Claim";

export const metadata: Metadata = { title: "Rules for teaching children", description: "The child-safety rules every Kalamite follows." };

const more = [
  "Kalamites see only what they need: a learner's first name, age band and progress.",
  "Messages are checked: phone numbers, social handles and contact details are blocked and flagged.",
  "Every learner screen has a one-tap report button that goes to a named Safeguarding Lead.",
  "Kalam Academy includes a mandatory child-safety and POCSO course before any contact with a child.",
  "Before removing a Kalamite we give written reasons, an enquiry and 7 days' notice, except where a child's safety needs immediate action.",
];

export default function SafetyPage() {
  return (
    <section className="py-12 sm:py-20">
      <div className="wrap max-w-3xl">
        <p className="eyebrow">Kalamites · child safety</p>
        <h1 className="display-lg mt-3">Rules for teaching children.</h1>
        <p className="lede mt-3">These are not guidelines. They are conditions of teaching on Robokalam.</p>
        <ol className="mt-10 grid gap-3">
          {[...fellowRules, ...more].map((r, i) => (
            <li key={r} className="card flex gap-4 p-5"><span className="font-mono text-link">{String(i + 1).padStart(2, "0")}</span><span>{r}</span></li>
          ))}
          <li className="card flex gap-4 p-5"><span className="font-mono text-link">{String(fellowRules.length + more.length + 1).padStart(2, "0")}</span>
            <span>Online class recordings: <Claim id="safety.recording-retention" fallback="kept for a fixed period, published before launch" />, then deleted unless held for an open safety case.</span></li>
        </ol>
        <p className="mt-8 text-sm text-muted">Safeguarding Lead, response time and grievance contact: published before launch.</p>
      </div>
    </section>
  );
}
