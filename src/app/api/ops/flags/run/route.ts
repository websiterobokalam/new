import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { runSessionSignals } from "@/lib/quality/flags";
export const POST = handler(async () => {
  const a = await requireRole("ops");
  return ok(await runSessionSignals(a));
});
