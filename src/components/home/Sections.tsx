import Link from "next/link";
import { worlds, ladder, gigs, parentTrust, faqs, initiatives, doors, type WorldId } from "@/content/site";
import { Section, SectionHead } from "../Section";
import { Claim, Stat } from "../Claim";
import { approvedClaim, approvedClaims, claimText } from "@/lib/claims";
import { DoorLink } from "../motion/DoorTransition";
import { AwaitingContent } from "../AwaitingContent";

/* ---------- 2. Glass trust bar: approved proof only ---------- */
export function TrustBar() {
  const proof = ["lab.instructor", "lab.roadmap", "lab.hardware-sla", "curriculum.nep-cbse"].map(approvedClaim).filter(Boolean);
  // Commitments are policies we control, not claims about results.
  const commitments = ["Hands-on from age 6", "Vetted educators only", "Fees shown before you pay", "No home visits. One-to-one only online, with parents in the loop"];
  const items = [...proof.map((c) => claimText(c!)), ...commitments];
  return (
    <div className="bg-panel/60">
      <div className="wrap py-6">
        <p className="text-sm font-semibold text-heading">What we hold ourselves to</p>
        <ul className="mt-2 grid gap-x-8 gap-y-1 text-fg sm:grid-cols-2 lg:grid-cols-4" aria-label="Why families and schools trust Robokalam">
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- 4. Five worlds bento: the line changes shape per world ---------- */
function WorldMotif({ shape, color }: { shape: string; color: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, "data-draw": true };
  return (
    <svg viewBox="0 0 200 90" className="draw-on-power h-12 w-28" aria-hidden>
      {shape === "circuit" && (<><path {...common} d="M4 70 H50 V30 H100 V60 H150 V20 H196" />{[[50, 30], [100, 60], [150, 20]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" fill={color} />)}</>)}
      {shape === "pulse" && (<><path {...common} d="M4 50 H50 L62 20 L76 80 L90 35 L100 50 H196" /><path d="M110 50 H196" stroke={color} strokeWidth="3" className="pulse-run" fill="none" /></>)}
      {shape === "neural" && (
        <>
          {[[20, 20], [20, 70]].flatMap(([x1, y1]) => [[100, 15], [100, 45], [100, 75]].map(([x2, y2]) => <path key={`${x1}${y1}${x2}${y2}`} {...common} strokeWidth={1.6} d={`M${x1} ${y1} L${x2} ${y2}`} />))}
          {[[100, 15], [100, 45], [100, 75]].map(([x1, y1]) => <path key={`o${y1}`} {...common} strokeWidth={1.6} d={`M${x1} ${y1} L180 45`} />)}
          {[[20, 20], [20, 70], [100, 15], [100, 45], [100, 75], [180, 45]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill={color} />)}
        </>
      )}
      {shape === "growth" && (<><path {...common} d="M4 82 C 60 80, 90 70, 120 50 S 170 12, 196 8" /><path d="M4 86 H196" stroke="var(--line)" strokeWidth="2" /></>)}
      {shape === "orbit" && (<><ellipse cx="100" cy="45" rx="88" ry="28" {...common} transform="rotate(-12 100 45)" /><circle cx="100" cy="45" r="13" fill="#F7A21C" /><circle cx="176" cy="30" r="6" fill={color} /></>)}
      {shape === "code" && (<><path {...common} d="M60 20 L30 45 L60 70 M140 20 L170 45 L140 70 M112 14 L88 76" /></>)}
    </svg>
  );
}

const span: Record<WorldId, string> = {
  robotics: "md:col-span-2 md:row-span-2",
  iot: "",
  ai: "",
  finlit: "",
  space: "",
  coding: "",
};

export function WorldsBento() {
  return (
    <Section id="worlds" label="Five worlds">
      <div className="wrap">
        <SectionHead eyebrow="Five worlds, one shared skill" title="Pick a world. Build something real in it." lede="Every world has its own projects, kits and level path. Coding runs through all of them." />
        <ul className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-[auto_auto_auto]">
          {worlds.map((w) => (
            <li key={w.id} data-stagger className={span[w.id]}>
              <Link href={w.href} className="group card flex h-full flex-col p-6 transition-colors hover:border-heading">
                <div><WorldMotif shape={w.shape} color={w.accent} /></div>
                <h3 className={`mt-4 font-[family-name:var(--font-display)] font-bold ${w.id === "robotics" ? "text-4xl" : "text-2xl"}`}>{w.name}</h3>
                <p className="mt-2 text-fg">{w.line}</p>
                {w.note && <p className="mt-2 text-sm text-muted">{w.note}</p>}
                {w.id === "robotics" && (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Robotics programmes">
                    {["Electro Ashaers · 6+", "Robo Ashaers · 7+", "Robotics Summer Camp · 7+", "RK Brain chips", "ASHAER packs"].map((t) => (
                      <li key={t} className="rounded-full bg-panel px-3 py-1 text-sm font-medium text-heading">{t}</li>
                    ))}
                  </ul>
                )}
                <span className="mt-auto pt-5 text-sm font-semibold text-link">
                  {w.name} courses <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* ---------- 5. Learner ladder: age 6 to college ---------- */
export function LearnerLadder() {
  return (
    <Section id="ladder" label="Learner ladder" className="bg-leafmist/60 dark:bg-panel-2">
      <div className="wrap">
        <SectionHead eyebrow="The Ashaer ladder" title="From first circuit to first client." lede="Climb one level at a time. Each rung ends with something you built and can show." />
        <ol className="relative mt-12 grid gap-4 md:grid-cols-6">
          <svg aria-hidden viewBox="0 0 600 100" preserveAspectRatio="none" className="draw-on-power pointer-events-none absolute inset-x-0 top-6 hidden h-24 w-full md:block">
            <path data-draw pathLength={1} d="M10 95 C 120 95, 120 75, 110 75 S 220 60, 210 58 S 330 44, 320 42 S 430 28, 420 26 S 530 12, 590 6" fill="none" stroke="var(--color-sky)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </svg>
          {ladder.map((s, i) => (
            <li key={s.title} data-stagger className="relative md:pt-[calc(100px-var(--step))]" style={{ ["--step" as string]: `${i * 16}px` }}>
              <div className="card h-full p-4">
                <p className="text-sm font-semibold text-link">{s.stage}</p>
                <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10"><DoorLink href="/learn" className="btn btn-primary" data-magnetic>Find your level <span aria-hidden>→</span></DoorLink></div>
      </div>
    </Section>
  );
}

/* ---------- 6. Lab at Night: the one dark section ---------- */
const rollout = [
  { t: "Survey", d: "We visit, measure the room and agree the plan." },
  { t: "Install", d: "Benches, kits, devices and the AADHYA platform go in." },
  { t: "Train", d: "Teachers and the lab instructor are trained on the curriculum." },
  { t: "Power on", d: "First classes run. The lab is now part of the timetable." },
];

export function LabAtNight() {
  return (
    <section id="lab-at-night" aria-label="Lab at Night" className="relative overflow-hidden bg-night py-24 text-[#e3eff5] sm:py-32" data-anim-scope>
      <div data-power className="wrap">
        <p className="eyebrow !text-[#7FD0F2]" data-stagger>Turnkey 21C STEM &amp; AI Lab</p>
        <h2 className="display-lg mt-3 max-w-3xl !text-white" data-stagger>
          Watch a school lab light up.{" "}
          <Claim id="lab.rollout" fallback={null} className="text-leaf" />
        </h2>
        <p className="lede mt-4 max-w-2xl !text-[#a3bccb]" data-stagger>We handle the room, the kit, the platform and the training. Your school gets a lab that runs itself.</p>
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          {/* the lab: benches light up in sequence */}
          <div className="relative rounded-[var(--radius-card)] border border-white/10 bg-[#0b1322] p-6" aria-hidden>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} data-stagger className="lab-bench aspect-[4/3] rounded-lg border border-white/10 bg-[#13213a]" style={{ ["--i" as string]: String(i) }}>
                  <div className="lab-screen m-1.5 h-[55%] rounded bg-[#1b2c47]" />
                </div>
              ))}
            </div>
            <div className="mt-5 h-1.5 rounded-full bg-white/10"><div className="lab-progress h-full rounded-full" /></div>
          </div>
          <ol className="relative grid gap-5 border-l border-white/15 pl-6">
            {rollout.map((r, i) => (
              <li key={r.t} data-stagger className="relative">
                <span aria-hidden className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-night bg-aqua" />
                <p className="text-sm font-semibold text-[#7FD0F2]">Step {i + 1}</p>
                <h3 className="text-xl font-bold !text-white">{r.t}</h3>
                <p className="text-[#a3bccb]">{r.d}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <DoorLink href="/21c-lab" className="btn bg-white text-navy" data-magnetic>Book Turnkey Demo <span aria-hidden>→</span></DoorLink>
          <Link href="/21c-lab/planner" className="btn border border-white/25 text-white hover:border-aqua">Try the Lab Planner</Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- 7. Kalam Fellows band ---------- */
export function FellowsBand() {
  return (
    <Section id="fellows" label="Kalam Fellows" className="overflow-hidden">
      <div className="wrap">
        <div className="relative border-t-2 border-heading pt-10">
          <p className="eyebrow" data-stagger>Kalam Fellows · for college students, 18+</p>
          <h2 className="display-lg mt-3 max-w-4xl" data-stagger>
            Teach what you love. Earn while you study.
          </h2>
          <p className="lede mt-5 max-w-2xl" data-stagger>Pick gigs that fit your timetable. See the pay before you accept. Say no without penalty. Pause for exams. Build a teaching record you can show.</p>
          <ul className="mt-8 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin] snap-x" aria-label="Gig types" tabIndex={0}>
            {gigs.map((g) => (
              <li key={g.name} data-stagger className="min-w-[220px] snap-start rounded-2xl border border-line bg-panel/60 p-4">
                <p className="font-bold text-heading">{g.name}</p>
                <p className="mt-1 text-sm text-muted">{g.where}</p>
                <p className="mt-1 text-sm">{g.format}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <DoorLink href="/fellows" className="btn btn-primary !min-h-14 !px-8 text-lg" data-magnetic>Become a Fellow <span aria-hidden>→</span></DoorLink>
            <Link href="/fellows/safety" className="text-sm font-semibold text-link underline-offset-4 hover:underline">Our rules for teaching children</Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 8. Impact band: approved numbers only ---------- */
export function ImpactBand() {
  const stats = approvedClaims("impact.");
  return (
    <section aria-label="Impact" className="relative bg-navy py-20 text-white">
      <div data-power className="wrap">
        <p className="font-semibold text-[#9ad7f0]" data-stagger>Impact</p>
        {stats.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => <Stat key={s.id} id={s.id} light />)}
          </div>
        ) : (
          <div className="mt-4 max-w-3xl" data-stagger>
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight !text-white sm:text-5xl">Real numbers, with dates and evidence. Nothing less.</p>
            <p className="mt-4 text-lg">We publish a figure only once it has a definition, an as-of date and evidence behind it. Verified numbers will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- 9. Made by students ---------- */
export function MadeByStudents() {
  return (
    <AwaitingContent title="Made by students" need="Real projects with short videos, each with written parental consent. First name and age band only.">
      {null}
    </AwaitingContent>
  );
}

/* ---------- 10. Parent trust ---------- */
export function ParentTrust() {
  return (
    <Section id="parents" label="Parent trust">
      <div className="wrap">
        <SectionHead eyebrow="For parents" title="Safe by design, not by promise." lede="The rules we hold ourselves to, written down." />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parentTrust.map((p) => (
            <li key={p.title} data-stagger className="card p-6">
              <h3 className="text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-muted">{p.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2"><Link href="/child-safety" className="font-semibold text-link underline-offset-4 hover:underline">Read our child-safety policy →</Link><Link href="/one-to-one" className="font-semibold text-link underline-offset-4 hover:underline">How one-to-one classes work →</Link></p>
      </div>
    </Section>
  );
}

/* ---------- 11. Project stories ---------- */
export function ProjectStories() {
  const approved = initiatives.filter((s) => approvedClaim(s.claim));
  if (approved.length === 0) {
    return <AwaitingContent title="Project stories" need="Telangana Early Coders (with TITA), Ashaers Code Week and Code to Change Jr.: dates, numbers with evidence, and permission to name partners." />;
  }
  return (
    <Section id="stories" label="Project stories">
      <div className="wrap">
        <SectionHead eyebrow="Project stories" title="Programmes that moved the needle." />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {approved.map((s) => (
            <li key={s.title} data-stagger className="card p-6">
              <h3 className="text-2xl font-bold"><Claim id={s.claim} /></h3>
              <p className="mt-2 text-muted">{s.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* ---------- 12. Student voices ---------- */
export function StudentVoices() {
  return <AwaitingContent title="Student voices" need="Swipeable quotes with written consent (parental consent for under-18s). No invented quotes." />;
}

/* ---------- 13. FAQ ---------- */
export function Faq({ items = faqs }: { items?: { q: string; a: string }[] }) {
  return (
    <Section id="faq" label="Frequently asked questions">
      <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <SectionHead eyebrow="FAQ" title="Straight answers." lede={<>Something else? <Link className="text-link underline" href="/contact">Ask us</Link>.</>} />
        <div className="grid gap-3">
          {items.map((f) => (
            <details key={f.q} data-stagger className="group card px-5 py-4 open:shadow-[var(--shadow-lift)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-heading">
                {f.q}
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- 14. The three doors again ---------- */
export function DoorsAgain() {
  return (
    <Section id="doors-again" label="Pick your door">
      <div className="wrap">
        <SectionHead center title="Start with one conversation." lede="A free build session, a lab demo, or an application. No payment to begin." />
        <ul className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {doors.map((d) => (
            <li key={d.id} data-stagger data-door-card className="card flex flex-col items-start p-6">
              <p className="text-sm font-semibold text-muted">{d.name}</p>
              <p className="mt-1 text-xl font-bold text-heading">{d.line}</p>
              <DoorLink href={d.href} className="btn btn-primary btn-square mt-5">{d.cta}</DoorLink>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
