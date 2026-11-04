import { handler, ok, body } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { createEvent, NewEvent } from "@/lib/events";

export const POST = handler(async (req) => {
  const ops = await requireRole("ops");
  return ok(await createEvent(ops, await body(req, NewEvent)));
});
