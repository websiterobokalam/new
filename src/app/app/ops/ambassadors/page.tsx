import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Campus Ambassadors" };
const ist = (x: Date) => new Date(x).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function OpsAmbassadors() {
  const { account } = await appContext("/app/ops/ambassadors");
  if (account.role !== "ops") notFound();
  const d = await system(async (c) => ({
    list: (await c.query(
      `SELECT am.*, f.display_name, co.name AS college, (SELECT COUNT(*) FROM fellows x WHERE x.referred_by = am.code) AS referred,
              (SELECT COUNT(*) FROM fellows x WHERE x.referred_by = am.code AND x.status = 'live') AS live
       FROM ambassadors am JOIN fellows f ON f.account_id = am.fellow_id JOIN colleges co ON co.id = am.college_id ORDER BY am.status = 'applied' DESC, am.created_at`)).rows,
    events: (await c.query("SELECT e.*, f.display_name FROM ambassador_events e JOIN fellows f ON f.account_id = e.fellow_id WHERE e.status = 'proposed' ORDER BY e.planned_at")).rows,
  }));

  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <header><h1 className="display-lg">Campus Ambassadors</h1><p className="mt-2 max-w-3xl text-muted">Approving an ambassador needs the marketplace open. Pausing or ending is always possible. Ambassadors recruit Kalamites only.</p></header>
      <ul className="grid gap-3">
        {d.list.map((a) => (
          <li key={a.fellow_id} className="card grid gap-2 p-5" data-ambassador={a.display_name}>
            <p><strong className="text-heading">{a.display_name}</strong> · {a.college} · {a.status} · code {a.code} · {a.referred} referred, {a.live} live</p>
            <p className="text-sm text-muted">{a.pitch}</p>
            <div className="max-w-md"><JsonForm compact url={`/api/ops/ambassadors/${a.fellow_id}`} submit="Record decision" done="Recorded" fields={[
              { name: "to", label: `Decision for ${a.display_name}`, type: "select", options: a.status === "active" ? [["paused", "Pause"], ["ended", "End"]] : [["active", "Approve"], ["declined", "Decline"]] },
              { name: "note", label: "Note the Kalamite will read" },
            ]} /></div>
          </li>
        ))}
      </ul>
      {d.list.length === 0 && <p className="text-muted">No applications yet.</p>}
      <section aria-labelledby="ev-h">
        <h2 id="ev-h" className="text-xl font-bold">Info sessions to approve</h2>
        {d.events.length === 0 && <p className="mt-2 text-muted">None.</p>}
        <ul className="mt-3 grid gap-3">
          {d.events.map((e) => (
            <li key={e.id} className="card grid gap-2 p-5">
              <p><strong className="text-heading">{e.title}</strong> · {e.display_name} · {ist(e.planned_at)} · {e.venue}</p>
              <div className="max-w-md"><JsonForm compact url={`/api/ops/ambassadors/events/${e.id}`} submit="Record decision" done="Recorded" fields={[
                { name: "to", label: "Decision", type: "select", options: [["approved", "Approve"], ["declined", "Decline"]] },
                { name: "note", label: "Note (optional)", optional: true },
              ]} /></div>
            </li>
          ))}
        </ul>
      </section>
    </div></section>
  );
}
