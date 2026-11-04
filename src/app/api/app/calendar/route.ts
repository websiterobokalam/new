import { randomBytes } from "node:crypto";
import { handler, ok, requireAccount } from "@/lib/api";
import { audit, system } from "@/lib/db";

/** Reset the private calendar link: the old link stops working at once. */
export const POST = handler(async () => {
  const a = await requireAccount();
  await system(async (c) => {
    await c.query("UPDATE accounts SET calendar_salt = $2 WHERE id = $1", [a.id, randomBytes(8).toString("hex")]);
    await audit(c, a.id, "calendar_link_reset", "account", a.id);
  });
  return ok({});
});
