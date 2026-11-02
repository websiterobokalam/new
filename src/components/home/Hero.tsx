import { doors } from "@/content/site";
import { IsoLab } from "../art/IsoLab";
import { RotatingBadge, RobotPreview, LabPreview, EarningsPreview } from "../art/Small";
import { DoorLink } from "../motion/DoorTransition";
import { SITE } from "@/lib/site";

const previews = { learner: <RobotPreview />, school: <LabPreview />, educator: <EarningsPreview /> };

/** Hero: the pen writes the name, the line runs down and splits into three doors. */
export function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-10 sm:pt-14" aria-labelledby="hero-title">
      {/* soft brand glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(60%_60%_at_70%_30%,rgba(92,198,236,.16),transparent_70%),radial-gradient(40%_50%_at_20%_20%,rgba(151,188,61,.14),transparent_70%)]" />
      {/* the lab floats behind the doors (desktop) */}
      <div aria-hidden className="pointer-events-none absolute right-[2%] top-0 hidden w-[600px] lg:block xl:w-[660px]">
        <div className="motion-safe:animate-[float_7s_ease-in-out_infinite]" data-anim-scope>
          <IsoLab className="h-auto w-full drop-shadow-[0_40px_40px_rgba(11,65,104,.18)]" />
        </div>
      </div>

      <div className="wrap relative">
        <div className="max-w-2xl">
          {/* 1. Page load: the pen writes the name */}
          <svg viewBox="0 0 520 112" className="h-auto w-[240px] sm:w-[320px]" role="img" aria-label="Robokalam, literature of technologies">
            <defs>
              <linearGradient id="pen-g" x1="0" x2="1"><stop offset="0" stopColor="#1AB0E2" /><stop offset=".55" stopColor="#5CC6EC" /><stop offset="1" stopColor="#97BC3D" /></linearGradient>
            </defs>
            <text x="4" y="66" fontFamily="var(--font-brand)" fontWeight="700" fontSize="62" letterSpacing="1"
              className="pen-write pen-fill" style={{ ["--len" as string]: 1600 }} stroke="url(#pen-g)" strokeWidth="1.4" fill="var(--heading)">
              ROBOKALAM
            </text>
            <text x="6" y="104" fontFamily="var(--font-instrument), Arial, sans-serif" fontWeight="500" fontSize="27" fill="#97BC3D">literature of technologies</text>
          </svg>
          <h1 id="hero-title" className="display-xl mt-6">
            Pick your door.
            <br />
            <span className="grad-text">Start building.</span>
          </h1>
          <p className="lede mt-5 max-w-xl">{SITE.positioning} Robotics, IoT, AI, coding, money basics and space, built by hand from age 6.</p>
        </div>
        {/* phones and tablets: the lab sits in the flow, never behind text */}
        <div aria-hidden className="mx-auto mt-6 w-full max-w-[460px] lg:hidden">
          <div className="motion-safe:animate-[float_7s_ease-in-out_infinite]" data-anim-scope>
            <IsoLab idp="iso-m" className="h-auto w-full" />
          </div>
        </div>

        <RotatingBadge className="absolute right-[38%] top-[250px] hidden h-32 w-32 lg:block xl:right-[40%]" />

        {/* 2. The line splits into three branches, one per door */}
        <div className="doors relative mt-8 lg:mt-4">
          <svg viewBox="0 0 1000 90" preserveAspectRatio="none" className="hidden h-[90px] w-full md:block" aria-hidden>
            <defs><linearGradient id="br-g" x1="0" x2="1"><stop offset="0" stopColor="#1AB0E2" /><stop offset=".5" stopColor="#5CC6EC" /><stop offset="1" stopColor="#97BC3D" /></linearGradient></defs>
            <path className="branch-trunk" pathLength={1} d="M500 0 V30" stroke="url(#br-g)" strokeWidth="2.5" fill="none" />
            {[["learner", "M500 30 C 500 60, 167 40, 167 90"], ["school", "M500 30 V90"], ["educator", "M500 30 C 500 60, 833 40, 833 90"]].map(([id, d]) => (
              <path key={id} className={`branch branch-${id}`} pathLength={1} d={d} stroke="url(#br-g)" strokeWidth="2.5" fill="none" />
            ))}
          </svg>
          <ul className="grid gap-4 md:grid-cols-3 md:gap-6" role="list">
            {doors.map((d, i) => (
              <li key={d.id} data-door={d.id} className="group" style={{ ["--door" as string]: d.accent, animationDelay: `${0.15 + i * 0.08}s` }}>
                <div data-door-card data-tilt className="grad-border card relative flex h-full flex-col overflow-hidden p-5 sm:p-6 motion-safe:animate-[door-in_.8s_cubic-bezier(.22,1,.36,1)_both] [animation-delay:inherit]">
                  <div className="mb-4 h-24 overflow-hidden rounded-xl bg-panel/70 p-2 transition-[height] duration-500 md:group-hover:h-32 md:group-focus-within:h-32">
                    {previews[d.id]}
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{d.who}</p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{d.name}</h2>
                  <p className="mt-2 text-lg leading-snug text-fg">{d.line}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                    <DoorLink href={d.href} className="btn btn-primary" data-magnetic>
                      {d.cta}
                      <span aria-hidden>→</span>
                    </DoorLink>
                    <a href={d.login} className="text-sm font-semibold text-link underline-offset-4 hover:underline">
                      {d.name} login
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
