import Link from "next/link";
import { fellowContext } from "@/lib/fellows/context";
import { system } from "@/lib/db";
import { authorChecks, fellowSharePct, AUTHOR_RULES } from "@/lib/market/courses";
import { inr } from "@/lib/money";
import { JsonForm, type FieldDef } from "@/components/app/JsonForm";
import { AutomatedNotices } from "@/components/fellow/AutomatedNotices";

export const metadata = { title: "Your own course" };

const STATUS: Record<string, string> = {
  draft: "Draft, only you can see it", submitted: "With a Robokalam reviewer", changes: "Changes asked: see the note", approved: "Approved, waiting for the marketplace to open",
  rejected: "Not approved: see the note", published: "Published: families can book", withdrawn: "Withdrawn",
};
const WORLDS: [string, string][] = [["robotics", "Robotics"], ["iot", "IoT"], ["ai", "AI"], ["coding", "Coding"], ["finlit", "Financial Literacy"], ["space", "Space"]];

function draftFields(d?: Record<string, any>): FieldDef[] {
  const syl = d ? (d.syllabus as { title: string; build: string }[]).map((s) => `${s.title} | ${s.build}`).join("\n") : "";
  return [
    { name: "title", label: "Course title", defaultValue: d?.title },
    { name: "world", label: "World", type: "select", options: WORLDS, defaultValue: d?.world },
    { name: "ageMin", label: "Youngest age", type: "number", defaultValue: d?.age_min ?? 9 },
    { name: "ageMax", label: "Oldest age", type: "number", defaultValue: d?.age_max ?? 12 },
    { name: "outcome", label: "What every learner will have built by the end", type: "textarea", defaultValue: d?.outcome },
    { name: "sessions", label: "Number of weekly sessions (60 minutes each)", type: "number", defaultValue: d?.sessions ?? 4 },
    { name: "batchSizeMax", label: "Group size, 2 to 8 learners", type: "number", defaultValue: d?.batch_size_max ?? 6 },
    { name: "kit", label: "Kit learners need (optional)", optional: true, defaultValue: d?.kit ?? "" },
    { name: "feeRupees", label: "Proposed fee for the whole course, in rupees (GST included)", type: "number", defaultValue: d ? d.fee_paise / 100 : 2000 },
    { name: "syllabus", label: "Syllabus: one line per session, as Session title | What they build", type: "textarea", defaultValue: syl, hint: "Example: Blink | An LED that blinks to a pattern" },
  ];
}

export default async function FellowCourses() {
  const { account } = await fellowContext("/app/fellow/courses");
  const share = fellowSharePct();
  const d = await system(async (c) => ({
    elig: await authorChecks(c, account.id),
    drafts: (await c.query("SELECT * FROM course_drafts WHERE fellow_id = $1 AND status <> 'withdrawn' ORDER BY updated_at DESC", [account.id])).rows,
    flags: (await c.query("SELECT subject_id, code, severity, message, status, decision_note FROM quality_flags WHERE subject_type = 'course_draft' AND fellow_id = $1 ORDER BY created_at", [account.id])).rows,
  }));

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <p className="eyebrow">Fellow&apos;s Own Course</p>
          <h1 className="display-lg mt-2">Teach your own course</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Online, in groups of 2 to 8. A Robokalam reviewer reads every course before any family can book it.{" "}
            {share ? `You keep ${share}% of the fees, paid as each session is delivered.` : "Your share of the fees is set in the Fellow terms before courses go public; we give 14 days' notice."}
          </p>
        </header>

        <section className="card p-6" aria-labelledby="elig-h">
          <h2 id="elig-h" className="text-xl font-bold">Who can write a course</h2>
          <p className="mt-1 text-sm text-muted">The same bar for everyone. A person can explain any of it.</p>
          <ul className="mt-3 grid gap-2">
            {d.elig.checks.map((k) => (
              <li key={k.label} className="flex flex-wrap justify-between gap-2 border-t border-line pt-2">
                <span><strong className={k.ok ? "text-heading" : "text-[#8a1c13] dark:text-[#ff8a80]"}>{k.ok ? "Yes" : "Not yet"}</strong> · {k.label}</span>
                <span className="text-sm text-muted">{k.detail}</span>
              </li>
            ))}
          </ul>
          {!d.elig.ok && <p className="mt-3 text-sm">You can start a draft now and submit it once every line says yes. Minimum: {AUTHOR_RULES.minSessions} delivered sessions.</p>}
        </section>

        <AutomatedNotices ids={["course-draft-rules", "course-draft-ai"]} />

        {d.drafts.map((x) => {
          const flags = d.flags.filter((f) => f.subject_id === x.id);
          return (
            <section key={x.id} className="card grid gap-3 p-6" aria-label={x.title} data-draft={x.title}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold">{x.title}</h2>
                <span className="rounded-full bg-panel px-3 py-1 text-sm font-semibold text-heading">{STATUS[x.status]}</span>
              </div>
              <p className="text-sm text-muted">Ages {x.age_min} to {x.age_max} · {x.sessions} sessions · up to {x.batch_size_max} learners · {inr(x.fee_paise)}</p>
              {x.review_note && <p><strong>Reviewer&apos;s note:</strong> {x.review_note}</p>}
              {flags.length > 0 && (
                <div>
                  <h3 className="font-semibold">Points the checks raised</h3>
                  <ul className="mt-1 grid gap-1 text-sm">
                    {flags.map((f) => <li key={f.code}>{f.message} <span className="text-muted">({f.status === "open" ? "a person will look at this" : f.status === "dismissed" ? `cleared: ${f.decision_note}` : `reviewer: ${f.decision_note}`})</span></li>)}
                  </ul>
                </div>
              )}
              {(x.status === "draft" || x.status === "changes") && (
                <>
                  <details>
                    <summary className="cursor-pointer font-semibold text-link">Edit this draft</summary>
                    <div className="mt-3 max-w-2xl"><JsonForm url={`/api/fellow/courses/${x.id}`} submit="Save draft" done="Saved" fields={draftFields(x)} /></div>
                  </details>
                  <div className="flex flex-wrap gap-3">
                    <JsonForm compact url={`/api/fellow/courses/${x.id}`} fixed={{ action: "submit" }} submit="Submit for review" done="Submitted" fields={[]} />
                    <JsonForm compact tone="danger" url={`/api/fellow/courses/${x.id}`} fixed={{ action: "withdraw" }} submit="Withdraw" done="Withdrawn" fields={[]} />
                  </div>
                </>
              )}
              {x.status === "published" && (
                <div className="max-w-md">
                  <h3 className="mb-2 font-semibold">Schedule a run</h3>
                  <JsonForm compact url={`/api/fellow/courses/${x.id}/schedule`} submit="Schedule" done="Scheduled. It's on your calendar and open for booking." fields={[
                    { name: "startsAt", label: "First session", type: "datetime" },
                    { name: "language", label: "Language", type: "select", options: [["en", "English"], ["te", "Telugu"], ["hi", "Hindi"]] },
                  ]} />
                  <p className="mt-2 text-sm text-muted">One session a week. Sessions count toward your weekly cap and can&apos;t fall in Exam Mode.</p>
                </div>
              )}
              {x.course_id && x.status === "published" && <p className="text-sm"><Link className="font-semibold text-link underline" href="/courses">See it in the course list</Link></p>}
            </section>
          );
        })}

        <section className="card max-w-3xl p-6" aria-labelledby="new-h">
          <h2 id="new-h" className="mb-1 text-xl font-bold">Start a new course draft</h2>
          <p className="mb-4 text-sm text-muted">Money basics only for financial literacy (no investing or trading). Safe models only for space (no live propellants). No contact details, no one-to-one sessions, no promises of results.</p>
          <JsonForm url="/api/fellow/courses" submit="Save draft" done="Draft saved" fields={draftFields()} />
        </section>
      </div>
    </section>
  );
}
