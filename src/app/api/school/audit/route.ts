import { handler, requireAccount } from "@/lib/api";
import { auditReport, requireStaff } from "@/lib/schools/core";

export const GET = handler(async () => {
  const a = await requireAccount();
  const s = await requireStaff(a, "school_admin");
  const csv = await auditReport(s.schoolId);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="robokalam-audit-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
});
