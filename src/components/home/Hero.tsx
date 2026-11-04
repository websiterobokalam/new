import { doors } from "@/content/site";
import { DoorLink } from "../motion/DoorTransition";

/**
 * Home hero, in the original robokalam.com style: the night background, the
 * blue-to-teal signature gradient, a yellow kicker, and a real photo of a
 * Robokalam 21C AI & Robotics lab. Below it, the three doors as bright tiles.
 */
export function Hero() {
  return (
    <>
      <section className="hero-night relative overflow-hidden text-white" aria-labelledby="hero-title">
        <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" />
        <div className="wrap relative grid items-center gap-12 pb-24 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-32">
          <div>
            <p className="kicker">AI · Robotics · Coding · IoT · Space</p>
            <h1 id="hero-title" className="hero-title mt-5 !text-white">
              Children here don&rsquo;t just use technology. They{" "}
              <span className="relative inline-block whitespace-nowrap">
                write
                <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full overflow-visible">
                  <path className="pen-write" style={{ ["--len" as string]: 260 }} d="M3 13 C 40 6, 90 5, 130 9 S 185 14, 197 6" fill="none" stroke="#FFD31D" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>{" "}
              it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#C9D6E3] sm:text-xl">
              Hands-on robotics, IoT, AI, coding, money basics and space, built by hand from age 6. Live classes for learners, turnkey labs for schools, and paid teaching for college students.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <DoorLink href="/learn/build-session" className="btn btn-primary">Book a Free Build Session</DoorLink>
              <DoorLink href="/21c-lab" className="btn border border-white/30 text-white hover:border-[#00CBD6] hover:text-[#00CBD6]">See the 21C Lab</DoorLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#C9D6E3]" aria-label="What families can count on">
              {["Small live groups", "Parents in the loop", "Vetted educators", "Fees shown upfront"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4"><circle cx="8" cy="8" r="8" fill="#00CBD6" /><path d="m4.6 8.3 2.2 2.2 4.6-4.8" stroke="#04202F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative mx-auto w-full max-w-[600px]">
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
            <figcaption className="sr-only">A Robokalam 21C AI &amp; Robotics lab.</figcaption>
            {/* Floating notes: plain facts, no numbers we can't back up. */}
            <div aria-hidden className="float-card absolute -left-3 top-6 hidden sm:flex">
              <span className="float-dot bg-[#FFD31D]">⚡</span>
              <span><strong>First class</strong><br />You finish one build</span>
            </div>
            <div aria-hidden className="float-card absolute -bottom-5 right-4 flex [animation-delay:-3s]">
              <span className="float-dot bg-[#00CBD6]">🤖</span>
              <span><strong>21C AI &amp; Robotics Lab</strong><br />Turnkey for schools</span>
            </div>
          </figure>
        </div>
        <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-12 w-full sm:h-20">
          <path d="M0 80 V40 C 240 0, 480 0, 720 30 S 1200 70, 1440 20 V80 Z" fill="var(--bg)" />
        </svg>
      </section>

      {/* The three doors, as bright tiles. */}
      <section id="doors" className="relative scroll-mt-24 pb-6 pt-10" aria-labelledby="doors-h">
        <div className="wrap">
          <div className="text-center">
            <p className="eyebrow">Three ways in</p>
            <h2 id="doors-h" className="display-lg mt-2">Pick your door.</h2>
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
                  <a href={d.login} className="text-sm font-semibold text-[#00445F] underline-offset-4 hover:underline dark:text-[#9EEBF0]">{d.name} login</a>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
