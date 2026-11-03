import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { phone } from "@/lib/leads";
import { addStaff } from "@/lib/schools/core";

export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ phone, name: z.string().trim().min(2).max(80), role: z.enum(["trainer", "school_admin"]) }));
  return ok({ id: await addStaff(a, b) });
});

