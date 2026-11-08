import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StickyCta } from "@/components/PageHero";
import { Section, SectionHead } from "@/components/Section";
import { Claim } from "@/components/Claim";
import { gigs, fellowSteps, fellowJourney, fellowRules } from "@/content/site";
import { EarningsCalculator } from "@/components/forms/EarningsCalculator";
import { Faq } from "@/components/home/Sections";
import { AwaitingContent } from "@/components/AwaitingContent";
import { KalamBot, GigPhone } from "@/components/art/Small";
import { JsonLd, faqLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Kalamites: teach what you love, earn while you study",
  description: "Teach robotics, IoT, AI and coding with Robokalam as a Kalamite: part-time roles for college students in Hyderabad, Warangal and online, with training.",
  alternates: { canonical: "/kalamites" },
};

const why = [
  { t: "Pay", d: "Fixed pay per session, shown before you accept. Weekly payouts. Every deduction listed." },
  { t: "Flexibility", d: "Pick gigs around your timetable. Decline with no penalty. Exam Mode pauses everything." },
  { t: "Impact", d: "Be the reason a kid builds their first robot." },
  { t: "Proof of skill", d: "Teaching certificate, portfolio, letters for verified hours, and a path to Robokalam internships and jobs." },
];
const tiers = [
  { t: "Junior Kalamite", d: "Finished Kalam Academy. Shadowing, then co-teaching." },
  { t: "Kalamite", d: "Teaching your own batches." },
  { t: "Senior Kalamite", d: "Mentoring, workshops, project reviews." },
  { t: "Lead Kalamite", d: "Leading teams and shaping courses." },
];
const fellowFaqs = [
  { q: "Who can join?", a: "Students aged 18 and over at any college or university: engineering, degree, MS and more, in India or abroad. Your college does not need to partner with us. We open cities and online roles step by step; until yours opens, you join the waitlist and get training updates." },
  { q: "Who is a Kalamite?", a: "Everyone who builds Robokalam: our team, trainers and lab instructors, and the students who teach with us. Students start as Junior Kalamites and grow through the levels." },
  { q: "Do I pay anything to join?", a: "No. Never. Training hours in Kalam Academy are paid, and so are demo and shadow sessions." },
  { q: "Is this a job? How much will I earn?", a: "It is flexible, part-time teaching work. Think of it as steady part-time income, not a salary. The calculator shows an estimate, not a promise, once rates are published." },
  { q: "What if I say no to a gig?", a: "Nothing happens. Declining a gig carries no penalty and does not affect your tier." },
  { q: "Will I teach children alone or at their homes?", a: "Never at homes. One-to-one classes happen only online on Robokalam, recorded, with the parent's consent, a notice to the parent before and your written summary after every session, and the parent free to join. They're open to experienced Kalamites who accept the updated code of conduct. In-person gigs happen at a partner school or centre with a responsible adult present." },
  { q: "How are tiers decided?", a: "By reliability, learner progress and parent feedback, using a formula we publish. Not by popularity. Any change to the rules is announced 14 days ahead." },
];

export default function FellowsPage() {
  return (
    <>
      <JsonLd data={faqLd(fellowFaqs)} />
      <PageHero eyebrow="Educator door · Kalamites · 18+" tone="leaf" art={<GigPhone />}
        title={<>Teach what you love. <span className="grad-text">Earn while you study.</span></>}
        lede="Become a Kalamite: teach robotics, IoT, AI, coding, money basics and space to younger learners, from wherever you are, on your schedule. Fixed pay per session. Weekly payouts. Zero fees to join.">
        <Link href="/kalamites/apply" className="btn btn-primary !min-h-14 !px-8 text-lg" data-magnetic>Become a Kalamite <span aria-hidden>→</span></Link>
        <a href="#earnings" className="btn btn-ghost">How pay works</a>
      </PageHero>

      <Section label="Who are Kalamites" className="kalamite-story">
        <div className="wrap grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="kicker" data-stagger>Kalam + dynamite</p>
            <h2 className="display-lg mt-3 !text-white" data-stagger>Small spark. Big impact.</h2>
            <p className="mt-5 text-lg leading-relaxed text-[#C9D6E3]" data-stagger>Everyone who builds Robokalam is a Kalamite: our team, our trainers and lab instructors, and the students who teach with us. Like dynamite, a Kalamite is small, packed with energy, and sets big things in motion.</p>
            <p className="mt-4 text-lg leading-relaxed text-[#C9D6E3]" data-stagger>We can&apos;t reach every corner of India, and beyond, on our own. Kalamites can. You learn how technology really works in classrooms and labs, share what you know with the next generation, and help close the gap between what colleges teach and what industry needs.</p>
          </div>
          <ol className="grid gap-3" aria-label="Kalamite levels">
            {[["Junior Kalamite", "Students at any college or university: engineering, degree, MS and more. Start from wherever you are."], ["Kalamite", "Teaching your own batches, online or at partner schools."], ["Senior Kalamite", "Mentoring others, running workshops, reviewing projects."], ["Lead Kalamite", "Leading teams, shaping courses, opening new regions."]].map(([t, d], i) => (
              <li key={t} data-stagger className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-[#04202F]" style={{ background: i === 3 ? "#FFD31D" : "linear-gradient(135deg,#0098D6,#00CBD6)" }}>{i + 1}</span>
                <span><span className="block text-lg font-bold text-white">{t}</span><span className="text-[#C9D6E3]">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section label="How it works">
        <div className="wrap">
          <SectionHead eyebrow="How it works" title="Four steps to your first class." />
          <ol className="relative mt-10 grid gap-4 md:grid-cols-4">
            {fellowSteps.map((s, i) => (
              <li key={s.title} data-stagger className="card p-6">
                <span className="font-[family-name:var(--font-display)] text-5xl font-bold grad-text">0{i + 1}</span>
                <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section label="Gig types" className="bg-leafmist/60 dark:bg-panel-2">
        <div className="wrap">
          <SectionHead eyebrow="Gig board" title="Pick the gigs that fit you." lede="Pay, duration and subject are shown before you accept." />
          <ul className="mt-10 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]" aria-label="Gig types" tabIndex={0}>
            {gigs.map((g, i) => (
              <li key={g.name} data-stagger className="card min-w-[260px] snap-start p-6 sm:min-w-[300px]" data-tilt>
                <p className="font-mono text-xs uppercase tracking-wider text-link">Gig {String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-2xl font-bold">{g.name}</h3>
                <p className="mt-3 text-sm"><span className="text-muted">Where: </span>{g.where}</p>
                <p className="mt-1 text-sm"><span className="text-muted">Format: </span>{g.format}</p>
                {g.name === "Kalamite's Own Course" && <p className="mt-3 text-sm font-semibold text-heading"><Claim id="fellows.own-course-share" fallback="Revenue share published before launch." /></p>}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="earnings" label="Earnings calculator">
        <div className="wrap">
          <SectionHead eyebrow="Earnings" title="See the maths before you commit." lede={<>Estimates only. We never show a top earner as normal. <Link className="text-link underline" href="/kalamites/earnings">How pay works</Link>.</>} />
          <div className="mt-10"><EarningsCalculator /></div>
        </div>
      </Section>

      <Section label="Why Kalamites care" className="bg-panel/50">
        <div className="wrap grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <SectionHead eyebrow="Why Kalamites care" title="Built like the apps you already use. Fairer." />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {why.map((w) => <li key={w.t} data-stagger className="card p-5"><h3 className="text-lg font-bold">{w.t}</h3><p className="mt-1 text-sm text-muted">{w.d}</p></li>)}
            </ul>
          </div>
          <div className="card self-start p-6" data-stagger>
            <div className="flex items-center gap-3"><KalamBot className="h-12 w-12" /><p className="font-bold text-heading">Tiers</p></div>
            <ol className="mt-4 grid gap-3">
              {tiers.map((t, i) => (
                <li key={t.t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white dark:bg-aqua dark:text-night">{i + 1}</span>
                  <span><span className="block font-semibold text-heading">{t.t}</span><span className="text-sm text-muted">{t.d}</span></span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted">Rise through reliability, learner progress and parent feedback. During term, a weekly cap protects your studies: <Claim id="fellows.hours-cap" fallback="limit published with the pilot" />.</p>
          </div>
        </div>
      </Section>

      <Section label="Who can join and the path in">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="Who can join" title="College students, 18+." lede="From any strong college, any branch, as long as you know your subject and love explaining it. Full eligibility publishes with the pilot." />
            <p className="mt-6 text-sm text-muted">We do not use college logos, and no institute endorses Robokalam by your joining.</p>
          </div>
          <ol className="grid gap-2">
            {fellowJourney.map((j, i) => (
              <li key={j.title} data-stagger className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
                <span className="font-mono text-sm text-link">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="block font-semibold text-heading">{j.title}</span><span className="text-sm text-muted">{j.detail}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section label="Safety rules" className="bg-night text-[#e3eff5]">
        <div className="wrap">
          <p className="eyebrow !text-[#7FD0F2]">Safety rules · stated with pride</p>
          <h2 className="display-lg mt-3 max-w-3xl !text-white">The rules that make parents trust you.</h2>
          <ul className="mt-10 grid gap-3 md:grid-cols-2">
            {fellowRules.map((r) => <li key={r} data-stagger className="rounded-2xl border border-white/10 bg-white/5 p-5 text-[#e3eff5]">{r}</li>)}
          </ul>
          <Link href="/kalamites/safety" className="btn mt-8 border border-white/25 text-white">Read all the rules</Link>
        </div>
      </Section>

      <AwaitingContent title="Kalamite stories" need="Real Kalamite stories after the pilot launches. No invented stories before then." />
      <Faq items={fellowFaqs} />
      <div className="h-20 md:hidden" />
      <StickyCta href="/kalamites/apply" label="Become a Kalamite" />
    </>
  );
}
