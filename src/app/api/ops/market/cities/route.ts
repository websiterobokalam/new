import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { openCity, setCityCap } from "@/lib/market/cities";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ action: z.enum(["open", "cap"]), name: z.string().trim().min(2).max(60), maxLive: z.coerce.number().int().min(1).max(5000), note: z.string().trim().max(1000).default("") }));
  if (b.action === "cap") { await setCityCap(a, b.name.toLowerCase(), b.maxLive); return ok(); }
  return ok(await openCity(a, b.name, b.maxLive, b.note));
});
