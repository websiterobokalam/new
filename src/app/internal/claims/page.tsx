import type { Metadata } from "next";
import { claims } from "@/content/claims";
import { isPublishable, claimsSummary, claimText } from "@/lib/claims";

export const metadata: Metadata = { title: "Claims Register", robots: { index: false, follow: false } };

/** Internal review view of the Claims Register. Moves behind ops login in Phase 2. */
export default function ClaimsPage() {
  const s = claimsSummary();
  return (
    <section className="py-12">
      <div className="wrap">
        <p className="eyebrow">Internal · not linked · noindex</p>
        <h1 className="display-lg mt-3">Claims Register</h1>
        <p className="mt-3 text-muted">{s.approved} live · {s.pending} pending · {s.retired} retired. A claim renders only when approved, with value, as-of date, evidence and owner.</p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead><tr className="border-b border-line text-muted">{["Status", "ID", "Public text", "Definition", "As of", "Evidence", "Owner", "Used on", "Notes"].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead>
            <tbody>
              {claims.map((c) => {
                const st = c.retired ? "Retired" : isPublishable(c) ? "Live" : "Pending";
                return (
                  <tr key={c.id} className="border-b border-line/60 align-top">
                    <td className="py-2 pr-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${st === "Live" ? "bg-leafmist text-navy" : st === "Retired" ? "bg-line text-muted" : "bg-[#fff4cc] text-[#5c4500]"}`}>{st}</span></td>
                    <td className="py-2 pr-3 font-mono">{c.id}</td>
                    <td className="py-2 pr-3 font-semibold text-heading">{c.value === null ? "—" : claimText(c)}</td>
                    <td className="py-2 pr-3">{c.definition}</td>
                    <td className="py-2 pr-3">{c.asOf ?? "—"}</td>
                    <td className="py-2 pr-3">{c.evidence ?? "—"}</td>
                    <td className="py-2 pr-3">{c.owner ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{c.where.join(" ")}</td>
                    <td className="py-2 pr-3 text-muted">{c.notes ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
