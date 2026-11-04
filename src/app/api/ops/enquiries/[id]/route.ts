import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { closeEnquiry } from "@/lib/engage";

export const POST = handler(async (req, { params }) => {
  const ops = await requireRole("ops");
  const { id } = await params;
  const b = await body(req, z.object({ status: z.enum(["answered", "spam"]), note: z.string().trim().max(300).optional() }));
  await closeEnquiry(ops, z.string().uuid().parse(id), b.status, b.note);
  return ok({});
});
