import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { askHelp } from "@/lib/fellows/gigs";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ gigId: z.string().uuid().nullable(), kind: z.enum(["tech", "kit", "learner", "safety", "other"]) }));
  return ok({ id: await askHelp(a, b.gigId, b.kind) });
});
