import { fellowContext } from "@/lib/fellows/context";
import { asAccount } from "@/lib/auth/session";
import { JsonForm } from "@/components/app/JsonForm";
import { HelpButtons } from "@/components/fellow/GigActions";

export const metadata = { title: "Support and your rights" };

export default async function Support() {
  const { account, fellow } = await fellowContext("/app/fellow/support");
  const d = await asAccount(account, async (c) => ({
    disputes: (await c.query("SELECT id, subject, details, status, resolution, created_at FROM disputes WHERE raised_by = $1 ORDER BY created_at DESC", [account.id])).rows,
    cases: (await c.query("SELECT id, reasons, child_safety, notice_until, status, (SELECT count(*) FROM removal_responses r WHERE r.case_id = removal_cases.id) AS responses FROM removal_cases WHERE fellow_id = $1 ORDER BY opened_at DESC", [account.id])).rows,
    quality: (await c.query("SELECT q.kind, q.rubric, q.notes, q.created_at FROM quality_reviews q JOIN gig_assignments ga ON ga.id = q.assignment_id WHERE ga.fellow_id = $1 ORDER BY q.created_at DESC LIMIT 10", [account.id])).rows,
  }));
  return (
    <section className="py-10"><div className="wrap grid max-w-4xl gap-6 [&>*]:min-w-0">
      <header><p className="eyebrow">Support and your rights</p><h1 className="display-lg mt-2">Help, disputes and fair process.</h1></header>
      {d.cases.map((k) => (
        <div key={k.id} className="card grid gap-3 border-[#f1b5ae] p-6">
          <h2 className="text-xl font-bold">A case is open about your account</h2>
          <p><strong>Written reasons:</strong> {k.reasons}</p>
          <p className="text-sm text-muted">{k.child_safety ? "Access is suspended while the Safeguarding Lead reviews a child-safety concern." : `Nothing is decided before ${new Date(k.notice_until).toLocaleDateString("en-IN", { dateStyle: "long" })}. Tell us your side below; it goes into the enquiry.`} Status: {k.status}.</p>
          {k.status === "notice" && <JsonForm url={`/api/fellow/cases/${k.id}/respond`} fields={[{ name: "body", label: "Your response", type: "textarea" }]} submit="Send my response" done="Response recorded" />}
        </div>
      ))}
      <div className="card p-6"><h2 className="text-xl font-bold">Need help now?</h2><p className="mb-3 mt-1 text-sm text-muted">Point of contact: {fellow.point_of_contact ?? "assigned when you go live"}.</p><HelpButtons gigId={null} /></div>
      <div className="card p-6">
        <h2 className="text-xl font-bold">Raise a dispute</h2>
        <p className="mb-3 mt-1 text-sm text-muted">About pay, a gig, your tier, a removal or anything else. It goes to the dispute committee and your point of contact.</p>
        <JsonForm url="/api/fellow/disputes" done="Dispute raised. You'll see updates here." submit="Raise dispute" fields={[
          { name: "subject", label: "About", type: "select", options: [["pay", "Pay"], ["gig", "A gig"], ["tier", "My tier"], ["removal", "A removal case"], ["other", "Something else"]] },
          { name: "details", label: "What happened", type: "textarea" },
        ]} />
        {d.disputes.length > 0 && <ul className="mt-4 grid gap-2">{d.disputes.map((x) => <li key={x.id} className="rounded-xl bg-panel p-3 text-sm"><strong>{x.subject}</strong> · {x.status} · {new Date(x.created_at).toLocaleDateString("en-IN")}{x.resolution && <span className="block">Resolution: {x.resolution}</span>}</li>)}</ul>}
      </div>
      {d.quality.length > 0 && <div className="card p-6"><h2 className="text-xl font-bold">Session reviews</h2><p className="mt-1 text-sm text-muted">Scored on a published rubric. Any action is decided by a person.</p><ul className="mt-3 grid gap-2 text-sm">{d.quality.map((q, i) => <li key={i}>{new Date(q.created_at).toLocaleDateString("en-IN")} · {q.kind} · {Object.entries(q.rubric).map(([k, v]) => `${k} ${v}/4`).join(", ")}{q.notes ? ` · ${q.notes}` : ""}</li>)}</ul></div>}
      <div className="card p-6 text-sm">
        <h2 className="text-xl font-bold">Your rights, in short</h2>
        <ul className="mt-3 list-disc pl-5 text-muted">
          <li>Decline any gig, no penalty.</li><li>14 days&apos; notice before any change to terms, rates or automated systems.</li>
          <li>Removal only after written reasons, an enquiry and 7 days&apos; notice, except where a child&apos;s safety needs immediate action.</li>
          <li>A person decides every penalty. AI may only flag.</li><li>Plain terms in English, Telugu and Hindi: <a className="underline" href="/app/fellow/terms">read them</a>.</li>
        </ul>
      </div>
    </div></section>
  );
}
