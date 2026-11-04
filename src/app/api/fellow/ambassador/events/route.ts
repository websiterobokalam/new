import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { proposeEvent } from "@/lib/market/ambassadors";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ title: z.string().trim().min(5).max(120), plannedAt: z.string().datetime({ offset: true }), venue: z.string().trim().min(3).max(160) }));
  return ok({ id: await proposeEvent(a, b) });
});
