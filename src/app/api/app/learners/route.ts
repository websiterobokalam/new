import { z } from "zod";
import { body, handler, HttpError, ok, requireAccount } from "@/lib/api";
import { asAccount } from "@/lib/auth/session";
import { uuid } from "@/lib/db";
import { getNotice, recordConsents, REQUIRED, PURPOSES } from "@/lib/learn/consent";
import { hashIp } from "@/lib/providers";
import { clientIp } from "@/lib/rateLimit";

const Body = z.object({
  firstName: z.string().trim().min(1, "Enter a first name").max(40).regex(/^[\p{L}\p{M} .'-]+$/u, "Letters only, please"),
  ageBand: z.enum(["6-8", "9-11", "12-14", "15-17", "18+"]),
  interests: z.array(z.enum(["robotics", "iot", "ai", "finlit", "space", "coding"])).max(6).default([]),
  noticeId: z.string(),
  consents: z.record(z.enum(PURPOSES), z.boolean()),
  guardianDeclared: z.literal(true, { message: "Please confirm you are the parent or guardian" }),
});

export const POST = handler(async (req) => {
  const a = await requireAccount();
  if (!a.adult) throw new HttpError(403, "Only an adult parent or guardian can add a learner");
  const b = await body(req, Body);
  for (const p of REQUIRED) if (!b.consents[p]) throw new HttpError(422, "The required items are needed to join classes", { fields: { [`consents.${p}`]: "Required" } });
  const id = await asAccount(a, async (c) => {
    const notice = await getNotice(c, a.language);
    if (notice.id !== b.noticeId) throw new HttpError(409, "The notice was updated. Please read it again.");
    const rows = [{ id: uuid() }];
    await c.query("INSERT INTO learners (id, guardian_account_id, first_name, age_band, interests) VALUES ($1,$2,$3,$4,$5)", [rows[0].id, a.id, b.firstName, b.ageBand, b.interests]);
    await recordConsents(c, a.id, rows[0].id, notice, b.consents, { ipHash: hashIp(clientIp(req)), userAgent: req.headers.get("user-agent") ?? "", declaredAt: new Date().toISOString() });
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id) VALUES ($1,'learner_created','learner',$2)", [a.id, rows[0].id]);
    return rows[0].id as string;
  });
  return ok({ learnerId: id });
});
