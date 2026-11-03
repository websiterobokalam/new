import { doors } from "@/content/site";
import { DoorLink } from "../motion/DoorTransition";

/**
 * Hero: a page from a learner's lab notebook. Graph paper, a code card taped
 * on, a circuit sketched in pen with margin notes. "Literature of
 * technologies": children here write technology, they don't just use it.
 */
export function Hero() {
  return (
    <section className="relative pb-16 pt-10 sm:pt-16" aria-labelledby="hero-title">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <p className="flex items-center gap-3 text-sm font-semibold text-muted">
            <span aria-hidden className="h-px w-8 bg-current" />
            Robokalam · literature of technologies
          </p>
          <h1 id="hero-title" className="hero-title mt-5">
            Children here don&rsquo;t just use technology. They{" "}
            <span className="relative inline-block whitespace-nowrap">
              write
              <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full overflow-visible">
                <path className="pen-write" style={{ ["--len" as string]: 260 }} d="M3 13 C 40 6, 90 5, 130 9 S 185 14, 197 6" fill="none" stroke="var(--color-leaf)" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>{" "}
            it.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg sm:text-xl">
            Robotics, IoT, AI, coding, money basics and space, built by hand from age 6. We run classes for learners, labs for schools, and a
            programme for the college students who teach them.
          </p>
          <p className="mt-6">
            <a href="#doors" className="font-semibold text-link underline decoration-2 underline-offset-[6px] hover:decoration-[3px]">
              Find where you start
            </a>
          </p>
        </div>

        <Notebook />
      </div>

      {/* The three doors, set as a plain index rather than a row of cards. */}
      <div id="doors" className="wrap mt-20 scroll-mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-heading pb-3">
          <h2 className="text-3xl font-bold sm:text-4xl">Pick your door.</h2>
          <p className="text-muted">Three ways in. Each has its own login.</p>
        </div>
        <ol className="grid md:grid-cols-3" role="list">
          {doors.map((d, i) => (
            <li
              key={d.id}
              data-door={d.id}
              data-door-card
              className="flex flex-col border-b border-line py-7 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0 md:[&:not(:first-child)]:border-l"
            >
              <p className="flex items-baseline gap-3 text-sm text-muted">
                <span className="font-mono text-heading">0{i + 1}</span>
                {d.who}
              </p>
              <h3 className="mt-3 text-2xl font-bold">{d.name}</h3>
              <p className="mt-1 text-lg text-fg">{d.line}.</p>
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
                <DoorLink href={d.href} className="btn btn-primary btn-square">
                  {d.cta}
                </DoorLink>
                <a href={d.login} className="text-sm font-semibold text-link underline-offset-4 hover:underline">
                  {d.name} login
                </a>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** The notebook page. Decorative: the words beside it carry the meaning. */
function Notebook() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[540px] select-none">
      <div className="notebook relative rotate-[-1.2deg] rounded-sm px-6 pb-8 pt-10 sm:px-9">
        {/* margin rule */}
        <span className="absolute inset-y-0 left-10 w-px bg-[#e4a0a0]/70 sm:left-14" />
        <p className="hand relative pl-8 text-2xl sm:pl-10">Lesson 4: make the LED blink</p>

        {/* circuit, sketched in pen */}
        <svg viewBox="0 0 420 210" className="relative mt-2 h-auto w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g className="sketch" stroke="var(--ink-pen)" strokeWidth="2.4">
            {/* wires */}
            <path className="pen-write" style={{ ["--len" as string]: 900 }} d="M70 60 C 120 58, 170 61, 196 60 M 262 60 C 300 59, 330 62, 352 61 L 351 150 C 300 151, 230 149, 196 150 M 150 150 C 120 151, 90 149, 70 150 L 71 60" />
            {/* resistor */}
            <path className="pen-write" style={{ ["--len" as string]: 300 }} d="M196 60 l7 -11 l10 22 l10 -22 l10 22 l10 -22 l10 22 l9 -11" />
            {/* LED: triangle and bar */}
            <path d="M150 136 L 150 164 L 176 150 Z M 178 134 L 178 166" />
            <path d="M160 128 l8 -12 m-3 0 h3 v3 M 170 132 l8 -12 m-3 0 h3 v3" strokeWidth="1.8" />
            <path d="M176 150 H 196" />
            {/* battery */}
            <path d="M58 92 H 84 M 64 102 H 78 M 58 112 H 84 M 64 122 H 78" />
          </g>
          {/* margin notes */}
          <g className="hand-svg" fill="var(--ink-note)">
            <text x="200" y="36" fontSize="22">220Ω, so it doesn&apos;t pop</text>
            <text x="200" y="196" fontSize="22">long leg = +</text>
            <text x="4" y="186" fontSize="22">9V</text>
          </g>
          <path d="M196 186 C 186 182, 180 176, 172 168" stroke="var(--ink-note)" strokeWidth="1.8" />
          <path d="M168 172 l4 -4 l1 6" stroke="var(--ink-note)" strokeWidth="1.8" />
        </svg>

        {/* code card, taped on */}
        <div className="code-card relative ml-auto mt-3 w-[92%] rotate-[1.6deg] rounded-sm p-4 font-mono text-[13px] leading-6 sm:text-sm">
          <span className="tape -left-3 -top-3 rotate-[-18deg]" />
          <span className="tape -right-3 -top-3 rotate-[16deg]" />
          <pre className="whitespace-pre-wrap">
            <span className="code-cm"># blink.py</span>
            {"\n"}
            <span className="code-kw">while</span> True:
            {"\n"}
            {"    "}led.on(){"\n"}
            {"    "}sleep(<span className="code-num">0.5</span>){"\n"}
            {"    "}led.off(){"\n"}
            {"    "}sleep(<span className="code-num">0.5</span>)
          </pre>
        </div>
        <p className="hand mt-4 pl-8 text-xl sm:pl-10">it works!! next: make it fade</p>
      </div>
    </div>
  );
}
