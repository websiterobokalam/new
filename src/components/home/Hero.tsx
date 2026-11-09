import Link from "next/link";
import { doors } from "@/content/site";
import { DoorLink } from "../motion/DoorTransition";
import { Mascot } from "../art/Mascot";

/**
 * Home hero: Robokalam as an EdTech technology company for premium schools.
 * Calm and hand-made on purpose: the mascot in front of one big sunny circle,
 * a speech bubble, and a few hand-drawn doodles kept clear of it. No orbits,
 * no glow, nothing crossing the mascot.
 */
export function Hero() {
  return (
    <section className="hero-sky relative overflow-hidden" aria-labelledby="hero-title">
      <div className="wrap relative z-10 grid items-center gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24">
        <div>
          <p className="hero-kicker">EdTech software · AI · Robotics labs · Curriculum</p>
          <h1 id="hero-title" className="hero-title mt-4 text-heading">
            The technology behind{" "}
            <span className="relative inline-block whitespace-nowrap">
              future-ready
              <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full overflow-visible">
                <path className="pen-write" style={{ ["--len" as string]: 260 }} d="M3 13 C 40 6, 90 5, 130 9 S 185 14, 197 6" fill="none" stroke="#FFD31D" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </span>{" "}
            schools.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Robokalam is an EdTech technology company. We build the AI learning platform, school software, robotics and AI labs, and curriculum that premium schools run on, and we stay to run them with you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <DoorLink href="/21c-lab#demo" className="btn btn-primary">Book a consultation</DoorLink>
            <a href="#solutions" className="btn btn-ghost">Explore solutions</a>
          </div>
          <ul className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-2" aria-label="What schools get">
            {["One partner: software, hardware, curriculum, training", "Built around your campus and brand", "Privacy and child safety by design", "Support with a contracted response time"].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <svg viewBox="0 0 16 16" aria-hidden className="mt-0.5 h-4 w-4 shrink-0"><circle cx="8" cy="8" r="8" fill="#00A9B5" /><path d="m4.6 8.3 2.2 2.2 4.6-4.8" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <MascotStage />
      </div>
    </section>
  );
}

/** The mascot on a sunny circle, with a speech bubble and hand-drawn doodles around the edge. */
function MascotStage() {
  return (
    <figure className="hero-stage">
      <div aria-hidden className="hero-sun" />
      <div aria-hidden className="hero-ground" />
      <Mascot priority float={false} sizes="(min-width: 1024px) 340px, 60vw" className="hero-mascot" alt="The Robokalam mascot giving a thumbs up" />
      <p aria-hidden className="hero-bubble">Hi! Let&apos;s build something.</p>
      <Doodle kind="gear" className="hero-doodle d-gear" />
      <Doodle kind="bulb" className="hero-doodle d-bulb" />
      <Doodle kind="code" className="hero-doodle d-code" />
    </figure>
  );
}

/** Small hand-drawn marks, one stroke weight, brand navy. Decorative. */
function Doodle({ kind, className }: { kind: "gear" | "bulb" | "code"; className: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      {kind === "gear" && (<g {...common}><circle cx="24" cy="24" r="7" /><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11.3 11.3l4.2 4.2M32.5 32.5l4.2 4.2M11.3 36.7l4.2-4.2M32.5 15.5l4.2-4.2" /><circle cx="24" cy="24" r="13" /></g>)}
      {kind === "bulb" && (<g {...common}><path d="M17 30c-3-3-5-6-5-10a12 12 0 0 1 24 0c0 4-2 7-5 10v4H17z" /><path d="M19 39h10M21 43h6" /><path d="M24 16v8l3 3" /></g>)}
      {kind === "code" && (<g {...common}><path d="M16 14 6 24l10 10M32 14l10 10-10 10M27 10l-6 28" /></g>)}
    </svg>
  );
}

/** The three doors, now a secondary band lower on the page. */
export function Doors() {
  return (
    <section id="doors" className="relative scroll-mt-24 py-20 sm:py-24" aria-labelledby="doors-h">
      <div className="wrap">
        <div className="max-w-3xl">
          <p className="eyebrow">Not a school? There&apos;s a door for you too</p>
          <h2 id="doors-h" className="display-lg mt-2">Pick your door.</h2>
          <p className="lede mt-3">The same platform and curriculum power live classes for learners, and paid teaching for college students.</p>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3" role="list">
          {doors.map((d) => (
            <li key={d.id} data-door={d.id} data-door-card className={`door-tile door-${d.id} group flex flex-col`}>
              <span aria-hidden className="door-icon">{d.id === "learner" ? "🧒" : d.id === "school" ? "🏫" : "🎓"}</span>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-[#00445F] dark:text-[#9EEBF0]">{d.who}</p>
              <h3 className="mt-1 text-2xl font-bold !text-[#04202F] dark:!text-white">{d.name}</h3>
              <p className="mt-2 text-lg text-[#222] dark:text-[#E6EDF5]">{d.line}.</p>
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
                <DoorLink href={d.href} className="btn btn-primary">{d.cta}</DoorLink>
                <Link href={d.login} className="text-sm font-semibold text-[#00445F] underline-offset-4 hover:underline dark:text-[#9EEBF0]">{d.name} login</Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
