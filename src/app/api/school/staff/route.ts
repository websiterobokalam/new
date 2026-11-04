import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { optionalEmail, optionalPhone, needsEmailOrPhone, EMAIL_OR_PHONE } from "@/lib/auth/fields";
import { addStaff } from "@/lib/schools/core";

export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ email: optionalEmail, phone: optionalPhone, name: z.string().trim().min(2).max(80), role: z.enum(["trainer", "school_admin"]) }).refine(needsEmailOrPhone, EMAIL_OR_PHONE));
  return ok({ id: await addStaff(a, b) });
});
