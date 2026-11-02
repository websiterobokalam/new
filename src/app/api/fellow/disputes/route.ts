import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { raiseDispute } from "@/lib/fellows/community";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ subject: z.enum(["pay", "gig", "tier", "removal", "session", "other"]), details: z.string().trim().min(10, "Tell us a little more").max(2000), ref: z.string().max(100).optional() }));
  return ok({ id: await raiseDispute(a, a.role === "fellow" ? "fellow" : "parent", b.subject, b.details, b.ref) });
});
