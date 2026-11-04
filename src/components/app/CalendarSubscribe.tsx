import { system } from "@/lib/db";
import { feedUrl, googleSubscribeUrl, webcalUrl } from "@/lib/calendar";
import { JsonForm } from "./JsonForm";

/** Subscribe to every class or gig in one calendar. Private link, resettable. */
export async function CalendarSubscribe({ accountId, what }: { accountId: string; what: "classes" | "gigs" }) {
  const salt = await system(async (c) => (await c.query("SELECT calendar_salt FROM accounts WHERE id = $1", [accountId])).rows[0]?.calendar_salt ?? null);
  return (
    <section className="card p-6" aria-labelledby="cal-h">
      <h2 id="cal-h" className="text-xl font-bold">Put every {what === "classes" ? "class" : "gig"} in your calendar</h2>
      <p className="mt-1 text-sm text-muted">Subscribe once and new {what} appear on their own, with a reminder 30 minutes before. The link is private to you.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a className="btn btn-primary" href={googleSubscribeUrl(accountId, salt)} target="_blank" rel="noopener noreferrer">Google Calendar<span className="sr-only"> (opens in a new tab)</span></a>
        <a className="btn btn-ghost" href={webcalUrl(accountId, salt)}>Apple or Outlook</a>
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-link">Copy the link, or reset it</summary>
        <p className="mt-2 break-all rounded-lg bg-panel p-3 font-mono text-xs">{feedUrl(accountId, salt)}</p>
        <p className="mt-2 text-muted">Shared it by mistake? Reset it and the old link stops working.</p>
        <div className="mt-2"><JsonForm compact tone="danger" url="/api/app/calendar" submit="Reset my calendar link" done="Reset. Subscribe again with the new link." fields={[]} /></div>
      </details>
    </section>
  );
}
