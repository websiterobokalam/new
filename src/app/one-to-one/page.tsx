import type { Metadata } from "next";
import Link from "next/link";
import { ONE_TO_ONE_ACK } from "@/lib/learn/oneToOne";
import { StickyCta } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "One-to-one classes, with you in the loop",
  description: "How Robokalam runs one-to-one online classes for under-18s: your consent, a notice before and a summary after every session, recordings, and you can join any time.",
};

const steps = [
  ["You choose it", "One-to-one is off until you turn it on for your child in the Consent centre. It needs a confirmed email, so every notice reaches you."],
  ["You confirm how it works", "Before you book, you tick a short checklist: what's recorded, what you'll receive, and how to stop."],
  ["Before every session", "We email you the time, the educator's verified profile and how to join. You can watch or join any session without telling anyone."],
  ["During the session", "It's online on Robokalam and recorded. The educator can't contact your child anywhere else, and contact details in messages are blocked."],
  ["After every session", "You get the educator's written summary. The recording is kept for 30 days in case you or our Safeguarding Lead need it."],
];

const terms = [
  ["Who can book", "A parent or lawful guardian aged 18 or over, for their own child, after verifying their phone by OTP and confirming their email."],
  ["Specific consent", "One-to-one classes need a separate consent for each child, recorded with the notice version you saw, the time and your declaration. Group-class consent does not cover them."],
  ["Online only", "One-to-one classes for under-18s happen only online on Robokalam. There are no home visits, no meetings in person, and no other apps."],
  ["Recording", "Every session is recorded on the platform and kept for 30 days, or longer only if needed for a safety case. Recordings are never used for ads and never sold."],
  ["Your oversight", "You receive a notice before and a written summary after every session. These emails can't be switched off while one-to-one consent is on. You may join or watch any session at any time."],
  ["Who teaches", "Only experienced educators: a Robokalam trainer, or a Kalam Fellow at tier Fellow or above who is fully vetted (identity, background, references, child-safety and POCSO training), has accepted the one-to-one code of conduct, and has no open safety flag or case."],
  ["No contact elsewhere", "All contact stays on Robokalam. Educators may never ask for or share phone numbers, social media, email or private chats. Attempts are blocked and reported to the Safeguarding Lead."],
  ["Stopping", "You can withdraw one-to-one consent at any time from the Consent centre. It takes effect at once: no further one-to-one session will start, and you can request a refund for sessions not delivered under the published refund terms."],
  ["Safety", "Anyone can press the report button on any page. A named Safeguarding Lead responds within the published time. On a credible concern, the educator's access is suspended at once and we follow the reporting duty under the POCSO Act, 2012."],
  ["Your child's data", "We hold your child's first name, age band and progress only, under India's DPDP Act and Rules. You can see, correct, download or delete it, and withdraw any consent, from the Consent centre."],
];

export default function OneToOne() {
  return (
    <>
      <section className="py-12 sm:py-20">
        <div className="wrap max-w-4xl">
          <p className="eyebrow">For parents</p>
          <h1 className="display-lg mt-3">One-to-one classes, with you in the loop.</h1>
          <p className="lede mt-4 max-w-2xl">Some children learn best with an educator&apos;s full attention. We offer one-to-one classes online, and we built them so you always know what&apos;s happening: before, during and after every session.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/courses" className="btn btn-primary btn-square">Find a one-to-one class</Link>
            <Link href="/app/consent" className="font-semibold text-link underline-offset-4 hover:underline">Turn it on in the Consent centre</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-14" aria-labelledby="how-h">
        <div className="wrap max-w-4xl">
          <h2 id="how-h" className="display-md">How it works</h2>
          <ol className="mt-8 grid gap-6">
            {steps.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-4">
                <span aria-hidden className="font-mono text-lg text-heading">0{i + 1}</span>
                <div><h3 className="text-xl font-bold">{t}</h3><p className="mt-1 text-fg">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line bg-panel/50 py-14" aria-labelledby="ack-h">
        <div className="wrap max-w-4xl">
          <h2 id="ack-h" className="display-md">What you confirm before booking</h2>
          <ul className="mt-6 grid gap-3">{ONE_TO_ONE_ACK.map((a) => <li key={a} className="border-l-2 border-heading pl-4 text-lg">{a}</li>)}</ul>
        </div>
      </section>

      <section className="border-t border-line py-14" aria-labelledby="terms-h">
        <div className="wrap max-w-4xl">
          <h2 id="terms-h" className="display-md">The full terms</h2>
          <p className="mt-2 text-muted">The detail, in plain words. Draft for legal review.</p>
          <details className="card mt-6 p-5">
            <summary className="cursor-pointer text-lg font-semibold text-heading">Read the full terms for one-to-one classes</summary>
            <dl className="mt-4 grid gap-4">{terms.map(([h, b]) => <div key={h}><dt className="font-semibold text-heading">{h}</dt><dd className="mt-1 text-fg">{b}</dd></div>)}</dl>
          </details>
          <p className="mt-6"><Link className="font-semibold text-link underline" href="/child-safety">Our child-safety policy</Link></p>
        </div>
      </section>
      <StickyCta href="/courses" label="Find a one-to-one class" />
    </>
  );
}
