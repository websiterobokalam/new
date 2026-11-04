import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { transportStatus } from "@/lib/email/transport";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Email" };
const d = (x: Date | null) => (x ? new Date(x).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "–");
const mask = (e: string) => e.replace(/^(.).*(@.*)$/, "$1•••$2");

export default async function OpsEmail() {
  const { account } = await appContext("/app/ops/email");
  if (account.role !== "ops") notFound();
  const t = transportStatus();
  const x = await system(async (c) => ({
    counts: (await c.query("SELECT status, COUNT(*) AS n FROM email_outbox WHERE created_at > UTC_TIMESTAMP(3) - INTERVAL 7 DAY GROUP BY status")).rows,
    recent: (await c.query("SELECT id, to_email, template, category, status, attempts, last_error, created_at, sent_at FROM email_outbox ORDER BY created_at DESC LIMIT 60")).rows,
  }));
  return (
    <section className="py-10"><div className="wrap grid gap-6 [&>*]:min-w-0">
      <header><h1 className="display-lg">Email</h1><p className="mt-2 text-muted">Every email is queued with the action that caused it and sent with retries. Addresses are masked here.</p></header>
      <div className={`card p-5 ${t.ok ? "" : "border-[#b42318]"}`}><p className="font-semibold">{t.ok ? `Sending through: ${t.name}` : t.reason}</p>
        <p className="mt-1 text-sm text-muted">Last 7 days: {x.counts.map((r) => `${r.n} ${r.status}`).join(" · ") || "nothing yet"}</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
        <thead><tr className="text-left text-muted"><th className="py-2">When</th><th>To</th><th>Email</th><th>Status</th><th>Note</th></tr></thead>
        <tbody>{x.recent.map((m) => (
          <tr key={m.id} className="border-t border-line align-top">
            <td className="py-2">{d(m.created_at)}</td><td>{mask(m.to_email)}</td><td>{m.template} <span className="text-muted">({m.category})</span></td>
            <td>{m.status}{m.attempts > 1 ? ` · ${m.attempts} tries` : ""}</td>
            <td>{m.status === "failed" ? <div className="grid gap-1"><span className="text-muted">{m.last_error}</span><JsonForm compact url={`/api/ops/email/${m.id}`} submit="Send again" done="Queued" fields={[]} /></div> : m.status === "sent" ? d(m.sent_at) : ""}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </div></section>
  );
}
