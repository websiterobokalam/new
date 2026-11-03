import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { removeStaff } from "@/lib/schools/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ accountId: z.string().uuid() }));
  await removeStaff(a, b.accountId);
  return ok();
});
