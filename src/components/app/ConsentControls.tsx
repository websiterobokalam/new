"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./client";
import type { Dict } from "@/i18n/en";

export function ConsentToggle({ learnerId, purpose, granted, label, t }: { learnerId: string; purpose: string; granted: boolean; label: string; t: Dict }) {
  const router = useRouter();
  const [on, setOn] = useState(granted);
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={busy}
      onClick={async () => { setBusy(true); const r = await post("/api/app/consents", { learnerId, purpose, granted: !on }); setBusy(false); if (r.ok) { setOn(!on); router.refresh(); } }}
      className={`inline-flex min-h-10 min-w-24 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold ${on ? "bg-navy text-white dark:bg-aqua dark:text-night" : "border border-line bg-surface text-muted"}`}>
      <span aria-hidden className={`h-3 w-3 rounded-full ${on ? "bg-leaf" : "bg-line"}`} />{on ? t.consent_on : t.consent_off}
    </button>
  );
}

export function DeleteLearner({ learnerId, t }: { learnerId: string; t: Dict }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string>();
  if (!open) return <button type="button" className="text-sm font-semibold text-[#b42318] underline dark:text-[#ff8a80]" onClick={() => setOpen(true)}>{t.delete_data}</button>;
  return (
    <form className="grid gap-2 rounded-2xl border border-[#f1b5ae] p-4" onSubmit={async (e) => {
      e.preventDefault();
      const r = await post("/api/app/data-requests", { kind: "erase", learnerId, confirmName: name });
      if (!r.ok) return setMsg(r.fields?.confirmName ?? r.error);
      setMsg(t.delete_requested); router.refresh();
    }}>
      <label className="field"><span>{t.delete_confirm}</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <div className="flex gap-2"><button className="btn bg-[#b42318] text-white" disabled={!name}>{t.delete_data}</button><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{t.close}</button></div>
    </form>
  );
}
