import { handler, HttpError, requireAccount } from "@/lib/api";
import { system } from "@/lib/db";
import { fellowEvents, ics, icsResponse } from "@/lib/calendar";

/** "Add to calendar" for a gig this Kalamite accepted. */
export const GET = handler(async (_req, { params }) => {
  const a = await requireAccount();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Not found");
  const events = await system((c) => fellowEvents(c, a.id, id));
  if (!events.length) throw new HttpError(404, "Gig not found, or not accepted");
  return icsResponse(ics(events), "robokalam-gig.ics");
});
