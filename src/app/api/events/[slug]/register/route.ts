import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { register } from "@/lib/events";

export const POST = handler(async (req, { params }) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ learnerIds: z.array(z.string().uuid()).max(10).optional(), self: z.boolean().optional() }));
  return ok({ registered: await register(a, (await params).slug, b) });
});
