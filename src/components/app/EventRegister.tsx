"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "./client";
import { FormError } from "../forms/ui";

type Kid = { id: string; first_name: string; fits: boolean; consented: boolean; registered: boolean };

export function EventRegister({ slug, audience, kids, selfRegistered }: { slug: string; audience: "learners" | "adults"; kids: Kid[]; selfRegistered: boolean }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [done, setDone] = useState<string>();
  async function go(data: Record<string, unknown>, url = `/api/events/${slug}/register`, okText = "You're registered. We've emailed the details.") {
    setBusy(true); setErr(undefined); setDone(undefined);
    const r = await post(url, data);
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setDone(okText); setPicked([]); router.refresh();
  }
  if (audience === "adults") {
    return (
      <div className="grid gap-3">
        {selfRegistered ? (
          <>
            <p className="font-semibold text-heading">You're registered.</p>
            <button type="button" className="btn btn-ghost justify-self-start" disabled={busy} onClick={() => go({ who: "self" }, `/api/events/${slug}/cancel`, "Cancelled. Your place is free for someone else.")}>Cancel my place</button>
          </>
        ) : <button type="button" className="btn btn-primary justify-self-start" disabled={busy} onClick={() => go({ self: true })}>{busy ? "Registering…" : "Register me"}</button>}
        <FormError msg={err} />
        {done && <p role="status" className="rounded-xl bg-leafmist p-3 font-semibold text-navy">{done}</p>}
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      {kids.length === 0 && <p className="text-muted">Add your child first (with your consent), then come back. <a className="font-semibold text-link underline" href="/app/learners/new">Add a child</a></p>}
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-semibold text-heading">Who's coming?</legend>
        {kids.map((k) => (
          <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
            {k.registered ? (
              <>
                <span><strong className="text-heading">{k.first_name}</strong> is registered</span>
                <button type="button" className="text-sm font-semibold text-link underline" disabled={busy} onClick={() => go({ who: k.id }, `/api/events/${slug}/cancel`, `Cancelled for ${k.first_name}.`)}>Cancel {k.first_name}&apos;s place</button>
              </>
            ) : (
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-5 w-5" disabled={!k.fits || !k.consented} checked={picked.includes(k.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, k.id] : p.filter((x) => x !== k.id)))} />
                <span><strong className="text-heading">{k.first_name}</strong>{!k.fits ? " · not in this event's age group" : !k.consented ? " · needs the required consents first" : ""}</span>
              </label>
            )}
          </div>
        ))}
      </fieldset>
      <FormError msg={err} />
      {done && <p role="status" className="rounded-xl bg-leafmist p-3 font-semibold text-navy">{done}</p>}
      {kids.some((k) => !k.registered && k.fits && k.consented) && (
        <button type="button" className="btn btn-primary justify-self-start" disabled={busy || picked.length === 0} onClick={() => go({ learnerIds: picked })}>{busy ? "Registering…" : "Register"}</button>
      )}
    </div>
  );
}
