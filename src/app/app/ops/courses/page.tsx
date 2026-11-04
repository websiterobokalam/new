import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { inr } from "@/lib/money";
import { readiness } from "@/lib/market/gate";
import { fellowSharePct } from "@/lib/market/courses";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Course reviews" };
const SEV: Record<string, string> = { high: "Serious", warn: "Check", info: "Note" };

export default async function OpsCourses() {
  const { account } = await appContext("/app/ops/courses");
  if (account.role !== "ops") notFound();
  const [d, r] = await Promise.all([system(async (c) => ({
    drafts: (await c.query(
      `SELECT d.*, f.display_name, f.tier FROM course_drafts d JOIN fellows f ON f.account_id = d.fellow_id
       WHERE d.status IN ('submitted','approved') ORDER BY d.status = 'approved', d.submitted_at`)).rows,
    flags: (await c.query("SELECT * FROM quality_flags WHERE subject_type = 'course_draft' ORDER BY FIELD(severity,'high','warn','info'), created_at")).rows,
  })), readiness()]);
  const share = fellowSharePct();

  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <header>
        <h1 className="display-lg">Course reviews</h1>
        <p className="mt-2 max-w-3xl text-muted">Fellow&apos;s Own Courses. Checks and AI only raise points; you decide each one, then the course. Approved courses go public only when the marketplace is open{share ? ` (Fellow share ${share}%)` : " and the Fellow share is set (OWN_COURSE_FELLOW_SHARE_PCT)"}.</p>
      </header>
      {d.drafts.length === 0 && <p className="text-muted">Nothing waiting.</p>}
      {d.drafts.map((x) => {
        const flags = d.flags.filter((f) => f.subject_id === x.id);
        const open = flags.filter((f) => f.status === "open").length;
        return (
          <article key={x.id} className="card grid gap-3 p-6" aria-label={x.title} data-review={x.title}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl font-bold">{x.title}</h2>
              <span className="text-sm text-muted">by {x.display_name} ({x.tier}) · {x.status === "submitted" ? "waiting for review" : "approved, not public"}</span>
            </div>
            <p className="text-sm text-muted">{x.world} · ages {x.age_min} to {x.age_max} · {x.sessions} sessions · up to {x.batch_size_max} learners · {inr(x.fee_paise)}{x.kit ? ` · kit: ${x.kit}` : ""}</p>
            <p><strong>Outcome:</strong> {x.outcome}</p>
            <ol className="list-inside list-decimal text-sm">{(x.syllabus as { title: string; build: string }[]).map((s, i) => <li key={i}><strong>{s.title}</strong>: {s.build}</li>)}</ol>
            {flags.length > 0 && (
              <section aria-label="Points raised by checks">
                <h3 className="font-semibold">Points raised ({open} to decide)</h3>
                <ul className="mt-2 grid gap-2">
                  {flags.map((f) => (
                    <li key={f.id} className="rounded-lg border border-line p-3" data-flag={f.code}>
                      <p className="text-sm"><strong>{SEV[f.severity]}</strong> · {f.system_id === "course-draft-ai" ? "AI suggestion" : "Rule"} · {f.message}{f.evidence ? <> · <q>{f.evidence}</q></> : null}</p>
                      {f.status === "open" ? (
                        <div className="mt-2 max-w-md"><JsonForm compact url={`/api/ops/flags/${f.id}`} submit="Record decision" done="Recorded" fields={[
                          { name: "status", label: `Decision on: ${f.code}`, type: "select", options: [["dismissed", "Not an issue"], ["actioned", "Issue: the Fellow must change it"]] },
                          { name: "note", label: "Note the Fellow will read" },
                        ]} /></div>
                      ) : <p className="mt-1 text-sm text-muted">{f.status === "dismissed" ? "Not an issue" : "Issue"}: {f.decision_note}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {x.status === "submitted" && (
              <div className="max-w-md"><JsonForm url={`/api/ops/courses/${x.id}`} submit="Record review" done="Recorded" fields={[
                { name: "decision", label: "Decision", type: "select", options: [["approve", "Approve"], ["changes", "Ask for changes"], ["reject", "Don't approve"]] },
                { name: "note", label: "Note the Fellow will read" },
              ]} /></div>
            )}
            {x.status === "approved" && (
              r.open && share
                ? <div className="max-w-xs"><JsonForm compact url={`/api/ops/courses/${x.id}`} fixed={{ decision: "publish", note: "publish" }} submit="Publish" done="Published" fields={[]} /></div>
                : <p className="text-sm text-muted">Can be published once {!r.open ? "the marketplace is open" : "the Fellow share is set"}.</p>
            )}
          </article>
        );
      })}
    </div></section>
  );
}
