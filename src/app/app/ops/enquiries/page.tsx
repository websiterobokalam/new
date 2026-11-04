import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { JsonForm } from "@/components/app/JsonForm";
import { listEnquiries, newsletterStats, TOPICS, type Topic } from "@/lib/engage";

export const metadata = { title: "Enquiries and newsletter" };
export const dynamic = "force-dynamic";

const when = (d: Date) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function OpsEnquiries() {
  const { account } = await appContext("/app/ops/enquiries");
  if (account.role !== "ops") notFound();
  const [open, stats] = await Promise.all([listEnquiries("open"), newsletterStats()]);
  const n = (s: string) => Number(stats.find((x) => x.status === s)?.n ?? 0);
  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <h1 className="display-lg">Enquiries and newsletter</h1>
          <p className="mt-2 max-w-3xl text-muted">Messages from the contact page. The sender already has an acknowledgement with their reference; reply from your mailbox, then mark it answered here.</p>
        </header>
        <section aria-labelledby="open-h">
          <h2 id="open-h" className="text-xl font-bold">Open ({open.length})</h2>
          <ul className="mt-3 grid gap-3">
            {open.map((e) => (
              <li key={e.id} className="card grid gap-2 p-4">
                <p><strong className="text-heading">{e.name}</strong> · {TOPICS[e.topic as Topic]?.label ?? e.topic} · <span className="font-mono text-sm">{e.ref}</span> · {when(e.created_at)}</p>
                <p className="text-sm"><a className="text-link underline" href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: your message to Robokalam (${e.ref})`)}`}>{e.email}</a>{e.phone_e164 ? ` · ${e.phone_e164}` : ""}{e.organisation ? ` · ${e.organisation}` : ""}</p>
                <p className="whitespace-pre-wrap rounded-lg bg-panel p-3 text-sm">{e.message}</p>
                <div className="flex flex-wrap gap-2">
                  <JsonForm compact url={`/api/ops/enquiries/${e.id}`} fixed={{ status: "answered" }} submit={`Mark ${e.ref} answered`} done="Marked answered" fields={[{ name: "note", label: "Note (optional)", optional: true }]} />
                  <JsonForm compact tone="danger" url={`/api/ops/enquiries/${e.id}`} fixed={{ status: "spam" }} submit={`Mark ${e.ref} as spam`} done="Marked spam" fields={[]} />
                </div>
              </li>
            ))}
            {open.length === 0 && <li className="text-muted">Nothing open. Good work.</li>}
          </ul>
        </section>
        <section className="card p-6" aria-labelledby="nl-h">
          <h2 id="nl-h" className="text-xl font-bold">Newsletter</h2>
          <p className="mt-2 text-muted">{n("confirmed")} confirmed · {n("pending")} waiting to confirm · {n("unsubscribed")} unsubscribed. Only confirmed adults are on the list.</p>
          <a className="btn btn-ghost mt-4" href="/api/ops/newsletter" download>Download confirmed list (CSV)</a>
          <p className="mt-2 text-sm text-muted">Each row has that person's own unsubscribe link. Put it in every newsletter you send.</p>
        </section>
      </div>
    </section>
  );
}
