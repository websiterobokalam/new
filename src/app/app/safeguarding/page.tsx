import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { StaffButton } from "@/components/app/StaffActions";

export const metadata = { title: "Safeguarding queue" };

export default async function Safeguarding() {
  const { account } = await appContext("/app/safeguarding");
  if (account.role !== "safeguarding") notFound();
  const reports = await asAccount(account, async (c) => (await c.query("SELECT id, category, details, page, status, respond_by, created_at, respond_by < now() AS overdue FROM safety_reports WHERE status <> 'closed' ORDER BY (category = 'safety') DESC, created_at")).rows);
  return (
    <section className="py-10">
      <div className="wrap grid gap-6">
        <h1 className="display-lg">Safeguarding queue</h1>
        <p className="text-muted">On a credible safety concern: suspend access at once and follow the POCSO reporting duty. Restriction tools arrive with Fellows in Phase 3.</p>
        <ul className="grid gap-3">
          {reports.map((r) => (
            <li key={r.id} className={`card grid gap-2 p-4 ${r.overdue ? "border-[#b42318]" : ""}`}>
              <p className="font-semibold">{r.category.replace("_", " ")} · {r.status} · respond by {new Date(r.respond_by).toLocaleString("en-IN")}{r.overdue && " · OVERDUE"}</p>
              <p>{r.details}</p>
              <p className="text-xs text-muted">Page: {r.page}</p>
              <div className="flex flex-wrap gap-2">
                {["acknowledged", "actioned", "closed"].map((s) => <StaffButton key={s} url={`/api/safeguarding/reports/${r.id}`} data={{ status: s }} label={s} tone={s === "acknowledged" ? "primary" : "ghost"} />)}
              </div>
            </li>
          ))}
          {reports.length === 0 && <li className="text-muted">No open reports.</li>}
        </ul>
      </div>
    </section>
  );
}
