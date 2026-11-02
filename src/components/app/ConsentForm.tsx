"use client";
import { useState } from "react";
import { post } from "./client";
import { Check, Chips, Field, FormError, WORLD_OPTIONS } from "../forms/ui";
import type { Notice } from "@/lib/learn/consent";

/**
 * Add a learner with an itemised notice. Required items are explained and
 * cannot be skipped; optional items start OFF. Consent is recorded against the
 * exact notice text (by hash).
 */
export function ConsentForm({ notice, preset, onDone }: { notice: Notice; preset?: { ageBand?: string; interest?: string }; onDone: (learnerId: string) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(preset?.ageBand ?? "9-11");
  const [interests, setInterests] = useState<string[]>(preset?.interest ? [preset.interest] : []);
  const [optional, setOptional] = useState<Record<string, boolean>>({});
  const [guardian, setGuardian] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ msg?: string; fields?: Record<string, string> }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const consents: Record<string, boolean> = {};
    for (const it of notice.body.items) consents[it.purpose] = it.required ? true : !!optional[it.purpose];
    const r = await post<{ learnerId: string }>("/api/app/learners", { firstName: name, ageBand: age, interests, noticeId: notice.id, consents, guardianDeclared: guardian });
    setBusy(false);
    if (!r.ok) return setErr({ msg: r.error, fields: r.fields });
    onDone(r.learnerId);
  }

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Child's first name" name="firstName" value={name} onChange={(e) => setName(e.target.value)} error={err.fields?.firstName} hint="First name only. We never ask for a date of birth or school." autoComplete="off" />
      </div>
      <Chips legend="Age" name="age" value={age} onChange={(v) => setAge(v as string)} options={["6-8", "9-11", "12-14", "15-17"].map((v) => ({ value: v, label: v }))} />
      <Chips legend="Interests (helps us suggest the next project)" name="interests" type="checkbox" value={interests} onChange={(v) => setInterests(v as string[])} options={WORLD_OPTIONS} />

      <section aria-labelledby="notice-title" className="rounded-2xl border border-line bg-surface">
        <header className="border-b border-line p-4">
          <h3 id="notice-title" className="text-lg font-bold">{notice.title}</h3>
          {!notice.approved && <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">Draft notice · pending legal review</p>}
        </header>
        <ul className="divide-y divide-line">
          {notice.body.items.map((it) => (
            <li key={it.purpose} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <p className="font-semibold text-heading">{it.why}</p>
                <p className="mt-1 text-sm text-muted"><span className="font-semibold">What:</span> {it.what} <span className="font-semibold">How long:</span> {it.keep}</p>
              </div>
              {it.required ? (
                <span className="justify-self-start rounded-full bg-panel px-3 py-1 text-xs font-semibold text-heading">Required for classes</span>
              ) : (
                <label className="flex items-center gap-2 justify-self-start text-sm font-semibold">
                  <input type="checkbox" className="h-5 w-5 accent-[var(--color-navy)]" checked={!!optional[it.purpose]} onChange={(e) => setOptional({ ...optional, [it.purpose]: e.target.checked })} />
                  Allow
                </label>
              )}
            </li>
          ))}
        </ul>
        <p className="border-t border-line p-4 text-sm text-muted">{notice.body.rights} {notice.body.grievance}</p>
      </section>

      <Check name="guardian" checked={guardian} onChange={setGuardian} error={err.fields?.guardianDeclared}>
        I am this child&apos;s parent or lawful guardian. I have read the notice above and I consent to the required items and the items I allowed.
      </Check>
      <FormError msg={err.msg} />
      <button className="btn btn-primary justify-self-start" disabled={busy || !name || !guardian}>{busy ? "Saving…" : "Save and continue"}</button>
    </form>
  );
}
