import { handler, requireAccount } from "@/lib/api";
import { earnings, statementCsv } from "@/lib/fellows/earnings";
export const GET = handler(async () => {
  const a = await requireAccount();
  const e = await earnings(a);
  return new Response(statementCsv(e.lines), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="robokalam-earnings.csv"', "cache-control": "no-store" } });
});
