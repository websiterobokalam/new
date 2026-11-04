import { z } from "zod";
import { body, handler, limit, ok, requireAccount } from "@/lib/api";
import { setUpdates, startVerification } from "@/lib/email/verify";

export const POST = handler(async (req) => {
  limit(req, "email-set", 10, 60 * 60_000);
  const a = await requireAccount();
  const b = await body(req, z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(160).optional(),
    updates: z.enum(["on", "off"]).optional(),
  }));
  if (b.updates) await setUpdates(a.id, b.updates === "on");
  if (b.email) return ok(await startVerification(a, b.email));
  return ok();
});
