import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { inr } from "@/lib/money";
import { PILOT } from "@/lib/fellows/core";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Gigs" };

export default async function OpsGigs() {
  const { account } = await appContext("/app/ops/gigs");
  if (account.role !== "ops") notFound();
  const d = await system(async (c) => ({
    gigs: (await c.query(`SELECT g.*, (SELECT GROUP_CONCAT(CONCAT(f.display_name, ' (', ga.status, ')') SEPARATOR ', ') FROM gig_assignments ga JOIN fellows f ON f.account_id = ga.fellow_id WHERE ga.gig_id = g.id AND ga.status <> 'declined') AS who,
      (SELECT ga.id FROM gig_assignments ga WHERE ga.gig_id = g.id AND ga.status = 'delivered' LIMIT 1) AS delivered_assignment
      FROM gigs g ORDER BY g.starts_at DESC LIMIT 100`)).rows,
    batches: (await c.query("SELECT b.id, c.title, b.starts_at FROM batches b JOIN courses c ON c.id = b.course_id WHERE b.starts_at > now() AND b.educator_fellow_id IS NULL ORDER BY b.starts_at LIMIT 50")).rows,
    rates: (await c.query("SELECT gig_kind, per_session_paise, minutes, approved, sample FROM rate_card ORDER BY gig_kind")).rows,
  }));
  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <header><h1 className="display-lg">Gigs</h1><p className="text-muted">Demand comes from partner schools, camps, Code Week and Free Build Sessions. Pay always comes from the rate card.</p></header>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6"><h2 className="mb-4 text-xl font-bold">Post a gig</h2>
          <JsonForm url="/api/ops/gigs" submit="Post gig" done="Gig posted" fixed={{}} fields={[
            { name: "kind", label: "Type", type: "select", options: [["live_batch", "Live Batch"], ["campus_session", "Campus Session"], ["weekend_workshop", "Weekend Workshop"], ["doubt_desk", "Doubt Desk"], ["project_mentor", "Project Mentor"], ["build_session", "Free Build Session"], ["shadow", "Shadow (onboarding)"], ["co_teach", "Co-teach (onboarding)"]] },
            { name: "title", label: "Title" },
            { name: "world", label: "World", type: "select", options: [["robotics", "Robotics"], ["iot", "IoT"], ["ai", "AI"], ["coding", "Coding"], ["finlit", "Financial Literacy"], ["space", "Space"]] },
            { name: "language", label: "Language", type: "select", options: [["en", "English"], ["te", "Telugu"], ["hi", "Hindi"]] },
            { name: "startsAt", label: "Starts", type: "datetime" },
            { name: "durationMin", label: "Minutes", type: "number", defaultValue: 60 },
            { name: "mode", label: "Mode", type: "select", options: [["online", "Online"], ["offline", "In person"]] },
            { name: "city", label: "City", defaultValue: PILOT.city },
            { name: "location", label: "Partner school or centre (in person only)", optional: true },
            { name: "responsibleAdult", label: "Responsible adult present (in person only)", optional: true },
            { name: "batchId", label: "Linked class", type: "select", optional: true, options: [["", "None"], ...d.batches.map((b): [string, string] => [b.id, `${b.title} · ${new Date(b.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`])] },
            { name: "lessonPlan", label: "Lesson plan", type: "textarea", optional: true },
            { name: "kitList", label: "Kit list", optional: true },
          ]} />
        </div>
        <div className="card p-6"><h2 className="text-xl font-bold">Rate card</h2>
          <ul className="mt-3 grid gap-1 text-sm">{d.rates.map((r) => <li key={r.gig_kind} className="flex justify-between"><span>{r.gig_kind}</span><span>{inr(r.per_session_paise)} / {r.minutes} min · {r.approved ? "approved" : r.sample ? "SAMPLE" : "not approved"}</span></li>)}</ul>
          {d.rates.length === 0 && <p className="mt-2 text-muted">No rates. Gigs cannot be posted until the rate card is approved.</p>}
        </div>
      </div>
      <ul className="grid gap-3">
        {d.gigs.map((g) => (
          <li key={g.id} className="card grid gap-2 p-4">
            <p className="font-semibold">{g.title} · {g.kind} · {new Date(g.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {inr(g.pay_paise)} · {g.status}</p>
            <p className="text-sm text-muted">{g.who ?? "No one yet"}</p>
            {g.delivered_assignment && (
              <details><summary className="cursor-pointer text-sm font-semibold text-link">Quality review (1 = needs work, 4 = excellent)</summary>
                <div className="mt-2 max-w-md"><JsonForm compact url="/api/ops/quality" fixed={{ assignmentId: g.delivered_assignment }} submit="Save review" fields={[
                  { name: "kind", label: "Source", type: "select", options: [["observation", "Live observation"], ["recording_sample", "Recording sample"]] },
                  ...["prep", "clarity", "engagement", "safety", "outcome"].map((k) => ({ name: k, label: k, type: "select" as const, defaultValue: "3", options: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] as [string, string][] })),
                  { name: "notes", label: "Notes", optional: true },
                ]} /></div>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div></section>
  );
}
