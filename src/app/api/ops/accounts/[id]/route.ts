import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { setLoginDisabled } from "@/lib/auth/accounts";

/** Switch a login off or back on, with a reason. */
export const POST = handler(async (req, { params }) => {
  const ops = await requireRole("ops");
  const { id } = await params;
  const b = await body(req, z.object({ disabled: z.boolean(), reason: z.string().trim().max(300) }));
  await setLoginDisabled(ops, z.string().uuid().parse(id), b.disabled, b.reason);
  return ok({});
});
