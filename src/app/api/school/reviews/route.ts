import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { HttpError } from "@/lib/api";
import { audit, system } from "@/lib/db";
import { requireStaff } from "@/lib/schools/core";
import { aadhya } from "@/lib/integrations";

/** Project review: the verdict goes to AADHYA; we log only that a review happened. */
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const s = await requireStaff(a, "trainer", "school_admin");
  const b = await body(req, z.object({ submissionId: z.string().min(1).max(120), verdict: z.enum(["approved", "revise"]), comment: z.string().trim().max(500).default("") }));
  if (!s.aadhyaTenant) throw new HttpError(409, "This school isn't linked to AADHYA yet");
  if (b.verdict === "revise" && b.comment.length < 3) throw new HttpError(422, "Tell the student what to change", { fields: { comment: "Required" } });
  await aadhya().review(s.aadhyaTenant, b.submissionId, b.verdict, b.comment);
  await system((c) => audit(c, a.id, "project_reviewed", "aadhya_submission", b.submissionId.slice(0, 64), { school: s.schoolId, verdict: b.verdict }));
  return ok();
});
