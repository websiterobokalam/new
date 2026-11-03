import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { raiseTicket } from "@/lib/schools/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({
    labId: z.string().uuid(), assetId: z.string().uuid().optional(),
    category: z.enum(["kit_missing", "device", "robot", "sensor", "network", "furniture", "other"]),
    summary: z.string().trim().min(5, "Say what's wrong in a few words").max(160), details: z.string().trim().max(1000).optional(),
  }));
  return ok(await raiseTicket(a, b));
});
