import Link from "next/link";
import { schoolContext, ist, WORLD_LABEL } from "@/lib/schools/context";
import { weekSessions, istDate } from "@/lib/schools/core";

export const metadata = { title: "Trainer home" };

export default async function TrainerHome() {
  const { staff, account } = await schoolContext("/app/trainer");
  const week = await weekSessions(staff.schoolId, { trainerId: account.id });
  const today = istDate(new Date());
  const now = Date.now();
  const toRecord = week.filter((s) => s.status === "planned" && new Date(s.starts_at).getTime() <= now + 15 * 60_000);

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <p className="eyebrow">{staff.schoolName}</p>
          <h1 className="display-lg mt-2">Hello {staff.displayName.split(" ")[0]}.</h1>
          <p className="mt-2 text-muted">{toRecord.length ? `${toRecord.length} class${toRecord.length > 1 ? "es" : ""} waiting for attendance.` : "Attendance is up to date."}</p>
        </header>

        <section aria-labelledby="week-h">
          <h2 id="week-h" className="text-xl font-bold">Your week</h2>
          {week.length === 0 && <p className="mt-2 text-muted">No classes assigned to you yet. Your school admin sets the timetable.</p>}
          <ul className="mt-3 grid gap-3">
            {week.map((s) => {
              const isToday = istDate(new Date(s.starts_at)) === today;
              return (
                <li key={s.id} className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${isToday ? "border-heading" : ""}`}>
                  <span>
                    {isToday && <strong className="mr-2 text-heading">Today</strong>}
                    {ist(s.starts_at)} · <strong className="text-heading">{s.label}</strong> · {WORLD_LABEL[s.world]} · {s.lab}
                    <span className="block text-sm text-muted">{s.status === "held" ? `Recorded · ${s.present} of ${s.total} present` : s.status === "cancelled" ? "Marked not held" : `${s.students} students · ${s.duration_min} min`}</span>
                  </span>
                  <Link className="btn btn-ghost !min-h-10 text-sm" href={`/app/trainer/sessions/${s.id}`}>{s.status === "planned" ? "Open class" : "View"}<span className="sr-only">: {s.label}, {ist(s.starts_at)}</span></Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/app/school/tickets" className="card p-5 hover:border-heading"><h2 className="text-lg font-bold">Kit or hardware problem?</h2><p className="mt-1 text-muted">Raise a ticket. The replacement clock starts at once.</p></Link>
          <Link href="/app/school/fellows" className="card p-5 hover:border-heading"><h2 className="text-lg font-bold">Fellow mentoring</h2><p className="mt-1 text-muted">Observe Kalam Fellows who teach at your school and score the session.</p></Link>
        </div>
      </div>
    </section>
  );
}
