"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Chips, Done, Field, FormError, Honeypot, Select, WORLD_OPTIONS, regionFromCookie, useLeadSubmit } from "./ui";

/* ---------------- Learner: request a Free Build Session ---------------- */
export function BuildSessionForm() {
  const s = useLeadSubmit();
  const [age, setAge] = useState("9-11");
  const [interest, setInterest] = useState("robotics");
  const [mode, setMode] = useState("online");
  const [optIn, setOptIn] = useState(false);
  const [follow, setFollow] = useState(false);

  if (s.status === "done")
    return (
      <Done title="Request received" refId={s.ref}>
        A Robokalam team member will message you to pick a slot. Before the session you will see a plain notice about your child&apos;s data and give consent. {follow ? "We will follow up once after the session." : "We will not follow up after the session."}
      </Done>
    );

  return (
    <form
      className="card relative grid gap-5 p-5 sm:p-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        s.submit({ door: "learner", parentName: f.get("parentName"), phone: f.get("phone"), email: f.get("email") ?? "", childAgeBand: age, interest, mode, language: f.get("language"), region: regionFromCookie(), contactOptIn: optIn, followUpOptIn: follow, website: f.get("website") });
      }}
    >
      <Honeypot />
      <FormError msg={s.error} />
      <Chips legend="Your child's age" name="age" value={age} onChange={(v) => setAge(v as string)} error={s.fields.childAgeBand}
        options={["6-8", "9-11", "12-14", "15-17", "18+"].map((v) => ({ value: v, label: v === "18+" ? "18+ (adult learner)" : v }))} />
      <Chips legend="What do they want to build?" name="interest" value={interest} onChange={(v) => setInterest(v as string)} options={WORLD_OPTIONS} />
      <Chips legend="Where" name="mode" value={mode} onChange={(v) => setMode(v as string)}
        options={[{ value: "online", label: "Online" }, { value: "offline", label: "At a centre (TS · AP)" }, { value: "either", label: "Either" }]} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Parent's name" name="parentName" autoComplete="name" required error={s.fields.parentName} />
        <Field label="Parent's mobile" name="phone" type="tel" inputMode="tel" autoComplete="tel" required error={s.fields.phone} hint="We confirm by OTP before the session." />
        <Field label="Parent's email (optional)" name="email" type="email" autoComplete="email" error={s.fields.email} hint="For a confirmation email. Never your child's email." />
      </div>
      <Select label="Preferred language" name="language" options={["English", "Telugu", "Hindi"]} />
      <div className="grid gap-3 rounded-2xl bg-panel/60 p-4">
        <Check name="contactOptIn" checked={optIn} onChange={setOptIn} error={s.fields.contactOptIn}>
          You may contact me on this number about this session. <span className="text-muted">Required.</span>
        </Check>
        <Check name="followUpOptIn" checked={follow} onChange={setFollow}>
          After the session, you may follow up once with a next step. <span className="text-muted">Optional.</span>
        </Check>
        <p className="text-xs text-muted">We collect only an age band for your child, never a date of birth. See our <Link className="underline" href="/privacy">privacy notice</Link>.</p>
      </div>
      <button className="btn btn-primary justify-self-start" disabled={s.status === "sending"}>
        {s.status === "sending" ? "Sending…" : "Request my Free Build Session"}
      </button>
    </form>
  );
}

/* ---------------- School: Turnkey demo, short steps ---------------- */
const ROLES = ["Principal", "Correspondent or owner", "Teacher", "CSR or foundation", "Government", "Other"];
const BOARDS = ["CBSE", "ICSE", "State board", "IB", "Cambridge", "College", "Other"];

export function SchoolDemoForm({ plan, compact = false }: { plan?: Record<string, unknown>; compact?: boolean }) {
  const s = useLeadSubmit();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Record<string, string>>({ role: "Principal", board: (plan?.board as string) ?? "CBSE", preferredTime: "Morning", students: plan?.students ? String(plan.students) : "" });
  const [optIn, setOptIn] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });

  const steps: { title: string; body: React.ReactNode; valid: () => boolean }[] = [
    { title: "Your role", body: <Chips legend="I am a…" name="role" value={d.role} onChange={(v) => setD({ ...d, role: v as string })} options={ROLES.map((r) => ({ value: r, label: r }))} />, valid: () => !!d.role },
    { title: "Institution", body: <div className="grid gap-4 sm:grid-cols-2"><Field label="School or college name" name="institution" value={d.institution ?? ""} onChange={set("institution")} error={s.fields.institution} /><Field label="City" name="city" value={d.city ?? ""} onChange={set("city")} error={s.fields.city} /></div>, valid: () => (d.institution?.length ?? 0) > 1 && (d.city?.length ?? 0) > 1 },
    { title: "Board and size", body: <div className="grid gap-4 sm:grid-cols-2"><Select label="Board" name="board" options={BOARDS} value={d.board} onChange={set("board")} /><Field label="Number of students" name="students" type="number" inputMode="numeric" min={1} value={d.students ?? ""} onChange={set("students")} error={s.fields.students} /></div>, valid: () => Number(d.students) > 0 },
    {
      title: "How to reach you",
      body: (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" name="name" autoComplete="name" value={d.name ?? ""} onChange={set("name")} error={s.fields.name} />
            <Field label="Mobile" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={d.phone ?? ""} onChange={set("phone")} error={s.fields.phone} />
            <Field label="Email (optional)" name="email" type="email" autoComplete="email" value={d.email ?? ""} onChange={set("email")} error={s.fields.email} />
            <Select label="Best time for a call" name="preferredTime" options={["Morning", "Afternoon", "Evening"]} value={d.preferredTime} onChange={set("preferredTime")} />
          </div>
          <Check name="contactOptIn" checked={optIn} onChange={setOptIn} error={s.fields.contactOptIn}>You may contact me to arrange a demo.</Check>
        </div>
      ),
      valid: () => (d.name?.length ?? 0) > 1 && (d.phone?.length ?? 0) >= 10 && optIn,
    },
  ];

  if (s.status === "done") return <Done title="Demo request received" refId={s.ref}>Our schools team will call at your preferred time to arrange the demo.</Done>;

  const last = step === steps.length - 1;
  return (
    <form
      className={`card relative grid gap-5 ${compact ? "p-5" : "p-5 sm:p-8"}`}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!last) return steps[step].valid() && setStep(step + 1);
        const ok = await s.submit({ door: "school", ...d, region: regionFromCookie(), contactOptIn: optIn, plan, website: new FormData(e.currentTarget).get("website") });
        if (!ok) {
          // jump back to the first step with an error
          const order = [["role"], ["institution", "city"], ["board", "students"], ["name", "phone", "email", "contactOptIn"]];
          const i = order.findIndex((ks) => ks.some((k) => s.fields[k]));
          if (i >= 0) setStep(i);
        }
      }}
    >
      <Honeypot />
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">Step {step + 1} of {steps.length} · {steps[step].title}</p>
        <div className="flex gap-1" aria-hidden>{steps.map((_, i) => <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-navy dark:bg-aqua" : "bg-line"}`} />)}</div>
      </div>
      <FormError msg={s.error} />
      <div key={step} className="motion-safe:animate-[door-in_.4s_ease-out]">{steps[step].body}</div>
      <div className="flex flex-wrap gap-3">
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <button className="btn btn-primary" disabled={!steps[step].valid() || s.status === "sending"}>
          {last ? (s.status === "sending" ? "Sending…" : "Book Turnkey Demo") : "Next"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Educator: Kalamite waitlist / application ---------------- */
export function FellowApplyForm() {
  const s = useLeadSubmit();
  const [worlds, setWorlds] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>(["English"]);
  const [year, setYear] = useState("2");
  const [age, setAge] = useState(false);
  const [optIn, setOptIn] = useState(false);

  if (s.status === "done")
    return (
      <Done title="You're on the Kalamites waitlist" refId={s.ref}>
        We open the pilot in one city first. When your batch opens, you will get a link to verify your phone, take the subject test and record a short demo. No fees, ever. Training hours are paid.
      </Done>
    );

  return (
    <form
      className="card relative grid gap-5 p-5 sm:p-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        s.submit({
          door: "educator", name: f.get("name"), phone: f.get("phone"), email: f.get("email"), college: f.get("college"), course: f.get("course"),
          year, ageConfirmed: age, worlds, hoursPerWeek: f.get("hours"), city: f.get("city"), languages: langs, region: regionFromCookie(), contactOptIn: optIn, website: f.get("website"),
        });
      }}
    >
      <Honeypot />
      <FormError msg={s.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" autoComplete="name" error={s.fields.name} />
        <Field label="Mobile" name="phone" type="tel" inputMode="tel" autoComplete="tel" error={s.fields.phone} />
        <Field label="Email (college email if you have one)" name="email" type="email" autoComplete="email" error={s.fields.email} />
        <Field label="College" name="college" placeholder="Type your college name" error={s.fields.college} hint="We verify enrolment later with your college ID or email." />
        <Field label="Course or branch" name="course" placeholder="e.g. B.Tech ECE" error={s.fields.course} />
        <Field label="City" name="city" autoComplete="address-level2" error={s.fields.city} />
      </div>
      <Chips legend="Year of study" name="year" value={year} onChange={(v) => setYear(v as string)} options={["1", "2", "3", "4", "5", "PG", "Graduated"].map((v) => ({ value: v, label: v }))} />
      <Chips legend="Worlds you could teach" name="worlds" type="checkbox" value={worlds} onChange={(v) => setWorlds(v as string[])} options={WORLD_OPTIONS} error={s.fields.worlds} />
      <Chips legend="Languages you can teach in" name="languages" type="checkbox" value={langs} onChange={(v) => setLangs(v as string[])} options={["English", "Telugu", "Hindi"].map((v) => ({ value: v, label: v }))} error={s.fields.languages} />
      <Field label="Hours a week you could teach" name="hours" type="number" inputMode="numeric" min={1} max={40} defaultValue={6} error={s.fields.hoursPerWeek} hint="During term we cap your hours to protect your studies." />
      <div className="grid gap-3 rounded-2xl bg-panel/60 p-4">
        <Check name="ageConfirmed" checked={age} onChange={setAge} error={s.fields.ageConfirmed}>I am 18 or older.</Check>
        <Check name="contactOptIn" checked={optIn} onChange={setOptIn} error={s.fields.contactOptIn}>You may contact me about the Kalamites pilot.</Check>
      </div>
      <p className="text-sm text-muted">Before you teach any child you will complete identity verification, a background check, references and Kalam Academy, including a child-safety and POCSO course. <Link className="text-link underline" href="/kalamites/safety">Read the rules</Link>.</p>
      <button className="btn btn-primary justify-self-start" disabled={s.status === "sending"}>{s.status === "sending" ? "Sending…" : "Join the Kalamites waitlist"}</button>
    </form>
  );
}
