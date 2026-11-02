import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { setExamMode } from "@/lib/fellows/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() }));
  await setExamMode(a, b.until);
  return ok();
});
