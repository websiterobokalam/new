"use client";
import { useState } from "react";
import { planLab, ASSUMPTIONS, type PlannerInput } from "@/lib/planner";
import { Chips, Field, Select } from "./ui";
import { SchoolDemoForm } from "./LeadForms";

const BOARDS = ["CBSE", "ICSE", "State board", "IB", "Cambridge", "Other"];
const ROLL = ["Survey", "Install", "Train", "Power on"];

export function LabPlanner({ rolloutText }: { rolloutText: string | null }) {
  const [step, setStep] = useState(0);
  const [inp, setInp] = useState<PlannerInput>({ board: "CBSE", classFrom: 3, classTo: 8, students: 600, sectionSize: 40, roomSqft: null });
  const [sendOpen, setSendOpen] = useState(false);
  const plan = planLab(inp);
  const num = (k: keyof PlannerInput) => (e: React.ChangeEvent<HTMLInputElement>) => setInp({ ...inp, [k]: e.target.value === "" ? null : Number(e.target.value) });

  const steps = [
    { t: "Board", body: <Chips legend="Which board?" name="board" value={inp.board} onChange={(v) => setInp({ ...inp, board: v as string })} options={BOARDS.map((b) => ({ value: b, label: b }))} /> },
    {
      t: "Classes",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="From class" name="from" value={String(inp.classFrom)} onChange={(e) => setInp({ ...inp, classFrom: Number(e.target.value) })} options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }))} />
          <Select label="To class" name="to" value={String(inp.classTo)} onChange={(e) => setInp({ ...inp, classTo: Number(e.target.value) })} options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }))} />
        </div>
      ),
    },
    {
      t: "Students",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Students across these classes" name="students" type="number" inputMode="numeric" min={1} value={inp.students || ""} onChange={num("students")} />
          <Field label="Students per section" name="section" type="number" inputMode="numeric" min={1} value={inp.sectionSize || ""} onChange={num("sectionSize")} />
        </div>
      ),
    },
    { t: "Room", body: <Field label="Lab room size in sq ft (leave blank if unsure)" name="room" type="number" inputMode="numeric" min={0} value={inp.roomSqft ?? ""} onChange={num("roomSqft")} hint="Length × width in feet. We confirm on the site survey." /> },
  ];
  const done = step >= steps.length;

  return (
    <div className="grid gap-6">
      {!done ? (
        <form className="card grid gap-5 p-5 sm:p-8" onSubmit={(e) => { e.preventDefault(); setStep(step + 1); }} data-noprint>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Step {step + 1} of {steps.length} · {steps[step].t}</p>
            <div className="flex gap-1" aria-hidden>{steps.map((_, i) => <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-navy dark:bg-aqua" : "bg-line"}`} />)}</div>
          </div>
          <div key={step} className="motion-safe:animate-[door-in_.4s_ease-out]">{steps[step].body}</div>
          <div className="flex gap-3">
            {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
            <button className="btn btn-primary" disabled={step === 2 && (!inp.students || !inp.sectionSize)}>{step === steps.length - 1 ? "See my plan" : "Next"}</button>
          </div>
        </form>
      ) : (
        <article className="card grid gap-6 p-5 sm:p-8" aria-labelledby="plan-title">
          <div className="print-only"><p><strong>Robokalam · Lab Planner</strong> · {new Date().toLocaleDateString("en-IN")}</p></div>
          <header>
            <p className="eyebrow">Your suggested lab</p>
            <h2 id="plan-title" className="display-md mt-2">{plan.profile} for Classes {plan.from} to {plan.to}, {inp.board}</h2>
            <p className="mt-2 text-muted">A starting point for a conversation, not a quote. Our team confirms everything on a site survey.</p>
          </header>
          <dl className="grid gap-3 sm:grid-cols-4">
            {[
              ["Benches", `${plan.benches}`, `for a section of ${inp.sectionSize}`],
              ["Room needed", `~${plan.sqftNeeded} sq ft`, plan.room === "fits" ? "Your room fits" : plan.room === "tight" ? "Your room looks tight" : "Room size not given"],
              ["Lab periods", `${plan.periods} / week`, `${plan.sections} sections`],
              ["Labs", `${plan.labsNeeded}`, plan.labsNeeded > 1 ? "or a shift timetable" : "one lab covers it"],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-2xl bg-panel p-4"><dt className="text-sm text-muted">{k}</dt><dd className="mt-1 text-2xl font-bold text-heading">{v}</dd><dd className="text-xs text-muted">{s}</dd></div>
            ))}
          </dl>
          <section>
            <h3 className="text-lg font-bold">Curriculum by class</h3>
            <table className="mt-3 w-full text-left text-sm">
              <thead><tr className="border-b border-line text-muted"><th className="py-2 pr-3 font-semibold">Classes</th><th className="py-2 pr-3 font-semibold">Ashaer level</th><th className="py-2 font-semibold">Worlds</th></tr></thead>
              <tbody>{plan.bands.map((b) => <tr key={b.classes} className="border-b border-line/60"><td className="py-2 pr-3 font-mono">{b.classes}</td><td className="py-2 pr-3 font-semibold text-heading">{b.programme}</td><td className="py-2">{b.worlds.join(", ")}</td></tr>)}</tbody>
            </table>
          </section>
          <section>
            <h3 className="text-lg font-bold">Rollout plan {rolloutText && <span className="text-muted">· {rolloutText}</span>}</h3>
            <ol className="mt-3 grid gap-2 sm:grid-cols-4">{ROLL.map((r, i) => <li key={r} className="rounded-xl border border-line p-3"><span className="font-mono text-xs text-muted">Step {i + 1}</span><p className="font-semibold text-heading">{r}</p></li>)}</ol>
          </section>
          <section className="rounded-2xl bg-leafmist/70 p-4 text-sm dark:bg-panel-2">
            <h3 className="font-bold">Assumptions behind these numbers</h3>
            <ul className="mt-2 list-disc pl-5 text-muted">
              <li>{ASSUMPTIONS.learnersPerBench} learners per bench, about {ASSUMPTIONS.sqftPerLearner} sq ft per learner.</li>
              <li>{ASSUMPTIONS.periodsPerSectionPerWeek} lab period per section per week; a lab can host {ASSUMPTIONS.labPeriodsPerWeek} periods a week.</li>
              <li>Class n is taken as roughly age n + 5 to pick the Ashaer level.</li>
              <li>Prices are shared after the survey.</li>
            </ul>
          </section>
          <div className="flex flex-wrap gap-3" data-noprint>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>Download as PDF</button>
            <button type="button" className="btn btn-ghost" onClick={() => setSendOpen(true)}>Send this plan to our team</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setStep(0); setSendOpen(false); }}>Start over</button>
          </div>
        </article>
      )}
      {done && sendOpen && <div data-noprint><SchoolDemoForm plan={{ ...inp, ...plan }} compact /></div>}
    </div>
  );
}
