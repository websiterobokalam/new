import type { Metadata } from "next";
import Link from "next/link";
import { StickyCta } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Campus Ambassadors",
  alternates: { canonical: "/campus-ambassadors" },
  description: "Kalamites who help classmates at their college become Kalamites. For live Kalamites only. College students aged 18+.",
};

const steps = [
  ["Teach first", "Ambassadors are live Kalamites with at least five delivered sessions. You speak from experience, not a script."],
  ["Apply in the Kalamite app", "Pick your college and tell us how you'd reach classmates. A person reads every application."],
  ["Run an info session", "Propose a short session on campus. We approve it and give you materials that state the facts plainly."],
  ["Share your link", "Classmates apply with your link. You see how many are in checks and how many went live. Never their names."],
];

const rules = [
  "You talk to college students aged 18 and over. Never to school students, children or parents.",
  "No earnings promises. Say \"steady part-time income\" and point to the published, dated examples.",
  "No college logos, and nothing that suggests your college endorses Robokalam.",
  "Every Kalamite you refer goes through the same checks, Academy and safety training as you did.",
  "Any reward is per referred Kalamite who goes live, from an approved and published rate. Until one is approved, there is none, and we give 14 days' notice before it starts.",
];

export default function CampusAmbassadors() {
  return (
    <>
      <section className="py-12 sm:py-20">
        <div className="wrap max-w-4xl">
          <p className="eyebrow">Kalamites · Campus Ambassadors</p>
          <h1 className="display-lg mt-3">Bring the classmates who&apos;d teach well.</h1>
          <p className="lede mt-4 max-w-2xl">You already teach as a Kalamite. As an ambassador, you help students at your own college apply, and you tell them honestly what the work is like.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="/app/fellow/ambassador" className="btn btn-primary btn-square">Apply as an ambassador</a>
            <Link href="/kalamites/apply" className="font-semibold text-link underline-offset-4 hover:underline">Not a Kalamite yet? Apply to teach first</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-14" aria-labelledby="how-h">
        <div className="wrap max-w-4xl">
          <h2 id="how-h" className="display-md">How it works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2">
            {steps.map(([t, d], i) => (
              <li key={t}>
                <p className="font-mono text-sm text-heading">0{i + 1}</p>
                <h3 className="mt-1 text-xl font-bold">{t}</h3>
                <p className="mt-1 text-fg">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line bg-panel/50 py-14" aria-labelledby="rules-h">
        <div className="wrap max-w-4xl">
          <h2 id="rules-h" className="display-md">The rules, up front</h2>
          <ul className="mt-6 grid gap-3">
            {rules.map((r) => <li key={r} className="border-l-2 border-heading pl-4 text-lg">{r}</li>)}
          </ul>
          <p className="mt-8"><Link className="font-semibold text-link underline" href="/kalamite-terms">Read the full Kalamite terms</Link></p>
        </div>
      </section>
      <StickyCta href="/app/fellow/ambassador" label="Apply as an ambassador" />
    </>
  );
}
