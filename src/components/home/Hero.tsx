import Link from "next/link";
import { doors } from "@/content/site";
import { DoorLink } from "../motion/DoorTransition";

/**
 * Home hero: Robokalam as an EdTech technology company for premium schools.
 * Software, AI, hardware labs and curriculum from one partner. The visual is
 * the real 21C lab photo with an illustrative preview of the platforms.
 */
export function Hero() {
  return (
    <section className="hero-night relative overflow-hidden text-white" aria-labelledby="hero-title">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" />
      <div className="wrap relative grid items-center gap-14 pb-28 pt-14 sm:pt-20 lg:grid-cols-[1.02fr_1fr] lg:pb-36">
        <div>
          <p className="kicker">EdTech software · AI · Robotics labs · Curriculum</p>
          <h1 id="hero-title" className="hero-title mt-5 !text-white">
            The technology behind{" "}
            <span className="relative inline-block whitespace-nowrap">
              future-ready
              <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full overflow-visible">
                <path className="pen-write" style={{ ["--len" as string]: 260 }} d="M3 13 C 40 6, 90 5, 130 9 S 185 14, 197 6" fill="none" stroke="#FFD31D" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>{" "}
            schools.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#C9D6E3] sm:text-xl">
            Robokalam is an EdTech technology company. We build the AI learning platform, school software, robotics and AI labs, and curriculum that premium schools run on, and we stay to run them with you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <DoorLink href="/21c-lab#demo" className="btn btn-primary">Book a consultation</DoorLink>
            <a href="#solutions" className="btn border border-white/30 text-white hover:border-[#00CBD6] hover:text-[#00CBD6]">Explore solutions</a>
          </div>
          <ul className="mt-8 grid gap-2 text-sm text-[#C9D6E3] sm:grid-cols-2" aria-label="What schools get">
            {["One partner: software, hardware, curriculum, training", "Built around your campus and brand", "Privacy and child safety by design", "Support with a contracted response time"].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <svg viewBox="0 0 16 16" aria-hidden className="mt-0.5 h-4 w-4 shrink-0"><circle cx="8" cy="8" r="8" fill="#00CBD6" /><path d="m4.6 8.3 2.2 2.2 4.6-4.8" stroke="#04202F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <ProductStage />
      </div>
      <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-12 w-full sm:h-20">
        <path d="M0 80 V40 C 240 0, 480 0, 720 30 S 1200 70, 1440 20 V80 Z" fill="var(--bg)" />
      </svg>
    </section>
  );
}

/** The real lab photo, with illustrative previews of the platforms layered on top. */
function ProductStage() {
  return (
    <figure className="relative mx-auto w-full max-w-[600px] pb-10 lg:pb-0">
      <div className="hero-photo relative overflow-hidden rounded-[1.75rem]">
        <img
          src="/images/21c-lab-1200.webp"
          srcSet="/images/21c-lab-720.webp 720w, /images/21c-lab-1200.webp 1200w"
          sizes="(min-width: 1024px) 600px, 92vw"
          width={1200}
          height={800}
          fetchPriority="high"
          alt="A Robokalam 21C AI & Robotics innovation lab: work benches with stools, robots on the shelf and science posters on the walls."
          className="block h-auto w-full"
        />
      </div>
      <figcaption className="sr-only">A Robokalam 21C AI &amp; Robotics lab, with previews of the AADHYA platform and the school portal.</figcaption>

      {/* AADHYA preview: illustrative, no data. */}
      <div aria-hidden className="ui-card absolute -left-4 -top-8 w-56 sm:-left-10">
        <p className="ui-label"><span className="ui-dot bg-[#0098D6]" />AADHYA · AI platform</p>
        <p className="mt-2 text-sm font-bold text-[#04202F]">Today&apos;s mission</p>
        <div className="mt-2 grid gap-1.5">
          {["Build the line follower", "Test the sensors", "Ask the AI for a hint"].map((t, i) => (
            <div key={t} className="flex items-center gap-2 text-xs text-[#33475C]"><span className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-[#00CBD6]" : "border border-[#9FB3C4]"}`} />{t}</div>
          ))}
        </div>
      </div>

      {/* School portal preview: illustrative, no data. */}
      <div aria-hidden className="ui-card absolute -bottom-2 right-0 w-60 sm:-right-6 [animation-delay:-3s]">
        <p className="ui-label"><span className="ui-dot bg-[#FFD31D]" />School portal</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Labs", "Classes", "Tickets"].map((t, i) => (
            <div key={t} className="rounded-lg bg-[#F2F6FF] p-2">
              <div className="h-1.5 rounded-full bg-[#D6E2EE]"><div className="h-1.5 rounded-full" style={{ width: `${[85, 65, 40][i]}%`, background: "linear-gradient(90deg,#0098D6,#00CBD6)" }} /></div>
              <p className="mt-1.5 text-[11px] font-semibold text-[#33475C]">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </figure>
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
