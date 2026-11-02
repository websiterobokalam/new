"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "./client";

export function StaffButton({ url, data, label, tone = "primary" }: { url: string; data: object; label: string; tone?: "primary" | "ghost" }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string>();
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className={`btn btn-${tone} !min-h-10 !px-4 text-sm`} onClick={async () => { const r = await post(url, data); if (r.ok) router.refresh(); else setMsg(r.error); }}>{label}</button>
      {msg && <span role="alert" className="text-sm">{msg}</span>}
    </span>
  );
}

export function SessionRecord({ bookingId, projects }: { bookingId: string; projects: { id: string; title: string }[] }) {
  const router = useRouter();
  const [fb, setFb] = useState("");
  const [next, setNext] = useState("");
  const [proj, setProj] = useState("");
  const [msg, setMsg] = useState<string>();
  async function save(status: "attended" | "no_show") {
    const r = await post(`/api/ops/bookings/${bookingId}`, { status, feedback: fb || undefined, nextStep: next || undefined, builtProject: proj || undefined });
    if (r.ok) router.refresh(); else setMsg(r.error);
  }
  return (
    <div className="grid gap-2">
      <label className="field"><span className="text-sm">Plain feedback for the parent</span><textarea className="input min-h-16" value={fb} onChange={(e) => setFb(e.target.value)} /></label>
      <label className="field"><span className="text-sm">Next step (include the full fee if suggesting a course)</span><input className="input" value={next} onChange={(e) => setNext(e.target.value)} /></label>
      <label className="field"><span className="text-sm">Project built</span>
        <select className="input" value={proj} onChange={(e) => setProj(e.target.value)}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
      </label>
      <div className="flex gap-2"><button type="button" className="btn btn-primary !min-h-10 text-sm" onClick={() => save("attended")}>Attended</button><button type="button" className="btn btn-ghost !min-h-10 text-sm" onClick={() => save("no_show")}>Missed</button></div>
      {msg && <p role="alert" className="text-sm">{msg}</p>}
    </div>
  );
}
