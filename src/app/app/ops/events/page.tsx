import Link from "next/link";
import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { JsonForm } from "@/components/app/JsonForm";
import { opsEvents, EVENT_KINDS, ageLabel, ist } from "@/lib/events";

export const metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function OpsEvents() {
  const { account } = await appContext("/app/ops/events");
  if (account.role !== "ops") notFound();
  const list = await opsEvents();
  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <h1 className="display-lg">Events</h1>
          <p className="mt-2 max-w-3xl text-muted">Create an event as a draft, check it, then publish it to <Link className="text-link underline" href="/events">/events</Link>. Events are free. Children can only be registered by a signed-in parent, and in-person children&apos;s events must name the responsible adult at the school or centre.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <section className="card p-6" aria-labelledby="new-ev">
            <h2 id="new-ev" className="mb-4 text-xl font-bold">New event</h2>
            <JsonForm url="/api/ops/events" submit="Create draft" done="Draft created. Publish it from the list." fields={[
              { name: "title", label: "Title" },
              { name: "kind", label: "Kind", type: "select", options: Object.entries(EVENT_KINDS) as [string, string][] },
              { name: "audience", label: "For", type: "select", options: [["learners", "Children (registered by a parent)"], ["adults", "Adults (teachers, parents, students)"]] },
              { name: "summary", label: "One-line summary" },
              { name: "description", label: "Details (optional)", type: "textarea", optional: true },
              { name: "startsAt", label: "Starts", type: "datetime" },
              { name: "durationMin", label: "Length (minutes)", type: "number", defaultValue: 90 },
              { name: "mode", label: "Where", type: "select", options: [["online", "Online"], ["in_person", "In person"]] },
              { name: "venue", label: "Venue (in person)", optional: true },
              { name: "responsibleAdult", label: "Responsible adult on site (children's in-person events)", optional: true },
              { name: "city", label: "City (optional)", optional: true, defaultValue: "Hyderabad" },
              { name: "capacity", label: "Places", type: "number", defaultValue: 30 },
              { name: "ageMin", label: "Youngest age (children's events)", type: "number", optional: true },
              { name: "ageMax", label: "Oldest age (optional)", type: "number", optional: true },
            ]} />
          </section>
          <section aria-labelledby="list-ev">
            <h2 id="list-ev" className="text-xl font-bold">All events</h2>
            <ul className="mt-3 grid gap-3">
              {list.map((e) => (
                <li key={e.id} className="card grid gap-2 p-4">
                  <p>
                    <strong className="text-heading">{e.title}</strong> · {EVENT_KINDS[e.kind]} · {ageLabel(e)}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${e.status === "published" ? "bg-leafmist text-navy" : e.status === "cancelled" ? "bg-[#FDE2E1] text-[#8A1C14]" : "bg-[#FEEBD0] text-[#6B3F00]"}`}>{e.status}</span>
                  </p>
                  <p className="text-sm text-muted">{ist(e.starts_at)} · {e.mode === "online" ? "Online" : e.venue} · {e.taken} of {e.capacity} registered</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {e.status !== "draft" && <Link className="text-sm font-semibold text-link underline" href={`/events/${e.slug}`}>Public page</Link>}
                    <a className="text-sm font-semibold text-link underline" href={`/api/ops/events/${e.id}/csv`} download>Who&apos;s coming (CSV)</a>
                    {e.status === "draft" && <JsonForm compact url={`/api/ops/events/${e.id}`} fixed={{ action: "publish" }} submit={`Publish ${e.title}`} done="Published" fields={[]} />}
                  </div>
                  {e.status !== "cancelled" && (
                    <JsonForm compact tone="danger" url={`/api/ops/events/${e.id}`} fixed={{ action: "cancel" }} submit={`Cancel ${e.title}`} done="Cancelled. Everyone registered has been told." fields={[{ name: "reason", label: "Reason (sent to everyone registered)" }]} />
                  )}
                </li>
              ))}
              {list.length === 0 && <li className="text-muted">No events yet.</li>}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
