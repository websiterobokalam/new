import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StickyCta } from "@/components/PageHero";
import { Section, SectionHead } from "@/components/Section";
import { Claim } from "@/components/Claim";
import { platform } from "@/content/site";
import { SchoolDemoForm } from "@/components/forms/LeadForms";
import { LabAtNight } from "@/components/home/Sections";
import { AwaitingContent } from "@/components/AwaitingContent";
import { planLab } from "@/lib/planner";
import { IsoLab } from "@/components/art/IsoLab";

export const metadata: Metadata = {
  title: "Turnkey 21C STEM & AI Lab for schools",
  description: "A lab that runs itself: room, kits, AADHYA platform, curriculum and teacher training, set up for your school. Book a Turnkey Demo.",
};

const outcomes = [
  { t: "Every class builds", d: "A timetabled lab period where students make working projects, not just watch slides." },
  { t: "Teachers supported", d: "Teacher training, lesson plans and a lab instructor so your staff are never alone with new kit." },
  { t: "Proof for parents", d: "Portfolios, certificates and showcase events your parents can see." },
  { t: "Nothing to manage", d: "Hardware support, scheduling and reporting handled through one platform." },
];
const alsoFromUs = [
  { t: "Edu-Eve", d: "Lab on wheels for schools without a dedicated room." },
  { t: "Ason Labs", d: "Details being confirmed." },
  { t: "KALWINGS labs", d: "Details being confirmed." },
  { t: "Teacher training", d: "Workshops for your staff." },
  { t: "Science fairs", d: "Run with your students." },
  { t: "Code weeks", d: "A week of building, school-wide." },
];

export default function LabPage() {
  const map = planLab({ board: "CBSE", classFrom: 1, classTo: 12, students: 1, sectionSize: 1, roomSqft: null }).bands;
  return (
    <>
      <PageHero art={<IsoLab idp="iso-hero" className="h-auto w-full" />} eyebrow="School door · schools, colleges, CSR and government" tone="aqua"
        title={<>A lab that <span className="grad-text">runs itself.</span></>}
        lede="Turnkey 21C STEM & AI Labs: the room, the kits, the platform, the curriculum and the training, set up and supported for you.">
        <a href="#demo" className="btn btn-primary" data-magnetic>Book Turnkey Demo <span aria-hidden>→</span></a>
        <Link href="/21c-lab/planner" className="btn btn-ghost">Plan your lab in 2 minutes</Link>
      </PageHero>
      <div className="wrap -mt-6 mb-6">
        <ul className="glass flex flex-wrap gap-x-6 gap-y-2 rounded-2xl px-5 py-4 text-sm font-semibold text-heading">
          <Claim as="li" id="lab.rollout" />
          <Claim as="li" id="lab.instructor" />
          <Claim as="li" id="lab.roadmap" />
          <Claim as="li" id="lab.hardware-sla" />
          <Claim as="li" id="curriculum.nep-cbse" />
          <li>Hands-on from Class 1</li>
          <li>Robotics, IoT, AI, coding, money basics, space</li>
        </ul>
      </div>

      <Section label="Outcomes">
        <div className="wrap">
          <div>
            <SectionHead eyebrow="What your school gets" title="Outcomes, not just equipment." />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {outcomes.map((o) => <li key={o.t} data-stagger className="card p-5"><h3 className="text-lg font-bold">{o.t}</h3><p className="mt-1 text-sm text-muted">{o.d}</p></li>)}
            </ul>
          </div>
        </div>
      </Section>

      <Section label="Components" className="bg-panel/50">
        <div className="wrap">
          <SectionHead eyebrow="Inside the lab" title="One system, five parts." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {platform.map((p) => <li key={p.name} data-stagger className="card p-5"><h3 className="text-xl font-bold">{p.name}</h3><p className="mt-1 text-sm text-muted">{p.line}</p></li>)}
          </ul>
        </div>
      </Section>

      <Section label="Curriculum map">
        <div className="wrap">
          <SectionHead eyebrow="Curriculum map" title="Class 1 to Class 12, one ladder."
            lede={<><Claim id="curriculum.nep-cbse" fallback="Curriculum mapping to NEP 2020 and CBSE is being verified." />{" "}<Claim id="curriculum.cbse-ct-ai" /></>} />
          <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Curriculum map table">
            <table className="w-full min-w-[560px] text-left">
              <caption className="caption-bottom pt-3 text-left text-sm text-muted">Indicative: levels follow each programme's minimum age (Class n ≈ age n + 5). Final mapping is confirmed with your school.</caption>
              <thead><tr className="border-b border-line text-sm text-muted"><th className="py-3 pr-4">Classes</th><th className="py-3 pr-4">Ashaer level</th><th className="py-3">Worlds</th></tr></thead>
              <tbody>{map.map((b) => <tr key={b.classes} className="border-b border-line/60"><td className="py-3 pr-4 font-mono">{b.classes}</td><td className="py-3 pr-4 font-semibold text-heading">{b.programme}</td><td className="py-3 text-muted">{b.worlds.join(", ")}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </Section>

      <LabAtNight />

      <Section label="Also from Robokalam">
        <div className="wrap">
          <SectionHead eyebrow="Also for schools" title="More ways to build." />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alsoFromUs.map((a) => <li key={a.t} data-stagger className="rounded-2xl border border-line bg-surface p-5"><h3 className="font-bold">{a.t}</h3><p className="text-sm text-muted">{a.d}</p></li>)}
          </ul>
        </div>
      </Section>

      <AwaitingContent title="Lab gallery" need="Real photos of real labs with a consistent warm grade, plus named school video stories (with permission)." />

      <Section id="demo" label="Book Turnkey Demo" className="bg-panel/50">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <SectionHead eyebrow="Book Turnkey Demo" title="See it working in your school." lede={<>Four short steps. Prefer to plan first? <Link className="text-link underline" href="/21c-lab/planner">Try the Lab Planner</Link>.</>} />
          <SchoolDemoForm />
        </div>
      </Section>
      <div className="h-20 md:hidden" />
      <StickyCta href="#demo" label="Book Turnkey Demo" />
    </>
  );
}
