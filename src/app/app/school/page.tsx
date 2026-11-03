import Link from "next/link";
import { redirect } from "next/navigation";
import { schoolContext, ist } from "@/lib/schools/context";
import { schoolOverview, tickets, schoolFellowSessions } from "@/lib/schools/core";
import { tryIntegration, validate } from "@/lib/integrations";
import { TicketClock } from "@/components/school/TicketClock";

export const metadata = { title: "School home" };

export default async function SchoolHome() {
  const { staff } = await schoolContext("/app/school");
  if (staff.role === "trainer") redirect("/app/trainer");
  const [o, open, fellows, certs] = await Promise.all([
    schoolOverview(staff.schoolId),
    tickets(staff.schoolId, { open: true }),
    schoolFellowSessions(staff.schoolId),
    staff.erpRef ? tryIntegration(() => validate().certificates(staff.erpRef!)) : Promise.resolve({ ok: false as const, reason: "not linked" }),
  ]);
  const upcoming = fellows.filter((f) => f.status !== "declined" && f.status !== "cancelled" && new Date(f.starts_at) > new Date()).slice(0, 4);
  const recorded = o.coverage.held + o.coverage.cancelled;
  const expected = recorded + o.coverage.unrecorded;

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{staff.schoolName} · {staff.city}</p>
            <h1 className="display-lg mt-2">Your labs this month</h1>
          </div>
          <a href="/api/school/audit" className="btn btn-ghost">Download audit report (CSV)</a>
        </header>

        <section aria-labelledby="health-h">
          <h2 id="health-h" className="text-xl font-bold">Lab health</h2>
          {o.labs.length === 0 && <p className="mt-2 text-muted">No labs yet. Robokalam adds your lab when it is installed.</p>}
          <ul className="mt-3 grid gap-4 md:grid-cols-2">
            {o.labs.map((l) => {
              const ok = l.faulty === 0 && l.overdue === 0;
              return (
                <li key={l.id} className="card p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg font-bold">{l.name}{l.room ? <span className="font-normal text-muted"> · {l.room}</span> : null}</h3>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ok ? "bg-leafmist text-navy" : "bg-[#fff1d6] text-[#7a4a00]"}`}>{ok ? "All working" : "Needs attention"}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><dt className="text-muted">Equipment</dt><dd className="text-lg font-semibold text-heading">{l.assets - l.faulty} of {l.assets} working</dd></div>
                    <div><dt className="text-muted">Open tickets</dt><dd className="text-lg font-semibold text-heading">{l.open_tickets}{l.overdue ? ` (${l.overdue} overdue)` : ""}</dd></div>
                    <div><dt className="text-muted">Last class</dt><dd className="text-lg font-semibold text-heading">{l.last_held ? ist(l.last_held, { day: "numeric", month: "short" }) : "None yet"}</dd></div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-muted">Class coverage, last 30 days</h2>
            <p className="mt-1 text-2xl font-bold text-heading">{expected ? `${o.coverage.held} of ${expected} classes held` : "No classes yet"}</p>
            <p className="mt-1 text-sm text-muted">
              {o.coverage.unrecorded ? `${o.coverage.unrecorded} not recorded yet. ` : ""}
              {o.coverage.total ? `Attendance ${Math.round((o.coverage.present / o.coverage.total) * 100)}%. ` : ""}
              {o.coverage.uncovered ? `${o.coverage.uncovered} timetable slot${o.coverage.uncovered > 1 ? "s have" : " has"} no trainer.` : "Every slot has a trainer."}
            </p>
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-muted">Hardware fixes, last 90 days</h2>
            <p className="mt-1 text-2xl font-bold text-heading">{o.sla.resolved ? `${o.sla.met} of ${o.sla.resolved} on time` : "No fixes needed yet"}</p>
            <p className="mt-1 text-sm text-muted">Your contract: replacement within {staff.slaHours} hours of a ticket.</p>
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-muted">Certificates</h2>
            {certs.ok
              ? <><p className="mt-1 text-2xl font-bold text-heading">{certs.data.issued} issued</p><p className="mt-1 text-sm text-muted">{certs.data.pending} waiting for a trainer&apos;s check. Each one can be verified on Validate.</p></>
              : <p className="mt-1 text-muted">Certificates appear here once Validate is connected for your school.</p>}
          </div>
        </div>

        <section className="card p-6" aria-labelledby="tickets-h">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="tickets-h" className="text-xl font-bold">Open hardware tickets</h2>
            <Link href="/app/school/tickets" className="font-semibold text-link underline-offset-4 hover:underline">Raise or view tickets</Link>
          </div>
          {open.length === 0 ? <p className="mt-2 text-muted">Nothing open.</p> : (
            <ul className="mt-3 grid gap-2">
              {open.slice(0, 5).map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2">
                  <span><span className="font-mono text-sm">{t.ref}</span> · {t.summary} · {t.lab}</span>
                  <TicketClock t={t} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6" aria-labelledby="fellows-h">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="fellows-h" className="text-xl font-bold">Kalam Fellow sessions</h2>
            <Link href="/app/school/fellows" className="font-semibold text-link underline-offset-4 hover:underline">Book a Fellow</Link>
          </div>
          {upcoming.length === 0 ? <p className="mt-2 text-muted">None booked.</p> : (
            <ul className="mt-3 grid gap-2">
              {upcoming.map((f) => (
                <li key={f.id} className="border-t border-line pt-2">{ist(f.starts_at)} · {f.grade_band} · {f.fellow ? `with ${f.fellow}` : f.status === "scheduled" ? "finding a Fellow" : "waiting for Robokalam"}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
