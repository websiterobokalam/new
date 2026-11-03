"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "../app/client";

type Student = { ref: string; name: string };

/**
 * Attendance for one class. With a live 21cschool roster, tick who is
 * present; names are sent to the ERP and only counts are kept by Robokalam.
 * Without it, enter counts.
 */
export function Attendance({ sessionId, roster, classSize, lessonTitle }: { sessionId: string; roster: Student[] | null; classSize: number; lessonTitle?: string }) {
  const router = useRouter();
  const [present, setPresent] = useState<Set<string>>(new Set(roster?.map((s) => s.ref) ?? []));
  const form = useRef<HTMLFormElement>(null);
  // No native submit before hydration: it would put the form in the URL.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();

  async function submit(status: "held" | "cancelled") {
    const fd = new FormData(form.current!);
    const data: Record<string, unknown> = { status, lessonTitle: String(fd.get("lessonTitle") ?? "") || undefined, notes: String(fd.get("notes") ?? "") || undefined };
    if (status === "held") {
      if (roster) data.presentRefs = [...present];
      else { data.present = Number(fd.get("present")); data.total = Number(fd.get("total")); }
    }
    setBusy(true); setMsg(undefined);
    const r = await post<{ receipt: string | null }>(`/api/school/sessions/${sessionId}`, data);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Something went wrong" });
    setMsg({ ok: true, text: status === "held" ? `Class recorded${r.receipt ? ` · 21cschool receipt ${r.receipt}` : ""}` : "Marked as not held" });
    router.refresh();
  }

  return (
    <form ref={form} method="post" action="#" className="grid gap-4" noValidate onSubmit={(e) => { e.preventDefault(); submit("held"); }}>
      {roster ? (
        <fieldset className="grid gap-2">
          <legend className="font-semibold text-heading">Who is here? <span className="font-normal text-muted">({present.size} of {roster.length})</span></legend>
          <ul className="grid gap-1 sm:grid-cols-2">
            {roster.map((s) => (
              <li key={s.ref}>
                <label className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-panel">
                  <input type="checkbox" disabled={!ready} className="h-5 w-5 accent-[var(--color-navy)]" checked={present.has(s.ref)}
                    onChange={(e) => setPresent((p) => { const n = new Set(p); if (e.target.checked) n.add(s.ref); else n.delete(s.ref); return n; })} />
                  {s.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field"><span>Students present</span><input name="present" type="number" min={0} max={80} className="input" inputMode="numeric" /></label>
          <label className="field"><span>Class size today</span><input name="total" type="number" min={1} max={80} defaultValue={classSize} className="input" inputMode="numeric" /></label>
        </div>
      )}
      <label className="field"><span>What you taught</span><input name="lessonTitle" className="input" defaultValue={lessonTitle} maxLength={160} /></label>
      <label className="field"><span>Notes for the school (optional)</span><textarea name="notes" className="input min-h-20" maxLength={500} /></label>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-heading" : "text-[#b42318] dark:text-[#ff8a80]"}`}>{msg.text}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={busy || !ready}>{busy ? "Saving…" : "Save attendance"}</button>
        <button type="button" className="btn btn-ghost" disabled={busy || !ready} onClick={() => submit("cancelled")}>Class didn&apos;t happen</button>
      </div>
    </form>
  );
}
