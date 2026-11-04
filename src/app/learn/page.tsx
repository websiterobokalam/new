import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StickyCta } from "@/components/PageHero";
import { Section, SectionHead } from "@/components/Section";
import { programmes, worlds, faqs } from "@/content/site";
import { BuildSessionForm } from "@/components/forms/LeadForms";
import { ParentTrust, Faq } from "@/components/home/Sections";
import { JsonLd, faqLd } from "@/lib/jsonld";
import { LearnerArt } from "@/components/art/Small";

export const metadata: Metadata = {
  title: "Learn: build real tech, from age 6",
  description: "Live robotics, IoT, AI and coding classes for kids from age 6, online for families in Hyderabad, Warangal and across India. Book a Free Build Session.",
  alternates: { canonical: "/learn" },
};

const how = [
  { t: "Pick age and interest", d: "Tell us your child's age band and what they want to build." },
  { t: "Confirm and consent", d: "Verify your number by OTP, read a plain notice and give consent." },
  { t: "One live build", d: "A small live session with a vetted Kalamite or trainer. Your child finishes one build." },
  { t: "Plain next step", d: "You get the build, plain feedback and a next step with the full fee shown." },
];
const learnFaqs = faqs.filter((f) => /Build Session|teaches|one to one|loans|Financial/.test(f.q));

export default function LearnPage() {
  return (
    <>
      <JsonLd data={faqLd(learnFaqs)} />
      <PageHero art={<LearnerArt />} eyebrow="Learner door · students and parents" title={<>Build real tech, <span className="grad-text">from age 6.</span></>}
        lede="Small live batches. Real kits. Projects your child can hold, run and explain. Start with one free build session.">
        <a href="/learn/build-session" className="btn btn-primary" data-magnetic>Book a Free Build Session <span aria-hidden>→</span></a>
        <a href="#find" className="btn btn-ghost">Find a course</a>
      </PageHero>

      <Section id="find" label="Find a course">
        <div className="wrap">
          <SectionHead eyebrow="Find a course" title="By age, then by world." lede="Ashaer tracks run as levels, each ending in a project. Full schedules, fees and kit prices publish with the course catalogue." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((p) => (
              <li key={p.slug} data-stagger className="card flex flex-col p-6" data-tilt>
                <p className="font-mono text-xs uppercase tracking-wider text-link">{p.age ? `Age ${p.age}+` : "Teens and college"}</p>
                <h3 className="mt-1 text-2xl font-bold">{p.name}</h3>
                <p className="mt-2 text-muted">{p.outcome}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-muted">Batch</dt><dd className="font-semibold text-heading">Small group</dd></div>
                  <div><dt className="text-muted">Fee</dt><dd className="font-semibold text-heading">Shown before you pay</dd></div>
                </dl>
                <Link href={`/programs/${p.slug}`} className="mt-auto pt-5 text-sm font-semibold text-link">Details <span aria-hidden>→</span></Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Browse by world">
            {worlds.map((w) => <Link key={w.id} href={w.href} className="chip">{w.name}</Link>)}
          </div>
        </div>
      </Section>

      <Section label="How classes work" className="bg-panel/50">
        <div className="wrap">
          <SectionHead eyebrow="How the Free Build Session works" title="One session. One finished build. No pressure." />
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {how.map((h, i) => (
              <li key={h.t} data-stagger className="card p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-navy font-bold text-white dark:bg-aqua dark:text-night">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{h.t}</h3>
                <p className="mt-1 text-sm text-muted">{h.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section id="book" label="Book a Free Build Session">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <SectionHead eyebrow="Free Build Session" title="Book it yourself, or let us message you." lede={<>Book a time in four short steps: <a className="font-semibold text-link underline" href="/learn/build-session">book your Free Build Session</a>. Prefer we message you? Leave your details. No pop-ups, no calls you did not ask for.</>} />
          <BuildSessionForm />
        </div>
      </Section>
      <ParentTrust />
      <Faq items={learnFaqs} />
      <div className="h-20 md:hidden" />
      <StickyCta href="/learn/build-session" label="Book a Free Build Session" />
    </>
  );
}
