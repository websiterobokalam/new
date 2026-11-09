"use client";
import { useState } from "react";
import { Field, FormError, Check, Honeypot, Done } from "./ui";

const TOPIC_OPTIONS: [string, string][] = [
  ["parent", "My child's classes"],
  ["school", "A lab or platform for a school"],
  ["kalamite", "Teaching as a Kalamite"],
  ["partner", "Partnership, CSR or government"],
  ["media", "Media or events"],
  ["careers", "Jobs and internships"],
  ["other", "Something else"],
];

async function send(url: string, data: Record<string, unknown>) {
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    return (await r.json()) as { ok: boolean; ref?: string; error?: string; fields?: Record<string, string> };
  } catch {
    return { ok: false, error: "You seem to be offline. Please try again." };
  }
}

/** Contact form: one place for any question, routed to the right team. */
export function ContactForm() {
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ error?: string; fields?: Record<string, string> }>({});
  const [ref, setRef] = useState<string>();
  if (ref) return <Done title="Thanks, we've got your message" refId={ref}>We've emailed you a copy. Someone from the right team will reply, usually within one working day.</Done>;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true); setErr({});
    const r = await send("/api/enquiries", { ...Object.fromEntries(fd), adult });
    setBusy(false);
    if (!r.ok) return setErr(r);
    window.rkTrack?.("generate_lead", { form: "contact" });
    setRef(r.ref);
  }
  return (
    <form onSubmit={submit} className="card relative grid gap-4 p-6 sm:p-8" noValidate aria-labelledby="contact-form-h">
      <h2 id="contact-form-h" className="text-xl font-bold text-heading">Write to us</h2>
      <Honeypot />
      <label className="grid gap-1.5">
        <span className="font-semibold text-heading">What's it about?</span>
        <select name="topic" className="input" defaultValue="parent">
          {TOPIC_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" error={err.fields?.name} />
        <Field label="Your email" name="email" type="email" inputMode="email" autoComplete="email" error={err.fields?.email} />
        <Field label="Mobile (optional)" name="phone" type="tel" inputMode="tel" autoComplete="tel" error={err.fields?.phone} />
        <Field label="School or organisation (optional)" name="organisation" autoComplete="organization" error={err.fields?.organisation} />
      </div>
      <label className="grid gap-1.5">
        <span className="font-semibold text-heading">Your message</span>
        <textarea name="message" rows={5} maxLength={2000} className="input min-h-32" aria-invalid={!!err.fields?.message || undefined} aria-describedby={err.fields?.message ? "message-err" : undefined} />
        {err.fields?.message && <small id="message-err" className="text-sm font-semibold text-[#b42318] dark:text-[#ff8a80]">{err.fields.message}</small>}
      </label>
      <Check name="adult" checked={adult} onChange={setAdult} error={err.fields?.adult}>I am 18 or older. (Questions about a child come from their parent or guardian; please don't include a child's full name or contact details.)</Check>
      <FormError msg={err.error} />
      <button className="btn btn-primary justify-self-start" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
    </form>
  );
}

/** Newsletter sign-up, adults only, confirmed by email. */
export function NewsletterForm({ source = "site", compact = false }: { source?: string; compact?: boolean }) {
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ error?: string; fields?: Record<string, string> }>({});
  const [done, setDone] = useState(false);
  if (done) return <p role="status" className="rounded-xl bg-leafmist p-4 font-semibold text-navy">Nearly there: check your inbox and click the link to confirm.</p>;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true); setErr({});
    const r = await send("/api/newsletter", { email: fd.get("email"), website: fd.get("website"), adult, source });
    setBusy(false);
    if (!r.ok) return setErr(r);
    window.rkTrack?.("sign_up", { method: "newsletter" });
    setDone(true);
  }
  return (
    <form onSubmit={submit} className={`relative grid gap-3 ${compact ? "" : "card p-6"}`} noValidate aria-label="Newsletter sign-up">
      {!compact && <h2 className="text-xl font-bold text-heading">Get the newsletter</h2>}
      {!compact && <p className="text-sm text-muted">New projects, guides for parents and schools, and events. About twice a month. Unsubscribe in one click.</p>}
      <Honeypot />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1"><Field label="Email for the newsletter" name="email" type="email" inputMode="email" autoComplete="email" error={err.fields?.email} /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Subscribe"}</button>
      </div>
      <Check name="nl-adult" checked={adult} onChange={setAdult} error={err.fields?.adult}>I am 18 or older.</Check>
      <FormError msg={err.error} />
    </form>
  );
}
