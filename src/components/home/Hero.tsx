import Link from "next/link";
import { doors, programmes } from "@/content/site";
import { CONTACT, SOCIAL } from "@/content/company";
import { DoorLink } from "../motion/DoorTransition";

/**
 * Home hero (Azurio-inspired): a very large two-tone headline centred over a
 * frosted photo of a real 21C lab, side tags to the two main doors, and a quiet
 * row of social links with "scroll to explore". Then a short intro with facts.
 */
export function Hero() {
  return (
    <section className="az-hero" aria-labelledby="hero-title">
      <div className="wrap az-hero-inner">
        <p className="eyebrow text-center">Robokalam · Literature of technologies</p>
        <div className="az-hero-stage">
          <figure className="az-hero-photo">
            <img
              src="/images/21c-lab-1200.webp"
              srcSet="/images/21c-lab-720.webp 720w, /images/21c-lab-1200.webp 1200w"
              sizes="(min-width: 768px) 600px, 92vw"
              width={1200}
              height={800}
              alt="A 21C AI & Robotics innovation lab with robots on the bench and science posters"
              fetchPriority="high"
              decoding="async"
            />
          </figure>
          <h1 id="hero-title" className="az-hero-title">
            Building the future <span className="tone">with robotics, AI &amp; smart labs</span>
          </h1>
        </div>
        <Link href="/learn" className="az-side az-side-left">Learn</Link>
        <Link href="/21c-lab" className="az-side az-side-right">Schools</Link>
        <p className="lede mx-auto mt-8 max-w-2xl text-center">
          The AI learning platform, school software, robotics labs and curriculum that future-ready schools run on, and live classes that get children building from age 6.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <DoorLink href="/21c-lab#demo" className="btn btn-primary">Book a consultation <span aria-hidden className="arr">↗</span></DoorLink>
          <Link href="/learn#book" className="btn btn-ghost">Free build session</Link>
        </div>
        <div className="az-hero-foot">
          <ul aria-label="Robokalam on social media" className="dim-list">
            {SOCIAL.slice(0, 4).map((x) => <li key={x.name}><a href={x.href} target="_blank" rel="noopener noreferrer" className="nav-mono !text-xs !text-muted hover:!text-heading">{x.name}</a></li>)}
          </ul>
          <a href="#intro" className="nav-mono !text-xs">Scroll to explore <span aria-hidden className="arr arr-down">↓</span></a>
        </div>
      </div>
    </section>
  );
}

/** A short statement and four plain facts, each on a hairline. */
export function Intro() {
  const tracks = programmes.filter((p) => p.age).length;
  const facts = [
    { n: "6+", t: "Age we start hands-on classes" },
    { n: String(tracks), t: "Ashaer tracks, from first circuits to AI" },
    { n: String(CONTACT.offices.length), t: `Offices: ${CONTACT.offices.map((o) => o.city).join(", ")}` },
    { n: "1", t: "Partner for software, labs, curriculum and training" },
  ];
  return (
    <section id="intro" className="scroll-mt-20 py-20 sm:py-28" aria-labelledby="intro-h">
      <div className="wrap grid gap-10 lg:grid-cols-[1fr_2fr]">
        <p className="eyebrow">About</p>
        <div>
          <h2 id="intro-h" className="display-md max-w-3xl !font-medium">
            Robokalam is an EdTech technology company. <span className="tone">We build the platform, software, labs and curriculum that future-ready schools run on, and we stay to run them with you.</span>
          </h2>
          <dl className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.t} className="border-t border-heading/40 pt-6">
                <dt className="sr-only">{f.t}</dt>
                <dd>
                  <span className="mono block text-5xl font-medium tracking-tight text-heading sm:text-6xl">{f.n}</span>
                  <span className="mono-tag mt-4 block max-w-[16rem]">{f.t}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
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
