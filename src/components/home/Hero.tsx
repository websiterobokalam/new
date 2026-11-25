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

/*
 * The mascot on an engineer's drawing sheet. Three drafting call-outs name the
 * parts every robot has (sensors, a controller, motors), so the picture quietly
 * teaches "sense, think, act" without saying "STEM". Geometry below is in the
 * sheet's own units (480 x 520); the mascot artwork is 967 x 1200.
 */
const SHEET = { w: 480, h: 520 };
const BOT = { x: 92, y: 132, w: 230, h: 285 }; // where the mascot sits on the sheet
const at = (fx: number, fy: number) => ({ x: BOT.x + fx * BOT.w, y: BOT.y + fy * BOT.h });
// Each call-out: a pin on the part, a leader with one bend, and a lettered label with its text to the right.
const CALLOUTS = [
  { id: "A", word: "Sense", note: "sensors", from: at(0.555, 0.196), bend: { x: 318, y: 118 }, to: { x: 350, y: 118 } },
  { id: "B", word: "Think", note: "controller", from: at(0.46, 0.5), bend: { x: 318, y: 252 }, to: { x: 350, y: 252 } },
  { id: "C", word: "Act", note: "motors", from: at(0.075, 0.3), bend: { x: 92 + 0.075 * 230, y: 96 }, to: { x: 92 + 0.075 * 230, y: 84 } },
];
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

function MascotStage() {
  const ground = BOT.y + BOT.h;
  const cx = BOT.x + BOT.w * 0.48, cy = BOT.y + BOT.h * 0.5;
  return (
    <figure className="bp-sheet" style={{ aspectRatio: `${SHEET.w} / ${SHEET.h}` }}>
      <svg aria-hidden viewBox={`0 0 ${SHEET.w} ${SHEET.h}`} className="bp-draw">
        {/* construction geometry */}
        <g className="bp-construct">
          <circle cx={cx} cy={cy} r={176} />
          <circle cx={cx} cy={cy} r={118} strokeDasharray="2 6" />
          <path d={`M${cx - 196} ${cy}H${cx + 196}M${cx} ${cy - 196}V${cy + 196}`} strokeDasharray="10 5 2 5" />
          <path d={`M${BOT.x - 30} ${ground}H${BOT.x + BOT.w + 30}`} className="bp-ground" />
        </g>
        {/* height dimension */}
        <g className="bp-dim">
          <path d={`M24 ${BOT.y}H40M24 ${ground}H40M32 ${BOT.y + 6}V${ground - 6}`} />
          <path d={`M28 ${BOT.y + 14}L32 ${BOT.y + 4}L36 ${BOT.y + 14}M28 ${ground - 14}L32 ${ground - 4}L36 ${ground - 14}`} />
        </g>
        {/* formulas in the margin */}
        <g className="bp-notes">
          <text x={SHEET.w - 22} y={36} textAnchor="end">V = I · R</text>
          <text x={SHEET.w - 22} y={58} textAnchor="end">F = m · a</text>
        </g>
        {/* call-outs */}
        {CALLOUTS.map((c, i) => (
          <g key={c.id} className="bp-callout" style={{ ["--i" as string]: i }}>
            <path className="bp-leader" pathLength={1} d={`M${c.from.x} ${c.from.y}L${c.bend.x} ${c.bend.y}L${c.to.x} ${c.to.y}`} />
            <circle className="bp-pin" cx={c.from.x} cy={c.from.y} r={5} />
            <g transform={`translate(${c.to.x} ${c.to.y})`} className="bp-label">
              <circle r={13} />
              <text className="bp-letter" textAnchor="middle" dy="0.36em">{c.id}</text>
              <text className="bp-word" x={20} dy="-0.05em">{c.word}</text>
              <text className="bp-note" x={20} dy="1.25em">{c.note}</text>
            </g>
          </g>
        ))}
        {/* title block */}
        <g className="bp-title" transform={`translate(${SHEET.w - 222} ${SHEET.h - 60})`}>
          <rect width={204} height={44} rx={6} />
          <path d="M0 22H204M148 0V44" />
          <text x={10} y={15}>KALAM-01</text>
          <text x={10} y={37}>SENSE → THINK → ACT</text>
          <text x={156} y={15}>1 : 1</text>
          <text x={156} y={37}>REV A</text>
        </g>
      </svg>
      <Mascot
        priority
        float={false}
        sizes="(min-width: 1024px) 300px, 56vw"
        className="bp-mascot"
        alt="The Robokalam mascot on an engineer's drawing, labelled sense, think and act"
      />
      <style>{`.bp-mascot{left:${pct(BOT.x, SHEET.w)};top:${pct(BOT.y, SHEET.h)};width:${pct(BOT.w, SHEET.w)};height:${pct(BOT.h, SHEET.h)}}`}</style>
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
