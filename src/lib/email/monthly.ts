import { system } from "../db";
import { enqueue } from "./outbox";

/**
 * A short monthly note to each family with something to report: last month's
 * classes, builds and certificates, and what's coming up. "Updates" email, so
 * it respects the family's choice and carries an unsubscribe line. Runs daily;
 * only sends on the 1st to 3rd of the month (India time), once per family per month.
 */

const IST_MS = 5.5 * 3600_000;
const monthName = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

export function reportingMonth(now = new Date()) {
  const ist = new Date(now.getTime() + IST_MS);
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth(); // this month, 0-based
  const py = m === 0 ? y - 1 : y, pm = m === 0 ? 11 : m - 1; // last month, 0-based
  return {
    due: ist.getUTCDate() <= 3,
    from: new Date(Date.UTC(py, pm, 1) - IST_MS),
    to: new Date(Date.UTC(y, m, 1) - IST_MS),
    key: `${py}-${String(pm + 1).padStart(2, "0")}`,
    label: monthName(py, pm),
  };
}

export async function sendMonthlySummaries(now = new Date()) {
  const r = reportingMonth(now);
  if (!r.due) return { queued: 0, month: r.key };
  return system(async (c) => {
    const families = (await c.query(
      `SELECT l.guardian_account_id AS account_id, l.id, l.first_name,
              (SELECT COUNT(*) FROM bookings b JOIN batches bt ON bt.id = b.batch_id WHERE b.learner_id = l.id AND b.status = 'attended' AND bt.starts_at >= $1 AND bt.starts_at < $2) AS classes,
              (SELECT COUNT(*) FROM learner_progress p WHERE p.learner_id = l.id AND p.status = 'built' AND p.completed_at >= $1 AND p.completed_at < $2) AS builds,
              (SELECT COUNT(*) FROM certificates ce WHERE ce.learner_id = l.id AND ce.revoked_at IS NULL AND ce.issued_at >= $1 AND ce.issued_at < $2) AS certs,
              (SELECT COUNT(*) FROM bookings b JOIN batches bt ON bt.id = b.batch_id WHERE b.learner_id = l.id AND b.status = 'confirmed' AND bt.starts_at >= $2) AS upcoming
       FROM learners l JOIN accounts a ON a.id = l.guardian_account_id
       WHERE l.erased_at IS NULL AND a.erased_at IS NULL AND a.disabled_at IS NULL`, [r.from, r.to])).rows;
    const byAccount = new Map<string, { name: string; classes: number; builds: number; certs: number; upcoming: number }[]>();
    for (const f of families) {
      const row = { name: f.first_name as string, classes: Number(f.classes), builds: Number(f.builds), certs: Number(f.certs), upcoming: Number(f.upcoming) };
      if (row.classes + row.builds + row.certs + row.upcoming === 0) continue;
      byAccount.set(f.account_id, [...(byAccount.get(f.account_id) ?? []), row]);
    }
    let queued = 0;
    for (const [accountId, kids] of byAccount) {
      const lines = kids.map((k) => {
        const bits = [
          k.classes ? `${k.classes} class${k.classes === 1 ? "" : "es"} attended` : null,
          k.builds ? `${k.builds} build${k.builds === 1 ? "" : "s"} finished` : null,
          k.certs ? `${k.certs} certificate${k.certs === 1 ? "" : "s"}` : null,
          k.upcoming ? `${k.upcoming} class${k.upcoming === 1 ? "" : "es"} booked ahead` : null,
        ].filter(Boolean);
        return `${k.name}: ${bits.join(", ")}`;
      });
      if (await enqueue(c, { accountId, template: "monthly_summary", dedupe: `monthly:${accountId}:${r.key}`, payload: { month: r.label, lines, names: kids.map((k) => k.name).join(" and ") } })) queued++;
    }
    return { queued, month: r.key };
  });
}
