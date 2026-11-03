import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { tickets } from "@/lib/schools/core";
import { ist, CATEGORY_LABEL, STATUS_LABEL } from "@/lib/schools/context";
import { JsonForm } from "@/components/app/JsonForm";
import { TicketClock } from "@/components/school/TicketClock";

export const metadata = { title: "Hardware tickets" };

const NEXT: Record<string, [string, string][]> = {
  open: [["acknowledged", "Seen, working on it"], ["dispatched", "Replacement on the way"], ["resolved", "Fixed or replaced"]],
  acknowledged: [["dispatched", "Replacement on the way"], ["resolved", "Fixed or replaced"]],
  dispatched: [["resolved", "Fixed or replaced"]],
};

export default async function OpsTickets() {
  const { account } = await appContext("/app/ops/tickets");
  if (account.role !== "ops") notFound();
  const list = await tickets(null, { open: true });
  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <header><h1 className="display-lg">Hardware tickets</h1><p className="mt-2 text-muted">Ordered by due time. The clock is set by each school&apos;s contract when the ticket is raised and can&apos;t be changed. The school confirms each fix.</p></header>
      {list.length === 0 && <p className="text-muted">Nothing open.</p>}
      <ul className="grid gap-3">
        {list.map((t) => (
          <li key={t.id} className="card grid gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-heading"><span className="font-mono">{t.ref}</span> · {t.school} · {t.summary}</p>
              <TicketClock t={t} />
            </div>
            <p className="text-sm text-muted">{CATEGORY_LABEL[t.category]} · {t.lab}{t.asset ? ` · ${t.asset}` : ""} · raised {ist(t.raised_at)} · due {ist(t.due_at)} · {STATUS_LABEL[t.status]}</p>
            {t.details && <p className="text-sm">{t.details}</p>}
            {NEXT[t.status] && (
              <div className="max-w-md">
                <JsonForm compact url={`/api/ops/tickets/${t.id}`} submit="Update" done="Updated" fields={[
                  { name: "to", label: "New status", type: "select", options: NEXT[t.status] },
                  { name: "note", label: "Note for the school (required when fixed)", optional: true },
                ]} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div></section>
  );
}
