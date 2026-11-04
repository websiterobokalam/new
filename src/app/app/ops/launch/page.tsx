import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { launchReport, type Check } from "@/lib/launch";

export const metadata = { title: "Launch readiness" };
export const dynamic = "force-dynamic";

/** Everything that must be true before robokalam.com goes live, checked now. */
export default async function LaunchPage() {
  const { account } = await appContext("/app/ops/launch");
  if (account.role !== "ops") notFound();
  const r = await launchReport();
  const areas = [...new Set(r.checks.map((c) => c.area))];
  const badge = (c: Check) =>
    c.ok ? ["Done", "bg-leafmist text-navy"] : c.severity === "blocker" ? ["Blocks launch", "bg-[#FDE2E1] text-[#8A1C14]"] : ["Recommended", "bg-[#FEEBD0] text-[#6B3F00]"];
  return (
    <section className="py-10">
      <div className="wrap grid gap-8">
        <header>
          <h1 className="display-lg">Launch readiness</h1>
          <p className="mt-2 max-w-3xl text-muted">
            Checked just now, from this server&apos;s settings and database. On the live address (https://robokalam.com) the server will not start while anything below blocks launch.
          </p>
          <div className={`mt-4 rounded-xl border p-4 ${r.ready ? "border-[#9AD9B5] bg-leafmist" : "border-[#F3B4AF] bg-[#FDF1F0]"}`} role="status">
            <p className="text-lg font-bold text-navy">
              {r.ready ? "Ready to launch." : `${r.blockers.length} item${r.blockers.length === 1 ? "" : "s"} block launch.`}
            </p>
            <p className="text-sm text-[#1E3A4A]">{r.passed} of {r.total} checks pass · {r.warnings.length} recommended {r.warnings.length === 1 ? "item" : "items"} · {r.live ? "This is the live site." : "This is not the live site, so it starts anyway."}</p>
          </div>
        </header>
        {areas.map((area) => (
          <section key={area} aria-labelledby={`area-${area}`}>
            <h2 id={`area-${area}`} className="text-xl font-bold text-heading">{area}</h2>
            <ul className="mt-3 grid gap-2">
              {r.checks.filter((c) => c.area === area).map((c) => {
                const [label, tone] = badge(c);
                return (
                  <li key={c.id} className="card grid gap-1 p-4 sm:grid-cols-[9rem_1fr]">
                    <span className={`self-start justify-self-start rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{label}</span>
                    <div>
                      <p className="font-semibold text-heading">{c.label}</p>
                      <p className="text-sm text-muted">{c.detail}</p>
                      {!c.ok && <p className="mt-1 text-sm"><span className="font-semibold">Fix:</span> {c.fix}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <section className="card p-5 text-sm text-muted">
          <h2 className="text-lg font-bold text-heading">Scheduled jobs on Hostinger</h2>
          <p className="mt-2">The server sends email and tidies up on its own. As a backup, add these cron jobs (replace KEY with CRON_SECRET):</p>
          <ul className="mt-2 grid gap-1 font-mono text-xs">
            <li>every 5 minutes: curl -fsS &quot;https://robokalam.com/api/cron/email?key=KEY&quot;</li>
            <li>daily: curl -fsS &quot;https://robokalam.com/api/cron/housekeeping?key=KEY&quot;</li>
          </ul>
          <p className="mt-2">Uptime monitor: https://robokalam.com/api/health (200 when healthy).</p>
        </section>
      </div>
    </section>
  );
}
