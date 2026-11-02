"use client";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { post } from "./client";
import type { Dict } from "@/i18n/en";

const CATS = ["safety", "contact_details", "inappropriate", "bullying", "technical", "other"] as const;

/** One-tap report, present on every page of the learner app. */
export function ReportButton({ t, learnerId }: { t: Dict; learnerId?: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const page = usePathname();
  const [cat, setCat] = useState<(typeof CATS)[number]>("safety");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState<string>();
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(undefined);
    const r = await post<{ respondBy: string }>("/api/app/reports", { page, category: cat, details, learnerId });
    setBusy(false);
    if (!r.ok) return setErr(r.fields?.details ?? r.error);
    setDone(new Date(r.respondBy).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }));
  }

  return (
    <>
      <button type="button" onClick={() => { setDone(undefined); dlg.current?.showModal(); }}
        className="fixed bottom-4 right-4 z-50 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#b42318] px-5 font-semibold text-white shadow-lg hover:bg-[#912018] focus-visible:outline-offset-4"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }} data-noprint>
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path d="M5 21V4m0 0h11l-2 4 2 4H5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
        {t.report}
      </button>
      <dialog ref={dlg} className="w-[min(560px,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-line bg-surface p-0 text-fg backdrop:bg-night/60" aria-labelledby="report-title">
        <div className="grid gap-4 p-6">
          <h2 id="report-title" className="display-md">{t.report_title}</h2>
          <p className="text-muted">{t.report_lead}</p>
          {done ? (
            <p role="status" className="rounded-xl bg-leafmist p-4 font-semibold text-navy dark:bg-panel-2 dark:text-heading">{t.report_sent} {done}.</p>
          ) : (
            <form onSubmit={send} className="grid gap-4" noValidate>
              <fieldset className="grid gap-2">
                <legend className="mb-1 font-semibold text-heading">{t.report_category}</legend>
                {CATS.map((c) => (
                  <label key={c} className="flex items-center gap-3">
                    <input type="radio" name="cat" value={c} checked={cat === c} onChange={() => setCat(c)} className="h-5 w-5 accent-[var(--color-navy)]" />
                    {t[`cat_${c}`]}
                  </label>
                ))}
              </fieldset>
              <label className="field"><span>{t.report_details}</span>
                <textarea className="input min-h-28" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} />
              </label>
              {err && <p role="alert" className="text-sm font-semibold text-[#b42318] dark:text-[#ff8a80]">{err}</p>}
              <button className="btn bg-[#b42318] text-white" disabled={busy || !details.trim()}>{busy ? "…" : t.report_send}</button>
            </form>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => dlg.current?.close()}>{t.close}</button>
        </div>
      </dialog>
    </>
  );
}
