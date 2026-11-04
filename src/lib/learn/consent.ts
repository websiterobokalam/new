import type { Tx } from "../db";

export const PURPOSES = ["account", "live_classes", "class_recording", "ai_helper", "portfolio_sharing", "whatsapp", "follow_up", "one_to_one"] as const;
export type Purpose = (typeof PURPOSES)[number];
/** Needed to join any live class. Recording is required because it is a child-safety rule. */
export const REQUIRED: Purpose[] = ["account", "live_classes", "class_recording"];

export type NoticeItem = { purpose: Purpose; required: boolean; what: string; why: string; keep: string };
export type Notice = { id: string; language: string; title: string; sha256: string; approved: boolean; body: { items: NoticeItem[]; rights: string; grievance: string } };

export async function getNotice(c: Tx, lang: string): Promise<Notice> {
  const { rows } = await c.query("SELECT id, language, title, sha256, approved, body FROM consent_notices WHERE language IN ($1) ORDER BY (language = $2) DESC, published_at DESC, id DESC LIMIT 1", [[lang, "en"], lang]);
  if (!rows[0]) throw new Error("No consent notice published");
  return rows[0];
}

/**
 * Verifiable parental consent, Phase 2 method: the guardian's phone is verified
 * by OTP in this session and they declared they are an adult and the child's
 * parent or lawful guardian. Counsel to confirm whether DigiLocker age
 * verification is also required (open question).
 */
export const CONSENT_METHOD = "otp_verified_phone+adult_guardian_declaration";

export async function recordConsents(
  c: Tx,
  guardianId: string,
  learnerId: string,
  notice: Pick<Notice, "id" | "sha256">,
  decisions: Partial<Record<Purpose, boolean>>,
  evidence: { ipHash: string; userAgent: string; declaredAt: string },
) {
  for (const p of PURPOSES) {
    if (decisions[p] === undefined) continue;
    await c.query(
      "INSERT INTO consent_events (learner_id, guardian_account_id, purpose, granted, notice_id, method, evidence) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [learnerId, guardianId, p, decisions[p], notice.id, CONSENT_METHOD, JSON.stringify({ notice_sha256: notice.sha256, ip_hash: evidence.ipHash, user_agent: evidence.userAgent.slice(0, 200), adult_guardian_declared_at: evidence.declaredAt })],
    );
  }
}

export async function currentConsents(c: Tx, learnerId: string): Promise<Record<Purpose, boolean>> {
  // Latest event per purpose is the current state.
  const { rows } = await c.query(
    "SELECT e.purpose, e.granted FROM consent_events e JOIN (SELECT purpose, MAX(id) AS id FROM consent_events WHERE learner_id = $1 GROUP BY purpose) m ON m.id = e.id",
    [learnerId],
  );
  const out = Object.fromEntries(PURPOSES.map((p) => [p, false])) as Record<Purpose, boolean>;
  for (const r of rows) out[r.purpose as Purpose] = r.granted;
  return out;
}

export const hasRequired = (s: Record<Purpose, boolean>) => REQUIRED.every((p) => s[p]);
