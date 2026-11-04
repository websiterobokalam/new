import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { issueByOps } from "@/lib/certificates";

/** Issue a course certificate by hand for an attended booking. */
export const POST = handler(async (req) => {
  const ops = await requireRole("ops");
  const b = await body(req, z.object({ bookingId: z.string().trim().uuid("Paste the booking ID") }));
  return ok({ code: await issueByOps(ops, b.bookingId) });
});
