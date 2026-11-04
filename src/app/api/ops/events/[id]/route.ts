import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { cancelEvent, publishEvent } from "@/lib/events";

export const POST = handler(async (req, { params }) => {
  const ops = await requireRole("ops");
  const id = z.string().uuid().parse((await params).id);
  const b = await body(req, z.object({ action: z.enum(["publish", "cancel"]), reason: z.string().trim().max(300).optional() }));
  if (b.action === "publish") { await publishEvent(ops, id); return ok({}); }
  return ok({ notified: await cancelEvent(ops, id, b.reason ?? "") });
});
