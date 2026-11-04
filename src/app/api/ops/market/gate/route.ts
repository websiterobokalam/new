import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { setGate } from "@/lib/market/gate";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ action: z.enum(["open", "close"]), note: z.string().trim().max(1000).default("") }));
  await setGate(a, b.action === "open", b.note);
  return ok();
});
