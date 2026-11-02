import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { completeModule } from "@/lib/fellows/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ moduleId: z.string(), answers: z.array(z.number().int()) }));
  return ok(await completeModule(a, b.moduleId, b.answers));
});
