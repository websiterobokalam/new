import { handler, HttpError, requireAccount } from "@/lib/api";
import { system } from "@/lib/db";
import { familyEvents, ics, icsResponse } from "@/lib/calendar";

/** "Add to calendar" for one of this family's classes. */
export const GET = handler(async (_req, { params }) => {
  const a = await requireAccount();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Not found");
  const events = await system((c) => familyEvents(c, a.id, id));
  if (!events.length) throw new HttpError(404, "Class not found");
  return icsResponse(ics(events), "robokalam-class.ics");
});
