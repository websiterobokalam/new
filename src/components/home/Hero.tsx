import Link from "next/link";
import { doors } from "@/content/site";
import { DoorLink } from "../motion/DoorTransition";
import { Typewriter } from "./Typewriter";
import { OrbitSystem } from "../art/OrbitSystem";

const TYPED = ["AI.", "Robotics Labs.", "Smart Software.", "Young Innovators."];
const STRIP = ["AI & Robotics Labs", "STEM Curriculum", "Teacher Training", "AADHYA AI Platform", "Hyderabad · Warangal"];

/**
 * Home hero, after the first section of old.robokalam.com (the one people
 * remember), on a light background: the orbit on the left (a robot in a glowing
 * core, rings carrying robots, code windows, an arm, a satellite and a chip),
 * a typing headline on the right, and three cyan pill buttons.
 */
export function Hero() {
  return (
    <>
      <section className="hero-orbit-light relative overflow-hidden" aria-labelledby="hero-title">
        <div aria-hidden className="hero-halo" />
        <div className="wrap relative z-10 grid items-center gap-10 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1fr_1.08fr] lg:gap-14 lg:pb-24 lg:pt-16">
          <div className="order-2 lg:order-1">
            <div className="hero-orbit-stage">
              <OrbitSystem centre className="hero-orbit-main" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="hero-kicker">EdTech software · AI · Robotics labs · Curriculum</p>
            <h1 id="hero-title" className="hero-headline mt-4 text-heading">
              Building the future with{" "}
              <Typewriter words={TYPED} className="hero-typed" />
              <span className="sr-only">AI, robotics labs, smart software and young innovators.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Robokalam develops intelligent software ecosystems, AI-powered educational infrastructure, robotics labs, future-ready innovation systems and smart technology solutions for institutions, governments and next-generation innovators.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#solutions" className="pill pill-solid">Explore Solutions</a>
              <DoorLink href="/21c-lab" className="pill pill-soft">Innovation Ecosystem</DoorLink>
              <Link href="/about" className="pill pill-soft">View Vision</Link>
            </div>
          </div>
        </div>
      </section>
      <div className="hero-strip" aria-label="What Robokalam brings">
        <ul className="wrap">
          {STRIP.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </>
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
