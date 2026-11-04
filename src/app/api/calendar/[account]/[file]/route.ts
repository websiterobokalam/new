import { system } from "@/lib/db";
import { checkFeedToken, familyEvents, fellowEvents, ics, icsResponse } from "@/lib/calendar";

export const dynamic = "force-dynamic";

/**
 * Private calendar feed: /api/calendar/<account>/<token>.ics. Calendar apps
 * fetch it without a login, so the signed token is the only key. Anything wrong
 * gives the same 404, so a guess learns nothing.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ account: string; file: string }> }) {
  const { account, file } = await params;
  const token = file.replace(/\.ics$/, "");
  const notFound = () => new Response("Not found", { status: 404 });
  if (!/^[0-9a-f-]{36}$/.test(account)) return notFound();
  const a = await system(async (c) => (await c.query("SELECT id, role, calendar_salt, erased_at, disabled_at FROM accounts WHERE id = $1", [account])).rows[0]);
  if (!a || a.erased_at || a.disabled_at || !checkFeedToken(a.id, a.calendar_salt, token)) return notFound();
  const events = await system((c) => (a.role === "fellow" ? fellowEvents(c, a.id) : familyEvents(c, a.id)));
  return icsResponse(ics(events, { name: a.role === "fellow" ? "Robokalam gigs" : "Robokalam classes" }), "robokalam.ics");
}
