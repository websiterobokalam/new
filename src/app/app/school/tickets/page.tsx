import { schoolContext, ist, CATEGORY_LABEL, STATUS_LABEL } from "@/lib/schools/context";
import { tickets } from "@/lib/schools/core";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";
import { TicketClock } from "@/components/school/TicketClock";

export const metadata = { title: "Hardware tickets" };

export default async function SchoolTickets() {
  const { staff } = await schoolContext("/app/school/tickets");
  const [list, d] = await Promise.all([
    tickets(staff.schoolId),
    system(async (c) => ({
      labs: (await c.query("SELECT id, name FROM labs WHERE school_id = $1 ORDER BY name", [staff.schoolId])).rows,
      assets: (await c.query("SELECT a.id, a.label, l.name AS lab FROM lab_assets a JOIN labs l ON l.id = a.lab_id WHERE l.school_id = $1 AND a.status <> 'retired' ORDER BY l.name, a.label", [staff.schoolId])).rows,
    })),
  ]);

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <h1 className="display-lg">Hardware tickets</h1>
          <p className="mt-2 max-w-2xl text-muted">Something broken or missing in the lab? Raise a ticket. The clock starts when you raise it: your contract says {staff.slaHours} hours to replace or fix. It never resets, even if a fix doesn&apos;t hold.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <section className="card p-6" aria-labelledby="raise-h">
            <h2 id="raise-h" className="mb-4 text-xl font-bold">Raise a ticket</h2>
            {d.labs.length === 0 ? <p className="text-muted">No lab installed yet.</p> : (
              <JsonForm url="/api/school/tickets" submit="Raise ticket" done="Ticket raised. The clock has started." fields={[
                { name: "labId", label: "Lab", type: "select", options: d.labs.map((l): [string, string] => [l.id, l.name]) },
                { name: "category", label: "What kind of problem", type: "select", options: Object.entries(CATEGORY_LABEL) },
                { name: "assetId", label: "Which item (optional)", type: "select", optional: true, options: [["", "Not sure / not listed"], ...d.assets.map((a): [string, string] => [a.id, `${a.label} · ${a.lab}`])] },
                { name: "summary", label: "What's wrong, in a few words" },
                { name: "details", label: "Anything else that helps", type: "textarea", optional: true },
              ]} />
            )}
          </section>

          <section aria-labelledby="list-h">
            <h2 id="list-h" className="text-xl font-bold">All tickets</h2>
            {list.length === 0 && <p className="mt-2 text-muted">No tickets yet.</p>}
            <ul className="mt-3 grid gap-3">
              {list.map((t) => (
                <li key={t.id} className="card grid gap-2 p-5" data-ticket={t.ref}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-heading"><span className="font-mono">{t.ref}</span> · {t.summary}</p>
                    <TicketClock t={t} />
                  </div>
                  <p className="text-sm text-muted">{CATEGORY_LABEL[t.category]} · {t.lab}{t.asset ? ` · ${t.asset}` : ""} · raised {ist(t.raised_at)}{t.raised_by_name ? ` by ${t.raised_by_name}` : ""} · due {ist(t.due_at)}</p>
                  <p className="text-sm"><strong>{STATUS_LABEL[t.status]}</strong>{t.resolution ? ` · ${t.resolution}` : ""}</p>
                  {t.status === "resolved" && (
                    <div className="max-w-md">
                      <JsonForm compact url={`/api/school/tickets/${t.id}/confirm`} submit="Send" done="Thanks, recorded" fields={[
                        { name: "fixed", label: "Is it working now?", type: "select", options: [["yes", "Yes, close the ticket"], ["no", "No, still broken"]] },
                        { name: "note", label: "If not, what's still wrong", optional: true },
                      ]} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
