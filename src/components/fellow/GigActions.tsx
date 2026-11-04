"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "../app/client";

export function GigActions({ gigId, canAccept, reason, myStatus }: { gigId: string; canAccept: boolean; reason: string | null; myStatus: string | null }) {
  const router = useRouter();
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const act = async (action: "accept" | "decline" | "withdraw") => {
    setBusy(true); setErr(undefined);
    const r = await post(`/api/fellow/gigs/${gigId}`, { action });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    router.refresh();
  };
  if (myStatus === "accepted") return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`/app/fellow/gigs/${gigId}`} className="btn btn-primary !min-h-10 text-sm">Teach mode</a>
      <a href={`/api/fellow/gigs/${gigId}/calendar`} download className="text-sm font-semibold text-link underline">Add to calendar</a>
      <button type="button" className="btn btn-ghost !min-h-10 text-sm" disabled={busy} onClick={() => act("withdraw")}>Withdraw</button>
      {err && <span role="alert" className="text-sm">{err}</span>}
    </div>
  );
  if (myStatus) return <span className="text-sm font-semibold text-muted">{myStatus === "declined" ? "Declined · no penalty" : myStatus}</span>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-primary !min-h-10 text-sm" disabled={!canAccept || busy} onClick={() => act("accept")}>Accept</button>
      <button type="button" className="btn btn-ghost !min-h-10 text-sm" disabled={busy} onClick={() => act("decline")}>Decline</button>
      {reason && <span className="text-sm text-muted">{reason}</span>}
      {err && <span role="alert" className="text-sm font-semibold text-[#b42318]">{err}</span>}
    </div>
  );
}

export function HelpButtons({ gigId }: { gigId: string | null }) {
  const [sent, setSent] = useState<string>();
  const ask = async (kind: string, label: string) => { const r = await post("/api/fellow/help", { gigId, kind }); setSent(r.ok ? `${label}: help is on the way.` : r.error); };
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn bg-[#b42318] !min-h-10 text-sm text-white" onClick={() => ask("safety", "Safety")}>Safety concern</button>
        {[["tech", "Tech problem"], ["kit", "Kit problem"], ["learner", "Learner needs support"], ["other", "Something else"]].map(([k, l]) => <button key={k} type="button" className="btn btn-ghost !min-h-10 text-sm" onClick={() => ask(k, l)}>{l}</button>)}
      </div>
      {sent && <p role="status" className="text-sm font-semibold">{sent}</p>}
    </div>
  );
}

type R = { booking_id: string; first_name: string; age_band: string; built: number; status: string };
export function TeachForm({ gigId, roster, projects, delivered, opensAt }: { gigId: string; roster: R[]; projects: { id: string; title: string }[]; delivered: boolean; opensAt: string }) {
  const router = useRouter();
  const [rec, setRec] = useState(() => Object.fromEntries(roster.map((r) => [r.booking_id, { attended: r.status !== "no_show", builtProject: "", feedback: "" }])));
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  if (delivered) return <p className="rounded-xl bg-leafmist p-4 font-semibold text-navy">Session recorded. Pay is added to this week&apos;s earnings.</p>;
  return (
    <form className="grid gap-3" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await post(`/api/fellow/gigs/${gigId}/deliver`, { records: roster.map((x) => ({ bookingId: x.booking_id, attended: rec[x.booking_id].attended, builtProject: rec[x.booking_id].builtProject || undefined, feedback: rec[x.booking_id].feedback || undefined })) });
      setBusy(false);
      if (!r.ok) return setErr(r.error);
      router.refresh();
    }}>
      {roster.length === 0 && <p className="text-muted">No learners booked. You can still mark the session delivered.</p>}
      {roster.map((x) => (
        <fieldset key={x.booking_id} className="grid gap-2 rounded-2xl border border-line p-4 sm:grid-cols-[1fr_auto_1fr]">
          <legend className="px-1 font-semibold text-heading">{x.first_name} · {x.age_band} · {x.built} built</legend>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[var(--color-navy)]" checked={rec[x.booking_id].attended} onChange={(e) => setRec({ ...rec, [x.booking_id]: { ...rec[x.booking_id], attended: e.target.checked } })} />Present</label>
          <label className="field"><span className="text-sm">Built today</span>
            <select className="input" value={rec[x.booking_id].builtProject} onChange={(e) => setRec({ ...rec, [x.booking_id]: { ...rec[x.booking_id], builtProject: e.target.value } })}><option value="">Nothing finished</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
          </label>
          <label className="field sm:col-span-3"><span className="text-sm">One line for the parent</span><input className="input" maxLength={500} value={rec[x.booking_id].feedback} onChange={(e) => setRec({ ...rec, [x.booking_id]: { ...rec[x.booking_id], feedback: e.target.value } })} /></label>
        </fieldset>
      ))}
      {err && <p role="alert" className="font-semibold text-[#b42318]">{err}</p>}
      {Date.now() < new Date(opensAt).getTime() ? (
        <p className="text-sm text-muted">You can record attendance from 15 minutes before the start, {new Date(opensAt).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}.</p>
      ) : (
        <button className="btn btn-primary justify-self-start" disabled={busy}>{busy ? "Saving…" : "Mark session delivered"}</button>
      )}
    </form>
  );
}
