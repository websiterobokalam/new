import { handler } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { system } from "@/lib/db";
/**
 * Data for gig-worker portal registration, welfare-fee reporting and annual
 * returns (Code on Social Security; Telangana Platform Based Gig Workers Act).
 * Exact fields to be confirmed by counsel when the portals publish formats.
 */
export const GET = handler(async (req) => {
  await requireRole("ops");
  const fy = new URL(req.url).searchParams.get("fy") ?? String(new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1);
  const rows = await system(async (c) => (await c.query(
    `SELECT f.full_name, a.phone_e164, f.city, f.status, f.went_live_at, f.created_at,
            coalesce(sum(e.gross_paise) FILTER (WHERE e.earned_at >= make_date($1::int, 4, 1) AND e.earned_at < make_date($1::int + 1, 4, 1)), 0) AS gross_paise
     FROM fellows f JOIN accounts a ON a.id = f.account_id LEFT JOIN earnings_lines e ON e.fellow_id = f.account_id
     GROUP BY f.account_id, a.phone_e164 ORDER BY f.full_name`,
    [Number(fy)],
  )).rows);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = ["Name,Phone,City,Status,Onboarded,Applied,Gross payouts FY (INR)", ...rows.map((r) => [r.full_name, r.phone_e164, r.city, r.status, r.went_live_at?.toISOString().slice(0, 10) ?? "", r.created_at.toISOString().slice(0, 10), (Number(r.gross_paise) / 100).toFixed(2)].map(esc).join(","))].join("\n");
  return new Response(csv + "\n", { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="gig-workers-FY${fy}.csv"`, "cache-control": "no-store" } });
});
