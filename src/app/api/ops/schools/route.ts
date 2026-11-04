import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { phone } from "@/lib/leads";
import { createSchool, DEFAULT_SLA_HOURS } from "@/lib/schools/core";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({
    name: z.string().trim().min(3).max(160), city: z.string().trim().min(2).max(60), board: z.string().trim().max(20).optional(),
    slaHours: z.coerce.number().int().min(4).max(720).default(DEFAULT_SLA_HOURS), aadhyaTenant: z.string().trim().max(80).optional(), erpRef: z.string().trim().max(80).optional(),
    adminPhone: phone, adminName: z.string().trim().min(2).max(80), adminEmail: z.string().trim().toLowerCase().email("Enter a valid email").max(160).optional().or(z.literal("").transform(() => undefined)),
  }));
  return ok({ id: await createSchool(a, b) });
});
