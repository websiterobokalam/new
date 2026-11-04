import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { saveDraft, submitDraft, withdrawDraft } from "@/lib/market/courses";
const Draft = z.object({
  title: z.string().trim().min(5).max(120), world: z.enum(["robotics", "iot", "ai", "finlit", "space", "coding"]),
  ageMin: z.coerce.number().int().min(6).max(18), ageMax: z.coerce.number().int().min(6).max(18),
  outcome: z.string().trim().min(10).max(400), sessions: z.coerce.number().int().min(1).max(24),
  batchSizeMax: z.coerce.number().int().min(2, "At least 2: never a private 1:1 with a child").max(8, "Up to 8 learners"),
  kit: z.string().trim().max(160).optional(), feeRupees: z.coerce.number().min(0).max(50000),
  syllabus: z.string().trim().min(3, "One line per session"),
}).refine((d) => d.ageMax >= d.ageMin, { message: "Oldest age can't be below youngest", path: ["ageMax"] });

/** "Session title | What they build", one line per session. */
const toInput = (d: z.output<typeof Draft>) => ({
  title: d.title, world: d.world, ageMin: d.ageMin, ageMax: d.ageMax, outcome: d.outcome, sessions: d.sessions, batchSizeMax: d.batchSizeMax, kit: d.kit,
  feePaise: Math.round(d.feeRupees * 100),
  syllabus: d.syllabus.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 24).map((l) => { const [t, ...b] = l.split("|"); return { title: t.trim().slice(0, 120), build: b.join("|").trim().slice(0, 300) }; }),
});
export const POST = handler(async (req, ctx) => {
  const a = await requireAccount();
  const { id } = await ctx.params;
  const raw = await req.clone().json().catch(() => ({}));
  if (raw?.action === "submit") return ok(await submitDraft(a, id));
  if (raw?.action === "withdraw") { await withdrawDraft(a, id); return ok(); }
  const b = await body(req, Draft);
  return ok({ id: await saveDraft(a, toInput(b), id) });
});
