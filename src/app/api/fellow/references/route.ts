import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { submitReferences } from "@/lib/fellows/core";
const Ref = z.object({ name: z.string().trim().min(2).max(80), relation: z.string().trim().min(2).max(80), contact: z.string().trim().min(5).max(120) });
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ refs: z.array(Ref).length(2, "Add two references") }));
  await submitReferences(a, b.refs);
  return ok();
});
