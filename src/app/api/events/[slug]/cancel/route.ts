import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { cancelRegistration } from "@/lib/events";

export const POST = handler(async (req, { params }) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ who: z.string().min(4).max(36) }));
  await cancelRegistration(a, (await params).slug, b.who);
  return ok({});
});
