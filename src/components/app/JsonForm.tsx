"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./client";
import { flash } from "./Flash";

export type FieldDef = {
  name: string; label: string; type?: "text" | "textarea" | "number" | "select" | "checkbox" | "datetime" | "date" | "url" | "email";
  options?: [string, string][]; hint?: string; defaultValue?: string | number | boolean; optional?: boolean;
};

/** Small JSON form used across the Kalamite app and ops screens. */
export function JsonForm({ url, fields, submit, fixed = {}, redirect, done, tone = "primary", compact = false }: {
  url: string; fields: FieldDef[]; submit: string; fixed?: Record<string, unknown>; redirect?: string; done?: string; tone?: "primary" | "danger"; compact?: boolean;
}) {
  const router = useRouter();
  const uid = useId();
  // Until hydration the browser would submit natively (a GET with every field in the URL). Never allow that.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [errs, setErrs] = useState<Record<string, string>>({});
  // If this form vanishes right after a save (its item left the list on refresh), hand the message to the page.
  const lastOk = useRef<{ text: string; at: number }>(undefined);
  useEffect(() => () => { const m = lastOk.current; if (m && Date.now() - m.at < 5000) flash(m.text); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = { ...fixed };
    for (const f of fields) {
      if (f.type === "checkbox") { data[f.name] = fd.get(f.name) === "on"; continue; }
      const v = String(fd.get(f.name) ?? "");
      if (v === "" && f.optional) continue;
      data[f.name] = f.type === "number" ? Number(v) : f.type === "datetime" ? new Date(v).toISOString() : v;
    }
    setBusy(true); setMsg(undefined); setErrs({});
    const r = await post(url, data);
    setBusy(false);
    if (!r.ok) { setErrs(r.fields ?? {}); return setMsg({ ok: false, text: r.error ?? "Something went wrong" }); }
    if (redirect) return router.push(redirect);
    setMsg({ ok: true, text: done ?? "Saved" });
    lastOk.current = { text: done ?? "Saved", at: Date.now() };
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} method="post" action="#" className={`grid ${compact ? "gap-2" : "gap-4"}`} noValidate>
      {fields.map((f) => {
        const id = `${uid}-${f.name}`.replace(/[^\w-]/g, "_");
        const err = errs[f.name];
        if (f.type === "checkbox") return (
          <label key={f.name} className="flex items-start gap-3 text-sm"><input id={id} name={f.name} type="checkbox" defaultChecked={!!f.defaultValue} className="mt-0.5 h-5 w-5 accent-[var(--color-navy)]" /><span>{f.label}</span></label>
        );
        return (
          <label key={f.name} className="field" htmlFor={id}>
            <span className={compact ? "text-sm" : ""}>{f.label}</span>
            {f.type === "textarea" ? <textarea id={id} name={f.name} className="input min-h-24" defaultValue={f.defaultValue as string} aria-invalid={!!err || undefined} />
              : f.type === "select" ? <select id={id} name={f.name} className="input" defaultValue={f.defaultValue as string}>{f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              : <input id={id} name={f.name} className="input" type={f.type === "datetime" ? "datetime-local" : f.type ?? "text"} defaultValue={f.defaultValue as string} aria-invalid={!!err || undefined} />}
            {f.hint && !err && <small className="text-sm text-muted">{f.hint}</small>}
            {err && <small className="text-sm font-semibold text-[#b42318] dark:text-[#ff8a80]">{err}</small>}
          </label>
        );
      })}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-heading" : "text-[#b42318] dark:text-[#ff8a80]"}`}>{msg.text}</p>}
      <button className={`btn justify-self-start ${tone === "danger" ? "bg-[#b42318] text-white" : "btn-primary"} ${compact ? "!min-h-10 text-sm" : ""}`} disabled={busy || !ready}>{busy ? "…" : submit}</button>
    </form>
  );
}
