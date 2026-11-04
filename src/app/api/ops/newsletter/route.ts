import { handler, requireAccount, HttpError } from "@/lib/api";
import { confirmedSubscribers, newsletterLink } from "@/lib/engage";
import { audit, system } from "@/lib/db";

/** CSV of confirmed subscribers, each with their own unsubscribe link, for the tool that sends the newsletter. */
export const GET = handler(async () => {
  const a = await requireAccount();
  if (a.role !== "ops") throw new HttpError(403, "Not allowed");
  const rows = await confirmedSubscribers();
  await system((c) => audit(c, a.id, "newsletter_exported", "newsletter", "list", { count: rows.length }));
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = ["email,confirmed_at,unsubscribe_url", ...rows.map((r) => [r.email, new Date(r.confirmed_at).toISOString(), newsletterLink("unsubscribe", r.token)].map(esc).join(","))].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="robokalam-newsletter.csv"', "cache-control": "no-store" } });
});
