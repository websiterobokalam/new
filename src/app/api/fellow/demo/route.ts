import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { submitDemo } from "@/lib/fellows/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ url: z.string().trim().url("Paste a link to your private video").max(500), topic: z.string().trim().min(3).max(120) }));
  await submitDemo(a, b.url, b.topic);
  return ok();
});
