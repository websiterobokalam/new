import Link from "next/link";
import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";
import { AutomatedNotices } from "@/components/fellow/AutomatedNotices";

export const metadata = { title: "Quality flags" };
const SEV: Record<string, string> = { high: "Serious", warn: "Check", info: "Note" };

export default async function OpsQuality() {
  const { account } = await appContext("/app/ops/quality");
  if (account.role !== "ops") notFound();
  const flags = await system(async (c) => (await c.query(
    `SELECT q.*, f.display_name FROM quality_flags q LEFT JOIN fellows f ON f.account_id = q.fellow_id
     WHERE q.subject_type = 'fellow' AND q.status = 'open' ORDER BY FIELD(q.severity,'high','warn','info'), q.created_at`)).rows);

  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <header>
        <h1 className="display-lg">Quality flags</h1>
        <p className="mt-2 max-w-3xl text-muted">Signals about teaching, from rules over delivered sessions. A flag is a reason to talk, not a decision: record what you decided and why. Removal still goes through a <Link className="text-link underline" href="/app/ops/cases">written case with 7 days&apos; notice</Link>, and child-safety concerns go to the Safeguarding Lead.</p>
      </header>
      <div className="max-w-xs"><JsonForm compact url="/api/ops/flags/run" submit="Run teaching checks now" done="Checks run" fields={[]} /></div>
      {flags.length === 0 && <p className="text-muted">No open flags.</p>}
      <ul className="grid gap-3">
        {flags.map((f) => (
          <li key={f.id} className="card grid gap-2 p-5" data-flag={f.code}>
            <p><strong className="text-heading">{SEV[f.severity]}</strong> · {f.display_name} · {f.message}{f.evidence ? ` (${f.evidence})` : ""}</p>
            <div className="max-w-md"><JsonForm compact url={`/api/ops/flags/${f.id}`} submit="Record decision" done="Recorded" fields={[
              { name: "status", label: "What happened", type: "select", options: [["actioned", "Talked it through / coaching agreed"], ["dismissed", "Not an issue"]] },
              { name: "note", label: "Note the Kalamite will read" },
            ]} /></div>
          </li>
        ))}
      </ul>
      <AutomatedNotices />
    </div></section>
  );
}
