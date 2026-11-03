import Link from "next/link";
import { schoolContext, ist, WORLD_LABEL, WORLD_OPTIONS } from "@/lib/schools/context";
import { weekSessions } from "@/lib/schools/core";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Timetable" };
const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function Timetable() {
  const { staff } = await schoolContext("/app/school/timetable", "school_admin");
  const [d, week] = await Promise.all([
    system(async (c) => ({
      labs: (await c.query("SELECT id, name FROM labs WHERE school_id = $1 ORDER BY name", [staff.schoolId])).rows,
      people: (await c.query("SELECT account_id, display_name, role FROM school_staff WHERE school_id = $1 AND removed_at IS NULL ORDER BY display_name", [staff.schoolId])).rows,
      classes: (await c.query(
        `SELECT k.*, l.name AS lab, st.display_name AS trainer FROM school_classes k JOIN labs l ON l.id = k.lab_id LEFT JOIN school_staff st ON st.account_id = k.trainer_account_id
         WHERE k.school_id = $1 AND k.active ORDER BY k.weekday, k.start_time`, [staff.schoolId])).rows,
    })),
    weekSessions(staff.schoolId),
  ]);
  const people: [string, string][] = d.people.map((p) => [p.account_id, `${p.display_name}${p.role === "school_admin" ? " (admin)" : ""}`]);

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header><h1 className="display-lg">Timetable</h1><p className="mt-2 text-muted">Weekly lab classes and who teaches them. Times are India time.</p></header>

        <section className="card p-6" aria-labelledby="week-h">
          <h2 id="week-h" className="text-xl font-bold">This week</h2>
          {week.length === 0 ? <p className="mt-2 text-muted">No classes on the timetable yet.</p> : (
            <ul className="mt-3 grid gap-2">
              {week.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2">
                  <span>{ist(s.starts_at)} · {s.label} · {WORLD_LABEL[s.world]} · {s.lab} · {s.trainer ?? <strong className="text-[#8a1c13] dark:text-[#ff8a80]">No trainer</strong>}</span>
                  <span className="text-sm text-muted">{s.status === "held" ? `Held · ${s.present} of ${s.total} present` : s.status === "cancelled" ? "Not held" : new Date(s.starts_at) < new Date() ? "Not recorded" : "Planned"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="classes-h">
          <h2 id="classes-h" className="text-xl font-bold">Classes</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {d.classes.map((k) => (
              <li key={k.id} className="card grid gap-3 p-5">
                <p className="font-semibold text-heading">{k.label} · Grade {k.grade} · {WORLD_LABEL[k.world]}</p>
                <p className="text-sm text-muted">{DAYS[k.weekday]} {String(k.start_time).slice(0, 5)} · {k.duration_min} min · {k.lab} · {k.students} students{k.erp_class_ref ? " · linked to 21cschool" : ""}</p>
                <JsonForm compact url="/api/school/classes/assign" fixed={{ classId: k.id }} submit="Save trainer" done="Trainer saved" fields={[
                  { name: "trainerId", label: "Trainer", type: "select", defaultValue: k.trainer_account_id ?? "", options: [["", "No trainer yet"], ...people] },
                ]} />
              </li>
            ))}
          </ul>
        </section>

        <section className="card max-w-2xl p-6" aria-labelledby="add-h">
          <h2 id="add-h" className="mb-4 text-xl font-bold">Add a class</h2>
          {d.labs.length === 0 ? <p className="text-muted">You need a lab first. Robokalam adds it when it is installed.</p> : (
            <JsonForm url="/api/school/classes" submit="Add class" done="Class added" fields={[
              { name: "label", label: "Class name", hint: "For example Grade 6 B" },
              { name: "grade", label: "Grade", type: "number", defaultValue: 6 },
              { name: "world", label: "World", type: "select", options: WORLD_OPTIONS },
              { name: "labId", label: "Lab", type: "select", options: d.labs.map((l): [string, string] => [l.id, l.name]) },
              { name: "weekday", label: "Day", type: "select", options: DAYS.slice(1).map((n, i): [string, string] => [String(i + 1), n]) },
              { name: "startTime", label: "Start time (24-hour, HH:MM)", defaultValue: "10:00" },
              { name: "durationMin", label: "Minutes", type: "number", defaultValue: 45 },
              { name: "students", label: "Students in the class", type: "number", defaultValue: 30 },
              { name: "trainerId", label: "Trainer", type: "select", optional: true, options: [["", "Decide later"], ...people] },
              { name: "erpClassRef", label: "21cschool class ID (optional)", optional: true, hint: "Links the live roster for attendance" },
            ]} />
          )}
        </section>
        <p><Link className="font-semibold text-link underline" href="/app/school/staff">Add trainers to your staff list</Link></p>
      </div>
    </section>
  );
}
