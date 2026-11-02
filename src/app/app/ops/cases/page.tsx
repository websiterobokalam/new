import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Disputes and cases" };

export default async function OpsCases() {
  const { account } = await appContext("/app/ops/cases");
  if (!["ops", "safeguarding"].includes(account.role)) notFound();
  const d = await system(async (c) => ({
    disputes: (await c.query("SELECT d.*, coalesce(f.full_name, 'Parent') AS who FROM disputes d LEFT JOIN fellows f ON f.account_id = d.raised_by WHERE d.status <> 'resolved' ORDER BY d.created_at")).rows,
    cases: (await c.query("SELECT k.*, f.full_name, now() >= k.notice_until AS notice_over, (SELECT json_agg(r.body ORDER BY r.created_at) FROM removal_responses r WHERE r.case_id = k.id) AS responses FROM removal_cases k JOIN fellows f ON f.account_id = k.fellow_id WHERE k.status = 'notice' ORDER BY k.opened_at")).rows,
  }));
  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <h1 className="display-lg">Disputes and cases</h1>
      <section><h2 className="display-md">Removal cases</h2>
        <ul className="mt-3 grid gap-3">{d.cases.map((k) => (
          <li key={k.id} className="card grid gap-2 p-5">
            <p className="font-semibold">{k.full_name} · {k.child_safety ? "Child safety (suspended)" : `notice until ${new Date(k.notice_until).toLocaleDateString("en-IN")}`}</p>
            <p className="text-sm">Reasons: {k.reasons}</p>
            <p className="text-sm text-muted">Fellow&apos;s response: {k.responses ? k.responses.join(" / ") : "none yet"}</p>
            <div className="max-w-lg"><JsonForm compact url={`/api/ops/cases/${k.id}/decide`} submit="Record decision" fields={[
              { name: "decision", label: "Decision", type: "select", options: [["reinstated", "Reinstate / no action"], ["removed", k.notice_over || k.child_safety ? "Remove" : "Remove (available after notice)"]] },
              { name: "enquiryNotes", label: "Enquiry notes", type: "textarea" },
            ]} /></div>
          </li>
        ))}{d.cases.length === 0 && <li className="text-muted">No open cases.</li>}</ul>
      </section>
      <section><h2 className="display-md">Disputes (committee)</h2>
        <ul className="mt-3 grid gap-3">{d.disputes.map((x) => (
          <li key={x.id} className="card grid gap-2 p-5">
            <p className="font-semibold">{x.who} · {x.subject} · {x.status} · {new Date(x.created_at).toLocaleDateString("en-IN")}</p>
            <p className="text-sm">{x.details}</p>
            <div className="max-w-lg"><JsonForm compact url={`/api/ops/disputes/${x.id}`} submit="Update" fields={[{ name: "status", label: "Status", type: "select", options: [["committee", "With committee"], ["resolved", "Resolved"]] }, { name: "resolution", label: "Resolution (shared with them)", type: "textarea", optional: true }]} /></div>
          </li>
        ))}{d.disputes.length === 0 && <li className="text-muted">No open disputes.</li>}</ul>
      </section>
    </div></section>
  );
}
