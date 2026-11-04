import Link from "next/link";
import { schoolContext, ist, WORLD_LABEL, WORLD_OPTIONS } from "@/lib/schools/context";
import { schoolFellowSessions, REQUEST_LEAD_HOURS } from "@/lib/schools/core";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Kalamites" };

const STATUS: Record<string, string> = { requested: "Waiting for Robokalam", scheduled: "Scheduled, finding a Kalamite", declined: "Not possible", cancelled: "Cancelled" };
const score = (n: string) => ({ name: n, label: n[0].toUpperCase() + n.slice(1), type: "select" as const, defaultValue: "3", options: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] as [string, string][] });

export default async function SchoolFellows() {
  const { staff } = await schoolContext("/app/school/fellows");
  const admin = staff.role === "school_admin";
  const [list, d] = await Promise.all([
    schoolFellowSessions(staff.schoolId),
    system(async (c) => ({
      labs: (await c.query("SELECT id, name FROM labs WHERE school_id = $1 ORDER BY name", [staff.schoolId])).rows,
      people: (await c.query("SELECT account_id, display_name FROM school_staff WHERE school_id = $1 AND removed_at IS NULL ORDER BY display_name", [staff.schoolId])).rows,
      observed: new Set((await c.query("SELECT assignment_id FROM quality_reviews WHERE reviewer_account_id = $1", [staff.accountId])).rows.map((r) => r.assignment_id)),
    })),
  ]);

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <h1 className="display-lg">Kalamites at your school</h1>
          <p className="mt-2 max-w-2xl text-muted">Book a vetted college student to run a Campus Session in your lab. A member of your staff stays in the room for the whole session. Kalamites never get students&apos; names or contact details, and all contact goes through Robokalam.</p>
        </header>

        <div className={`grid gap-6 ${admin ? "lg:grid-cols-[1fr_1.3fr]" : ""}`}>
          {admin && (
            <section className="card p-6" aria-labelledby="book-h">
              <h2 id="book-h" className="mb-1 text-xl font-bold">Book a Kalamite</h2>
              <p className="mb-4 text-sm text-muted">At least {REQUEST_LEAD_HOURS} hours ahead. Robokalam confirms and finds a Kalamite.</p>
              {d.labs.length === 0 ? <p className="text-muted">No lab installed yet.</p> : (
                <JsonForm url="/api/school/fellow-requests" submit="Send request" done="Request sent" fields={[
                  { name: "startsAt", label: "Date and time", type: "datetime" },
                  { name: "durationMin", label: "Minutes", type: "number", defaultValue: 60 },
                  { name: "labId", label: "Lab", type: "select", options: d.labs.map((l): [string, string] => [l.id, l.name]) },
                  { name: "world", label: "World", type: "select", options: WORLD_OPTIONS },
                  { name: "language", label: "Teaching language", type: "select", options: [["en", "English"], ["te", "Telugu"], ["hi", "Hindi"]] },
                  { name: "gradeBand", label: "Grades", hint: "For example Grade 6 to 7" },
                  { name: "students", label: "How many students", type: "number", defaultValue: 30 },
                  { name: "responsibleStaffId", label: "Staff member in the room", type: "select", options: [["", "Choose"], ...d.people.map((p): [string, string] => [p.account_id, p.display_name])] },
                  { name: "notes", label: "What should students build?", type: "textarea", optional: true },
                ]} />
              )}
            </section>
          )}

          <section aria-labelledby="list-h">
            <h2 id="list-h" className="text-xl font-bold">Sessions</h2>
            {list.length === 0 && <p className="mt-2 text-muted">None yet.</p>}
            <ul className="mt-3 grid gap-3">
              {list.map((f) => {
                const delivered = f.assignment_status === "delivered";
                return (
                  <li key={f.id} className="card grid gap-2 p-5">
                    <p className="font-semibold text-heading">{ist(f.starts_at)} · {f.duration_min} min · {WORLD_LABEL[f.world]} · {f.grade_band}</p>
                    <p className="text-sm text-muted">{f.lab} · {f.students} students · in the room: {f.responsible}</p>
                    <p className="text-sm">
                      <strong>{delivered ? "Delivered" : f.fellow ? "Confirmed" : STATUS[f.status]}</strong>
                      {f.fellow && <> · Kalamite: <Link className="font-semibold text-link underline" href={`/educators/${f.fellow_id}`}>{f.fellow}</Link></>}
                      {f.decision_note && ` · ${f.decision_note}`}
                    </p>
                    {admin && f.status === "requested" && (
                      <div className="max-w-xs"><JsonForm compact url={`/api/school/fellow-requests/${f.id}/cancel`} submit="Cancel request" done="Cancelled" fields={[]} /></div>
                    )}
                    {!admin && delivered && f.assignment_id && !d.observed.has(f.assignment_id) && (
                      <details>
                        <summary className="cursor-pointer text-sm font-semibold text-link">Record your observation (1 = needs work, 4 = excellent)</summary>
                        <div className="mt-2 max-w-md">
                          <JsonForm compact url="/api/ops/quality" fixed={{ assignmentId: f.assignment_id, kind: "observation" }} submit="Save observation" done="Saved. Thank you for mentoring." fields={[
                            ...["prep", "clarity", "engagement", "safety", "outcome"].map(score),
                            { name: "notes", label: "One thing they did well, one to work on", optional: true },
                          ]} />
                        </div>
                      </details>
                    )}
                    {!admin && delivered && f.assignment_id && d.observed.has(f.assignment_id) && <p className="text-sm text-muted">You recorded an observation.</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
