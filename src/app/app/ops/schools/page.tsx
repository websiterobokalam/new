import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { DEFAULT_SLA_HOURS } from "@/lib/schools/core";
import { ist, WORLD_LABEL } from "@/lib/schools/context";
import { PILOT } from "@/lib/fellows/core";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Schools" };

export default async function OpsSchools() {
  const { account } = await appContext("/app/ops/schools");
  if (account.role !== "ops") notFound();
  const d = await system(async (c) => ({
    schools: (await c.query(
      `SELECT s.*, (SELECT COUNT(*) FROM school_staff st WHERE st.school_id = s.id AND st.removed_at IS NULL) AS staff,
         (SELECT COUNT(*) FROM hardware_tickets t WHERE t.school_id = s.id AND t.status NOT IN ('resolved','closed')) AS open_tickets
       FROM schools s ORDER BY s.created_at DESC`)).rows,
    labs: (await c.query("SELECT l.id, l.name, l.school_id, (SELECT COUNT(*) FROM lab_assets a WHERE a.lab_id = l.id AND a.status <> 'retired') AS assets FROM labs l ORDER BY l.name")).rows,
    requests: (await c.query(
      `SELECT fr.*, s.name AS school, l.name AS lab, st.display_name AS responsible FROM fellow_requests fr JOIN schools s ON s.id = fr.school_id JOIN labs l ON l.id = fr.lab_id
       JOIN school_staff st ON st.account_id = fr.responsible_staff_id WHERE fr.status = 'requested' ORDER BY fr.starts_at`)).rows,
  }));

  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <header><h1 className="display-lg">Schools</h1><p className="mt-2 text-muted">Partner schools, their labs and equipment, and requests for Kalam Fellows.</p></header>

      <section className="card p-6" aria-labelledby="req-h">
        <h2 id="req-h" className="text-xl font-bold">Fellow requests to schedule</h2>
        {d.requests.length === 0 && <p className="mt-2 text-muted">None waiting.</p>}
        <ul className="mt-3 grid gap-4">
          {d.requests.map((r) => (
            <li key={r.id} className="grid gap-3 border-t border-line pt-3">
              <p><strong className="text-heading">{r.school}</strong> · {ist(r.starts_at)} · {r.duration_min} min · {WORLD_LABEL[r.world]} · {r.grade_band} · {r.students} students · {r.lab} · in the room: {r.responsible}</p>
              {r.notes && <p className="text-sm text-muted">{r.notes}</p>}
              <div className="grid gap-4 md:grid-cols-2">
                <JsonForm compact url={`/api/ops/schools/requests/${r.id}`} fixed={{ action: "schedule" }} submit="Schedule as Campus Session gig" done="Gig posted" fields={[
                  { name: "minTier", label: "Minimum tier", type: "select", options: [["apprentice", "Apprentice"], ["fellow", "Fellow"], ["senior", "Senior"], ["lead", "Lead"]] },
                  { name: "kitList", label: "Kit list", optional: true },
                ]} />
                <JsonForm compact tone="danger" url={`/api/ops/schools/requests/${r.id}`} fixed={{ action: "decline" }} submit="Decline" done="Declined" fields={[
                  { name: "note", label: "Reason the school will see" },
                ]} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="new-h">
          <h2 id="new-h" className="mb-4 text-xl font-bold">Add a partner school</h2>
          <JsonForm url="/api/ops/schools" submit="Add school" done="School added. Their admin can sign in now." fields={[
            { name: "name", label: "School name" },
            { name: "city", label: "City", defaultValue: PILOT.city },
            { name: "board", label: "Board (optional)", optional: true },
            { name: "slaHours", label: "Hardware replacement window in the contract (hours)", type: "number", defaultValue: DEFAULT_SLA_HOURS },
            { name: "aadhyaTenant", label: "AADHYA tenant ID (optional)", optional: true },
            { name: "erpRef", label: "21cschool school ID (optional)", optional: true },
            { name: "adminName", label: "School admin's name" },
            { name: "adminPhone", label: "School admin's mobile number" },
            { name: "adminEmail", label: "School admin's email (optional)", type: "email", optional: true },
          ]} />
        </section>
        <section className="card p-6" aria-labelledby="lab-h">
          <h2 id="lab-h" className="mb-4 text-xl font-bold">Add a lab or equipment</h2>
          {d.schools.length === 0 ? <p className="text-muted">Add a school first.</p> : (
            <div className="grid gap-6">
              <JsonForm url="/api/ops/schools/labs" submit="Add lab" done="Lab added" fields={[
                { name: "schoolId", label: "School", type: "select", options: d.schools.map((s): [string, string] => [s.id, s.name]) },
                { name: "name", label: "Lab name", defaultValue: "21C STEM & AI Lab" },
                { name: "room", label: "Room (optional)", optional: true },
                { name: "installedOn", label: "Installed on (optional)", type: "date", optional: true },
              ]} />
              {d.labs.length > 0 && (
                <JsonForm url="/api/ops/schools/assets" submit="Add equipment" done="Equipment added" fields={[
                  { name: "labId", label: "Lab", type: "select", options: d.labs.map((l): [string, string] => [l.id, `${l.name} · ${d.schools.find((s) => s.id === l.school_id)?.name}`]) },
                  { name: "kind", label: "Kind", type: "select", options: [["kit", "Kit"], ["device", "Laptop or tablet"], ["robot", "Robot"], ["sensor", "Sensor"], ["display", "Display"], ["network", "Network"], ["furniture", "Furniture"], ["other", "Other"]] },
                  { name: "label", label: "Name", hint: "For example ASHAER pack" },
                  { name: "count", label: "How many", type: "number", defaultValue: 1 },
                  { name: "serial", label: "Serial (single item only)", optional: true },
                ]} />
              )}
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="list-h">
        <h2 id="list-h" className="text-xl font-bold">Partner schools</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {d.schools.map((s) => (
            <li key={s.id} className="card p-5">
              <p className="font-semibold text-heading">{s.name} · {s.city}</p>
              <p className="mt-1 text-sm text-muted">{s.staff} staff · {d.labs.filter((l) => l.school_id === s.id).map((l) => `${l.name} (${l.assets} items)`).join(", ") || "No lab yet"} · {s.open_tickets} open tickets · {s.sla_hours}-hour fix window · AADHYA {s.aadhya_tenant ? "linked" : "not linked"} · 21cschool {s.erp_school_ref ? "linked" : "not linked"}</p>
            </li>
          ))}
        </ul>
      </section>
    </div></section>
  );
}
