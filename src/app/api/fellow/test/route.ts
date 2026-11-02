import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { takeSubjectTest } from "@/lib/fellows/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ world: z.string(), answers: z.array(z.number().int()).length(5) }));
  return ok(await takeSubjectTest(a, b.world, b.answers));
});
