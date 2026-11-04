import { appContext } from "@/lib/app";
import { emailState } from "@/lib/email/verify";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Email settings" };

export default async function EmailSettings({ searchParams }: { searchParams: Promise<{ verified?: string; expired?: string }> }) {
  const { account } = await appContext("/app/email");
  const sp = await searchParams;
  const s = await emailState(account.id);
  const oneToOne = account.role === "parent" && Number((await system(async (c) => (await c.query(
    `SELECT COUNT(*) AS n FROM learners l WHERE l.guardian_account_id = $1 AND l.erased_at IS NULL AND
       (SELECT e.granted FROM consent_events e WHERE e.learner_id = l.id AND e.purpose = 'one_to_one' ORDER BY e.id DESC LIMIT 1)`, [account.id])).rows[0].n))) > 0;

  return (
    <section className="py-10"><div className="wrap grid max-w-2xl gap-6">
      <header>
        <h1 className="display-lg">Email settings</h1>
        <p className="mt-2 text-muted">We email you at each step: confirmations, receipts, reminders and summaries. We never email children and never send marketing.</p>
      </header>
      {sp.verified && <p role="status" className="rounded-lg bg-leafmist px-4 py-3 font-semibold text-navy dark:bg-panel-2 dark:text-heading">Thanks, your email is confirmed.</p>}
      {sp.expired && <p role="alert" className="rounded-lg bg-[#fde8e7] px-4 py-3 font-semibold text-[#8a1c13]">That link has expired or was already used. Send a new one below.</p>}

      <section className="card p-6" aria-labelledby="addr-h">
        <h2 id="addr-h" className="text-xl font-bold">Your email</h2>
        <p className="mt-2" data-email-status={s.email_verified_at ? "verified" : s.email ? "pending" : "none"}>
          {s.email ? <><strong className="text-heading">{s.email}</strong> · {s.email_verified_at ? "confirmed" : "waiting for you to click the link we sent"}</> : "No email yet."}
        </p>
        <div className="mt-4"><JsonForm url="/api/me/email" submit={s.email ? "Save and send a confirmation link" : "Add email"} done="Check your inbox for a confirmation link." fields={[
          { name: "email", label: "Email address", type: "email", defaultValue: s.email ?? "" },
        ]} /></div>
      </section>

      <section className="card p-6" aria-labelledby="pref-h">
        <h2 id="pref-h" className="text-xl font-bold">What we send</h2>
        <ul className="mt-2 list-inside list-disc grid gap-1">
          <li><strong>Always:</strong> receipts, consent records, safety replies, and changes to your terms.</li>
          <li><strong>Reminders and summaries:</strong> {s.email_updates ? "on" : "off"}. You can turn these off.</li>
          {oneToOne && <li><strong>One-to-one oversight:</strong> a notice before and a summary after every one-to-one session. These can&apos;t be turned off while one-to-one classes are on.</li>}
        </ul>
        <div className="mt-4 max-w-xs"><JsonForm compact url="/api/me/email" fixed={{ updates: s.email_updates ? "off" : "on" }} submit={s.email_updates ? "Turn off reminders and summaries" : "Turn on reminders and summaries"} done="Saved" fields={[]} /></div>
      </section>
    </div></section>
  );
}
