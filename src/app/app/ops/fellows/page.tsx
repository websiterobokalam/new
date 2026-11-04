import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { STEPS, STEP_LABEL, PILOT } from "@/lib/fellows/core";
import { metrics, suggestTier } from "@/lib/fellows/tiers";
import { JsonForm } from "@/components/app/JsonForm";
import { StaffButton } from "@/components/app/StaffActions";

export const metadata = { title: "Kalamites" };
const REVIEWABLE = ["subject_test", "demo", "identity", "background", "references"] as const;

export default async function OpsFellows() {
  const { account } = await appContext("/app/ops/fellows");
  if (account.role !== "ops") notFound();
  const d = await system(async (c) => {
    const fellows = (await c.query("SELECT f.*, a.phone_e164 FROM fellows f JOIN accounts a ON a.id = f.account_id ORDER BY (f.status = 'live'), f.created_at DESC LIMIT 200")).rows;
    const steps = (await c.query("SELECT fellow_id, step, status, detail FROM vetting_steps")).rows;
    const withM = await Promise.all(fellows.map(async (f) => ({ ...f, m: f.status === "live" ? await metrics(c, f.account_id) : null })));
    return { fellows: withM, steps, live: fellows.filter((f) => f.status === "live").length };
  });
  return (
    <section className="py-10"><div className="wrap grid gap-6 [&>*]:min-w-0">
      <header><h1 className="display-lg">Kalamites</h1><p className="text-muted">Pilot: {PILOT.city} · {d.live} of {PILOT.maxLive} live. <a className="underline" href="/api/ops/compliance">Download gig-worker register (CSV)</a></p></header>
      <ul className="grid gap-4">
        {d.fellows.map((f) => {
          const st = Object.fromEntries(d.steps.filter((s) => s.fellow_id === f.account_id).map((s) => [s.step, s]));
          return (
            <li key={f.account_id} className="card grid gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-bold text-heading">{f.full_name} <span className="text-sm font-normal text-muted">· {f.college} · {f.city} · {f.worlds.join(", ")} · {f.status} · {f.tier}</span></p>
                {f.status === "vetting" && <StaffButton url={`/api/ops/fellows/${f.account_id}/live`} data={{}} label="Go live" />}
              </div>
              <ol className="flex flex-wrap gap-1.5 text-xs">{STEPS.map((s) => <li key={s} className={`rounded-full px-2 py-0.5 ${st[s]?.status === "passed" ? "bg-leafmist text-navy" : st[s]?.status === "submitted" ? "bg-[#FEEBD0] text-[#6B3F00]" : st[s]?.status === "failed" ? "bg-[#fde8e7] text-[#8a1c13]" : "bg-panel text-muted"}`}>{STEP_LABEL[s]}: {st[s]?.status ?? "pending"}</li>)}</ol>
              {st.demo?.detail?.url && <p className="text-sm">Demo: <a className="underline" href={st.demo.detail.url} rel="noreferrer noopener" target="_blank">{st.demo.detail.topic}</a></p>}
              {st.references?.detail?.refs && <p className="text-sm">References: {st.references.detail.refs.map((r: { name: string; relation: string; contact: string }) => `${r.name} (${r.relation}, ${r.contact})`).join("; ")}</p>}
              {f.status === "vetting" && (
                <details><summary className="cursor-pointer text-sm font-semibold text-link">Record a check</summary>
                  <div className="mt-3 max-w-lg"><JsonForm compact url={`/api/ops/fellows/${f.account_id}/review`} submit="Save result" fields={[
                    { name: "step", label: "Step", type: "select", options: REVIEWABLE.map((s) => [s, STEP_LABEL[s]]) },
                    { name: "outcome", label: "Outcome", type: "select", options: [["passed", "Passed"], ["failed", "Failed"]] },
                    { name: "vendorRef", label: "Verification partner reference (identity/background)", optional: true },
                    { name: "note", label: "Note" },
                  ]} /></div>
                </details>
              )}
              {f.m && (
                <div className="grid gap-2 text-sm">
                  <p>Delivered {f.m.delivered} · reliability {f.m.reliability === null ? "—" : `${Math.round(f.m.reliability * 100)}%`} · rating {f.m.rating ?? "—"} ({f.m.reviews}) · formula suggests <strong>{suggestTier(f.m)}</strong></p>
                  <details><summary className="cursor-pointer font-semibold text-link">Confirm tier, or open a case</summary>
                    <div className="mt-3 grid max-w-lg gap-6">
                      <JsonForm compact url={`/api/ops/fellows/${f.account_id}/tier`} submit="Set level" fields={[{ name: "tier", label: "Level", type: "select", defaultValue: f.tier, options: [["apprentice", "Junior Kalamite"], ["fellow", "Kalamite"], ["senior", "Senior Kalamite"], ["lead", "Lead Kalamite"]] }, { name: "note", label: "Reason (shown in audit log)" }]} />
                      <JsonForm compact url="/api/ops/cases" fixed={{ fellowId: f.account_id, childSafety: false }} submit="Open removal case (7 days' notice)" tone="danger" fields={[{ name: "reasons", label: "Written reasons (shared with the Kalamite)", type: "textarea" }]} />
                    </div>
                  </details>
                </div>
              )}
            </li>
          );
        })}
        {d.fellows.length === 0 && <li className="text-muted">No applications yet.</li>}
      </ul>
    </div></section>
  );
}
