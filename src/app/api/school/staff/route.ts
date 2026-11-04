import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { phone } from "@/lib/leads";
import { addStaff } from "@/lib/schools/core";

export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ phone, name: z.string().trim().min(2).max(80), role: z.enum(["trainer", "school_admin"]), email: z.string().trim().toLowerCase().email("Enter a valid email").max(160).optional().or(z.literal("").transform(() => undefined)) }));
  return ok({ id: await addStaff(a, b) });
});

