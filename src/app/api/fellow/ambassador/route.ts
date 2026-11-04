import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { applyAmbassador } from "@/lib/market/ambassadors";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ collegeId: z.string().uuid({ message: "Pick your college" }), pitch: z.string().trim().min(30, "A few sentences, please").max(600) }));
  await applyAmbassador(a, b.collegeId, b.pitch);
  return ok();
});
