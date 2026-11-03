import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { addAsset } from "@/lib/schools/core";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ labId: z.string().uuid(), kind: z.enum(["kit", "device", "robot", "sensor", "display", "network", "furniture", "other"]), label: z.string().trim().min(2).max(100), serial: z.string().trim().max(80).optional(), count: z.coerce.number().int().min(1).max(60).default(1) }));
  await addAsset(a, b.labId, b);
  return ok();
});
