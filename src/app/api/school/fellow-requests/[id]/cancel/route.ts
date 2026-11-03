import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { cancelRequest } from "@/lib/schools/core";
export const POST = handler(async (_req, ctx) => {
  const a = await requireAccount();
  await cancelRequest(a, (await ctx.params).id);
  return ok();
});
