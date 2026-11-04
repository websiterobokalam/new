import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { inr } from "@/lib/money";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Payouts" };

export default async function OpsPayouts() {
  const { account } = await appContext("/app/ops/payouts");
  if (account.role !== "ops") notFound();
  const d = await system(async (c) => ({
    unpaid: (await c.query("SELECT coalesce(sum(net_paise),0) AS net, count(DISTINCT fellow_id) AS fellows FROM earnings_lines WHERE payout_id IS NULL")).rows[0],
    payouts: (await c.query("SELECT p.*, f.full_name FROM payouts p JOIN fellows f ON f.account_id = p.fellow_id ORDER BY p.status = 'paid', p.created_at DESC LIMIT 100")).rows,
  }));
  const lastSunday = new Date(); lastSunday.setDate(lastSunday.getDate() - ((lastSunday.getDay() + 7) % 7 || 7));
  return (
    <section className="py-10"><div className="wrap grid gap-6 [&>*]:min-w-0">
      <header><h1 className="display-lg">Payouts</h1><p className="text-muted">Weekly. Unpaid now: {inr(d.unpaid.net)} across {d.unpaid.fellows} Kalamites. Bank transfers are recorded here until a payouts provider is connected.</p></header>
      <div className="card max-w-md p-6"><JsonForm url="/api/ops/payouts/run" submit="Create this week's payouts" done="Payouts created" fields={[{ name: "periodEnd", label: "Week ending (inclusive)", type: "date", defaultValue: lastSunday.toISOString().slice(0, 10) }]} /></div>
      <ul className="grid gap-3">
        {d.payouts.map((p) => (
          <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <span><strong>{p.full_name}</strong> · week ending {new Date(p.period_end).toLocaleDateString("en-IN")} · {inr(p.net_paise)} net ({inr(p.gross_paise)} − {inr(p.deductions_paise)}) · {p.status}{p.provider_ref ? ` · ${p.provider_ref}` : ""}</span>
            {p.status === "pending" && <div className="w-full max-w-sm"><JsonForm compact url={`/api/ops/payouts/${p.id}/paid`} submit="Mark paid" fields={[{ name: "bankRef", label: "Bank / UTR reference" }]} /></div>}
          </li>
        ))}
      </ul>
    </div></section>
  );
}
