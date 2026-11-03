import Link from "next/link";
import { notFound } from "next/navigation";
import { schoolContext, ist, WORLD_LABEL } from "@/lib/schools/context";
import { trainerSession, istDate } from "@/lib/schools/core";
import { aadhya, erp, tryIntegration } from "@/lib/integrations";
import { Attendance } from "@/components/school/Attendance";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Class" };

export default async function TrainerSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { staff, account } = await schoolContext(`/app/trainer/sessions/${id}`);
  const s = await trainerSession(account, id);
  if (!s) notFound();
  const [plan, roster, subs] = await Promise.all([
    staff.aadhyaTenant ? tryIntegration(() => aadhya().lessonPlan(staff.aadhyaTenant!, s.world, s.grade, istDate(new Date(s.starts_at)))) : null,
    staff.erpRef && s.erp_class_ref ? tryIntegration(() => erp().roster(staff.erpRef!, s.erp_class_ref)) : null,
    staff.aadhyaTenant && s.erp_class_ref ? tryIntegration(() => aadhya().submissions(staff.aadhyaTenant!, s.erp_class_ref)) : null,
  ]);
  const started = new Date(s.starts_at).getTime() <= Date.now() + 15 * 60_000;

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <p className="text-sm"><Link className="font-semibold text-link underline" href="/app/trainer">Back to your week</Link></p>
          <h1 className="display-lg mt-2">{s.label} · {WORLD_LABEL[s.world]}</h1>
          <p className="mt-2 text-muted">{ist(s.starts_at)} · {s.duration_min} min · {s.lab} · Grade {s.grade}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-6" aria-labelledby="plan-h">
            <h2 id="plan-h" className="text-xl font-bold">Lesson plan</h2>
            {plan?.ok && plan.data ? (
              <>
                <p className="mt-2 font-semibold text-heading">{plan.data.title}</p>
                <p className="mt-2 whitespace-pre-line">{plan.data.plan}</p>
                <h3 className="mt-4 font-semibold">Kit</h3>
                <ul className="mt-1 list-inside list-disc">{plan.data.kit.map((k) => <li key={k}>{k}</li>)}</ul>
                <p className="mt-3 text-sm text-muted">From AADHYA.</p>
              </>
            ) : (
              <p className="mt-2 text-muted">{plan && !plan.ok ? `${plan.reason}. ` : ""}Lesson plans come from AADHYA once your school is linked. Until then, teach from your curriculum book and note what you covered below.</p>
            )}
          </section>

          <section className="card p-6" aria-labelledby="att-h">
            <h2 id="att-h" className="mb-3 text-xl font-bold">Attendance</h2>
            {s.status !== "planned" ? (
              <p>{s.status === "held" ? `Recorded: ${s.present} of ${s.total} present.` : "Marked as not held."}{s.lesson_title ? ` Taught: ${s.lesson_title}.` : ""}{s.erp_receipt ? ` 21cschool receipt ${s.erp_receipt}.` : ""}</p>
            ) : !started ? (
              <p className="text-muted">You can take attendance once the class starts.</p>
            ) : (
              <>
                {roster && !roster.ok && <p className="mb-3 text-sm text-muted">{roster.reason}. Enter counts instead.</p>}
                {!roster && <p className="mb-3 text-sm text-muted">This class isn&apos;t linked to 21cschool, so enter counts. Names stay in the school&apos;s own records.</p>}
                <Attendance sessionId={s.id} roster={roster?.ok ? roster.data : null} classSize={s.students} lessonTitle={plan?.ok ? plan.data?.title : undefined} />
              </>
            )}
          </section>
        </div>

        <section className="card p-6" aria-labelledby="rev-h">
          <h2 id="rev-h" className="text-xl font-bold">Project review</h2>
          {!subs ? <p className="mt-2 text-muted">Student projects are reviewed in AADHYA. They show here once the class is linked.</p>
            : !subs.ok ? <p className="mt-2 text-muted">{subs.reason}.</p>
            : subs.data.length === 0 ? <p className="mt-2 text-muted">Nothing waiting.</p>
            : (
              <ul className="mt-3 grid gap-3">
                {subs.data.map((sub) => (
                  <li key={sub.id} className="grid gap-2 border-t border-line pt-3">
                    <p><strong className="text-heading">{sub.project}</strong> · {sub.student} · {sub.status === "pending" ? "Waiting for review" : sub.status === "approved" ? "Approved" : "Sent back to improve"}</p>
                    {sub.status === "pending" && (
                      <div className="max-w-md">
                        <JsonForm compact url="/api/school/reviews" fixed={{ submissionId: sub.id }} submit="Send review" done="Sent to AADHYA" fields={[
                          { name: "verdict", label: `Verdict for ${sub.project}`, type: "select", options: [["approved", "It works: approve"], ["revise", "Needs another try"]] },
                          { name: "comment", label: "A note for the student", optional: true },
                        ]} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          <p className="mt-3 text-sm text-muted">Students see your note in AADHYA. Robokalam keeps only a count of reviews.</p>
        </section>
      </div>
    </section>
  );
}
