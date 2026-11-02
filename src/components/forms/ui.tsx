"use client";
import { useState } from "react";

export type Errors = Record<string, string>;

export function useLeadSubmit() {
  const [state, setState] = useState<{ status: "idle" | "sending" | "done" | "error"; ref?: string; error?: string; fields: Errors }>({ status: "idle", fields: {} });
  async function submit(data: Record<string, unknown>) {
    setState({ status: "sending", fields: {} });
    try {
      const r = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json();
      if (j.ok) setState({ status: "done", ref: j.ref, fields: {} });
      else setState({ status: "error", error: j.error, fields: j.fields ?? {} });
      return j.ok as boolean;
    } catch {
      setState({ status: "error", error: "You seem to be offline. Please try again.", fields: {} });
      return false;
    }
  }
  return { ...state, submit };
}

export function regionFromCookie(): "ts-ap" | "india" | "intl" {
  if (typeof document === "undefined") return "ts-ap";
  const m = document.cookie.match(/(?:^|; )rk_region=([^;]+)/);
  return m && ["ts-ap", "india", "intl"].includes(m[1]) ? (m[1] as "ts-ap") : "ts-ap";
}

export function Field({ label, name, error, hint, ...rest }: { label: string; name: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} className="input" aria-invalid={!!error || undefined} aria-describedby={error ? `${name}-err` : hint ? `${name}-hint` : undefined} {...rest} />
      {hint && !error && <small id={`${name}-hint`} className="text-sm text-muted">{hint}</small>}
      {error && <small id={`${name}-err`} className="text-sm font-semibold text-[#b42318] dark:text-[#ff8a80]">{error}</small>}
    </label>
  );
}

export function Select({ label, name, options, error, ...rest }: { label: string; name: string; options: readonly string[] | { value: string; label: string }[]; error?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} className="input" aria-invalid={!!error || undefined} {...rest}>
        {options.map((o) => (typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      {error && <small className="text-sm font-semibold text-[#b42318] dark:text-[#ff8a80]">{error}</small>}
    </label>
  );
}

/** Chip group backed by real radio or checkbox inputs (keyboard and screen reader friendly). */
export function Chips({ legend, name, options, type = "radio", value, onChange, error }: {
  legend: string; name: string; options: { value: string; label: string }[]; type?: "radio" | "checkbox";
  value: string | string[]; onChange: (v: string | string[]) => void; error?: string;
}) {
  const vals = Array.isArray(value) ? value : [value];
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-semibold text-heading">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="chip">
            <input className="sr-only" type={type} name={name} value={o.value} checked={vals.includes(o.value)}
              onChange={(e) => {
                if (type === "radio") onChange(o.value);
                else onChange(e.target.checked ? [...vals, o.value] : vals.filter((v) => v !== o.value));
              }} />
            {o.label}
          </label>
        ))}
      </div>
      {error && <small className="text-sm font-semibold text-[#b42318] dark:text-[#ff8a80]">{error}</small>}
    </fieldset>
  );
}

export function Check({ name, children, checked, onChange, error }: { name: string; children: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-navy)]" />
        <span>{children}</span>
      </label>
      {error && <small className="ml-8 text-sm font-semibold text-[#b42318] dark:text-[#ff8a80]">{error}</small>}
    </div>
  );
}

export function Honeypot() {
  return (
    <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}

export function Done({ title, refId, children }: { title: string; refId?: string; children?: React.ReactNode }) {
  return (
    <div className="card p-6 text-center sm:p-10" role="status">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leafmist text-2xl text-navy" aria-hidden>✓</div>
      <h2 className="display-md mt-4">{title}</h2>
      {refId && <p className="mt-2 font-mono text-sm text-muted">Reference {refId}</p>}
      {children && <div className="mt-3 text-muted">{children}</div>}
    </div>
  );
}

export function FormError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="alert" className="rounded-xl bg-[#fde8e7] px-4 py-3 text-sm font-semibold text-[#8a1c13] dark:bg-[#3a1512] dark:text-[#ffb4ab]">{msg}</p>;
}

export const WORLD_OPTIONS = [
  { value: "robotics", label: "Robotics" },
  { value: "iot", label: "IoT" },
  { value: "ai", label: "AI" },
  { value: "coding", label: "Coding" },
  { value: "finlit", label: "Financial Literacy" },
  { value: "space", label: "Space" },
];
