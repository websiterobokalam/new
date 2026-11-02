"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { post } from "./client";
import { OtpFlow } from "./OtpFlow";
import { ConsentForm } from "./ConsentForm";
import { Chips, FormError, WORLD_OPTIONS } from "../forms/ui";
import type { Notice } from "@/lib/learn/consent";

type Learner = { id: string; first_name: string; age_band: string; interests: string[]; ready: boolean };
type Batch = { id: string; starts_at: string; duration_min: number; language: string; mode: string; location: string | null; educator_label: string | null };

const MISSIONS: Record<string, string> = {
  robotics: "Find three things at home that move when you press a button. How do you think they know?",
  coding: "Write the steps to make a cup of tea, one tiny step per line. That is your first program.",
  iot: "Spot two things at home that sense something: light, heat or touch.",
  ai: "Sort 10 objects into two groups. What rule did you use? Machines learn rules like that.",
  finlit: "Pick something you want. Work out how many weeks of saving it would take.",
  space: "Tonight, find the brightest dot in the sky. Is it a star or a planet?",
};
const LANG: Record<string, string> = { en: "English", te: "Telugu", hi: "Hindi" };

export function BuildSessionFlow({ notice, signedIn, preset }: { notice: Notice; signedIn: boolean; preset: { ageBand?: string; interest?: string } }) {
  const [step, setStep] = useState<"interest" | "login" | "learner" | "slot" | "done">("interest");
  const [age, setAge] = useState(preset.ageBand ?? "9-11");
  const [interest, setInterest] = useState(preset.interest ?? "robotics");
  const [learners, setLearners] = useState<Learner[] | null>(null);
  const [learnerId, setLearnerId] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [slot, setSlot] = useState<string>();
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState(signedIn);

  async function loadLearners() {
    const r = await (await fetch("/api/app/me")).json();
    if (r.ok) { setLearners(r.learners); if (!r.learners.length) setAdding(true); }
  }
  useEffect(() => { if (step === "learner") loadLearners(); }, [step]);
  useEffect(() => {
    if (step !== "slot") return;
    fetch("/api/app/batches?course=free-build-session").then((r) => r.json()).then((r) => setBatches(r.ok ? r.batches : []));
  }, [step]);

  async function confirm() {
    if (!learnerId || !slot) return;
    setBusy(true); setErr(undefined);
    const r = await post("/api/app/bookings", { learnerId, batchId: slot });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setStep("done");
  }

  const chosen = batches?.find((b) => b.id === slot);
  const steps = ["interest", "login", "learner", "slot", "done"] as const;
  const idx = steps.indexOf(step);

  return (
    <div className="card grid gap-6 p-5 sm:p-8">
      <ol className="flex flex-wrap gap-2 text-xs font-semibold" aria-label="Progress">
        {["Age and interest", "Your phone", "Your child", "Pick a time", "Done"].map((s, i) => (
          <li key={s} aria-current={i === idx ? "step" : undefined} className={`rounded-full px-3 py-1 ${i === idx ? "bg-navy text-white dark:bg-aqua dark:text-night" : i < idx ? "bg-leafmist text-navy dark:bg-panel-2 dark:text-heading" : "bg-panel text-muted"}`}>{i + 1}. {s}</li>
        ))}
      </ol>

      {step === "interest" && (
        <div className="grid gap-5">
          <Chips legend="Your child's age" name="age" value={age} onChange={(v) => setAge(v as string)} options={["6-8", "9-11", "12-14", "15-17"].map((v) => ({ value: v, label: v }))} />
          <Chips legend="What do they want to build?" name="interest" value={interest} onChange={(v) => setInterest(v as string)} options={WORLD_OPTIONS} />
          <button className="btn btn-primary justify-self-start" onClick={() => setStep(authed ? "learner" : "login")}>Continue</button>
        </div>
      )}

      {step === "login" && (
        <div className="grid gap-3">
          <h2 className="display-md">Confirm your phone</h2>
          <p className="text-muted">We use it to keep your child&apos;s account yours. No calls unless you ask.</p>
          <OtpFlow onDone={() => { setAuthed(true); setStep("learner"); }} />
        </div>
      )}

      {step === "learner" && (
        <div className="grid gap-4">
          <h2 className="display-md">Who is building?</h2>
          {learners === null ? <p className="text-muted" role="status">Loading…</p> : (
            <>
              {!adding && learners.length > 0 && (
                <fieldset className="grid gap-2">
                  <legend className="sr-only">Choose a learner</legend>
                  {learners.map((l) => (
                    <label key={l.id} className="chip !justify-start">
                      <input type="radio" className="sr-only" name="learner" checked={learnerId === l.id} onChange={() => setLearnerId(l.id)} disabled={!l.ready} />
                      {l.first_name} · {l.age_band}{!l.ready && " · consent needed"}
                    </label>
                  ))}
                  <button type="button" className="justify-self-start text-sm font-semibold text-link underline" onClick={() => setAdding(true)}>Add another child</button>
                </fieldset>
              )}
              {adding && <ConsentForm notice={notice} preset={{ ageBand: age, interest }} onDone={(id) => { setLearnerId(id); setAdding(false); setStep("slot"); }} />}
              {!adding && <button className="btn btn-primary justify-self-start" disabled={!learnerId} onClick={() => setStep("slot")}>Continue</button>}
            </>
          )}
        </div>
      )}

      {step === "slot" && (
        <div className="grid gap-4">
          <h2 className="display-md">Pick a time</h2>
          <p className="text-muted">About 60 minutes, live, in a small group, with a vetted Fellow or trainer. Recorded on the platform for safety.</p>
          {batches === null ? <p role="status" className="text-muted">Loading times…</p> : batches.length === 0 ? (
            <p className="rounded-xl bg-panel p-4">No sessions are open right now. We add new times every week, so check back soon.</p>
          ) : (
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="sr-only">Available times</legend>
              {batches.map((b) => (
                <label key={b.id} className="chip !justify-start !rounded-2xl !py-3">
                  <input type="radio" className="sr-only" name="slot" checked={slot === b.id} onChange={() => setSlot(b.id)} />
                  <span>
                    <span className="block font-semibold">{new Date(b.starts_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                    <span className="block text-xs opacity-80">{b.mode === "online" ? "Online" : b.location} · {LANG[b.language] ?? b.language}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <FormError msg={err} />
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={() => setStep("learner")}>Back</button>
            <button className="btn btn-primary" disabled={!slot || busy} onClick={confirm}>{busy ? "Booking…" : "Book my free session"}</button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="grid gap-4" role="status">
          <h2 className="display-md">Booked. See you there.</h2>
          {chosen && <p className="text-lg">{new Date(chosen.starts_at).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })} · {chosen.mode === "online" ? "Online" : chosen.location}</p>}
          <div className="rounded-2xl bg-leafmist p-5 dark:bg-panel-2">
            <p className="eyebrow">Your mini mission</p>
            <p className="mt-2 text-lg font-semibold text-heading">{MISSIONS[interest]}</p>
          </div>
          <ul className="list-disc pl-5 text-muted">
            <li>Your child finishes one build in the session.</li>
            <li>Afterwards you get the build, plain feedback and a suggested next step, with the full fee shown.</li>
            <li>We follow up once only if you allowed it.</li>
          </ul>
          <Link href="/app" className="btn btn-primary justify-self-start">Go to your family home</Link>
        </div>
      )}
    </div>
  );
}
