import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { revokeCertificate } from "@/lib/certificates";

/** Revoke a certificate, with a reason the public check shows. */
export const POST = handler(async (req, { params }) => {
  const ops = await requireRole("ops");
  const { code } = await params;
  const b = await body(req, z.object({ reason: z.string().trim().max(300) }));
  await revokeCertificate(ops, code, b.reason);
  return ok({});
});
