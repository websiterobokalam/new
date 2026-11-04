import Link from "next/link";
import { Section, SectionHead } from "../Section";
import { DoorLink } from "../motion/DoorTransition";

/**
 * Robokalam as an EdTech technology company: what we build for schools,
 * why premium schools choose us, and how to start. Plain statements of what
 * we offer; no numbers until they are approved in the Claims Register.
 */

const I = {
  ai: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />,
  erp: <path d="M4 5h16v14H4zM4 9h16M9 9v10M13 13h4M13 16h3" />,
  lab: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 5v16M9 7h6M9 11h6" />,
  people: <path d="M9 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M17 11a2.5 2.5 0 1 0 0-5M16 14.5a5 5 0 0 1 5 5.5" />,
  code: <path d="M8 8l-4 4l4 4M16 8l4 4l-4 4M13.5 5l-3 14" />,
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9c-4-1.5-7-4.5-7-9V6zM9 12l2 2l4-4" />,
  link: <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />,
  star: <path d="M12 3l2.7 5.6l6.1.9l-4.4 4.3l1 6.1L12 17l-5.4 2.9l1-6.1L3.2 9.5l6.1-.9z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5 5L22 13.6L13.6 22l-2.3-2.3a4 4 0 0 0-5-5L4 12.4L12.4 4z" />,
  palette: <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5c0-1.2-1-1.5-1-2.5s.7-1.5 1.7-1.5H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01" />,
};
const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
);

const solutions = [
  { icon: I.ai, name: "AADHYA AI platform", tag: "Software", line: "An AI-powered learning platform: missions, projects and AI hints with teacher oversight, and progress for every class.", href: "/21c-lab" },
  { icon: I.erp, name: "21cschool ERP", tag: "Software", line: "School management software for timetables, attendance, staff and reports, connected to your labs and learning data.", href: "/21c-lab" },
  { icon: I.lab, name: "21C STEM & AI Labs", tag: "Hardware", line: "Turnkey robotics, IoT and AI labs: room design, furniture, kits, RK Brain chips and devices, installed and maintained.", href: "/21c-lab" },
  { icon: I.book, name: "Curriculum development", tag: "Curriculum", line: "Project-based curriculum from the early years to senior school: lesson plans, kits and assessments, shaped with your teachers.", href: "/21c-lab#curriculum" },
  { icon: I.people, name: "Training and support", tag: "People", line: "Teacher training, an on-site lab instructor option, and Kalamites for clubs, camps and events.", href: "/kalamites" },
  { icon: I.code, name: "Custom EdTech software", tag: "Studio", line: "Need something built? We design and build apps, portals and integrations for schools and EdTech companies.", href: "/studio" },
];

export function Solutions() {
  return (
    <Section id="solutions" label="Solutions for schools" className="scroll-mt-20">
      <div className="wrap">
        <SectionHead eyebrow="Solutions for schools" title="Software, AI, labs and curriculum. From one partner." lede="Most schools stitch together an app here, a lab vendor there and a curriculum from somewhere else. We build all of it to work together, and we run it with you." />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((s) => (
            <li key={s.name} data-stagger>
              <Link href={s.href} className="solution-card group flex h-full flex-col p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="solution-icon"><Icon d={s.icon} /></span>
                  <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">{s.tag}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{s.name}</h3>
                <p className="mt-2 text-fg">{s.line}</p>
                <span className="mt-auto pt-5 text-sm font-semibold text-link">Learn more <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

const reasons = [
  { icon: I.star, t: "Premium by design", d: "Labs designed around your campus, brand and timetable, with furniture, finishes and kits chosen to last." },
  { icon: I.link, t: "Everything connected", d: "Platform, ERP, lab equipment and curriculum share one picture of learning, so leaders see what's working." },
  { icon: I.shield, t: "Safe and private", d: "Parental consent, minimal child data and no advertising, built for India's DPDP Act. Child safety rules in every workflow." },
  { icon: I.chart, t: "Visible outcomes", d: "Class coverage, projects built and certificates in one dashboard, with an audit report you can download." },
  { icon: I.wrench, t: "Support that shows up", d: "Hardware tickets with the response time in your contract, tracked on a clock both of us can see." },
  { icon: I.palette, t: "Made to evolve", d: "New AI tools, kits and lessons arrive as technology moves, without replacing what you already have." },
];

export function WhySchools() {
  return (
    <Section id="why" label="Why premium schools choose Robokalam" className="why-band">
      <div className="wrap">
        <SectionHead eyebrow="Why schools choose Robokalam" title="A technology partner, not just a vendor." />
        <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <li key={r.t} data-stagger className="flex gap-4">
              <span className="solution-icon shrink-0"><Icon d={r.icon} /></span>
              <div><h3 className="text-lg font-bold">{r.t}</h3><p className="mt-1 text-muted">{r.d}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** A clear next step for school leaders. */
export function Consult() {
  return (
    <section aria-labelledby="consult-h" className="py-16">
      <div className="wrap">
        <div className="consult-card grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="kicker">For principals, directors and trustees</p>
            <h2 id="consult-h" className="display-md mt-3 !text-white">Plan your school&apos;s technology with us.</h2>
            <p className="mt-3 max-w-xl text-[#C9D6E3]">A walk-through of the platform, a visit to see the lab, and a plan sized to your classes, rooms and budget.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <DoorLink href="/21c-lab#demo" className="btn btn-primary">Book a consultation</DoorLink>
            <Link href="/21c-lab/planner" className="btn border border-white/30 text-white hover:border-[#00CBD6] hover:text-[#00CBD6]">Try the Lab Planner</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
