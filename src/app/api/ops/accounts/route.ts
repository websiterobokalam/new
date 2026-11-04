import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { optionalEmail, optionalPhone, needsEmailOrPhone, EMAIL_OR_PHONE } from "@/lib/auth/fields";
import { createLogin, CREATABLE_ROLES } from "@/lib/auth/accounts";

/** Ops create a login for someone. They sign in with a code sent to that email. */
export const POST = handler(async (req) => {
  const ops = await requireRole("ops");
  const b = await body(req, z.object({
    name: z.string().trim().min(2, "Enter their name").max(80),
    email: optionalEmail, phone: optionalPhone,
    role: z.enum(CREATABLE_ROLES),
    schoolId: z.union([z.literal("").transform(() => undefined), z.string().uuid()]).optional(),
  }).refine(needsEmailOrPhone, EMAIL_OR_PHONE));
  return ok({ id: await createLogin(ops, b) });
});
