import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { inr } from "@/lib/money";
import { StaffButton, SessionRecord } from "@/components/app/StaffActions";

export const metadata = { title: "Ops" };

/** Minimal Phase 2 ops queue: refund decisions and session records. Full console arrives with Phase 3/4. */
export default async function Ops() {
  const { account } = await appContext("/app/ops");
  if (account.role !== "ops") notFound();
  const d = await system(async (c) => ({
    refunds: (await c.query("SELECT r.id, r.amount_paise, r.reason, r.decision, r.created_at, o.invoice_no FROM refund_requests r JOIN orders o ON o.id = r.order_id WHERE r.status = 'requested' ORDER BY r.created_at")).rows,
    sessions: (await c.query("SELECT bk.id, l.first_name, l.age_band, co.title, b.starts_at FROM bookings bk JOIN learners l ON l.id = bk.learner_id JOIN batches b ON b.id = bk.batch_id JOIN courses co ON co.id = b.course_id WHERE bk.status = 'confirmed' AND b.starts_at < now() + INTERVAL 1 DAY ORDER BY b.starts_at LIMIT 50")).rows,
    projects: (await c.query("SELECT id, title FROM projects ORDER BY world, level")).rows,
  }));
  return (
    <section className="py-10">
      <div className="wrap grid gap-8">
        <h1 className="display-lg">Ops</h1>
        <section>
          <h2 className="display-md">Refund requests ({d.refunds.length})</h2>
          <ul className="mt-4 grid gap-3">
            {d.refunds.map((r) => (
              <li key={r.id} className="card grid gap-2 p-4">
                <p className="font-semibold">{r.invoice_no} · {inr(r.amount_paise)} · {new Date(r.created_at).toLocaleString("en-IN")}</p>
                <p className="text-sm">Parent says: {r.reason}</p>
                <p className="text-sm text-muted">Policy: {r.decision.explanation}</p>
                <div className="flex gap-2"><StaffButton url={`/api/ops/refunds/${r.id}`} data={{ decision: "approve" }} label="Approve and pay" /><StaffButton url={`/api/ops/refunds/${r.id}`} data={{ decision: "reject" }} label="Reject" tone="ghost" /></div>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="display-md">Sessions to record ({d.sessions.length})</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {d.sessions.map((s) => (
              <li key={s.id} className="card grid gap-2 p-4">
                <p className="font-semibold">{s.title} · {s.first_name} ({s.age_band}) · {new Date(s.starts_at).toLocaleString("en-IN")}</p>
                <SessionRecord bookingId={s.id} projects={d.projects} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
