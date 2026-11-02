import { handler, ok, requireAccount } from "@/lib/api";
import { asAccount } from "@/lib/auth/session";
import { currentConsents, hasRequired } from "@/lib/learn/consent";

export const GET = handler(async () => {
  const a = await requireAccount();
  const learners = await asAccount(a, async (c) => {
    const { rows } = await c.query("SELECT id, first_name, age_band, interests FROM learners WHERE guardian_account_id = $1 AND erased_at IS NULL ORDER BY created_at", [a.id]);
    return Promise.all(rows.map(async (l) => ({ ...l, ready: hasRequired(await currentConsents(c, l.id)) })));
  });
  return ok({ adult: a.adult, learners });
});
