import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { acceptTerms } from "@/lib/fellows/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ termIds: z.array(z.string()).min(2) }));
  await acceptTerms(a, b.termIds);
  return ok();
});
