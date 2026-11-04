import { HttpError } from "../api";
import { audit, system, uuid, type Tx } from "../db";
import type { Account } from "./session";
import { SITE } from "../site";
import { enqueue } from "../email/outbox";
import { accountForEmail } from "./session";

/** Roles an admin can create directly. Kalamites always apply and pass vetting; they're never created by hand. */
export const CREATABLE_ROLES = ["parent", "adult_learner", "school_admin", "trainer", "ops", "safeguarding", "csr"] as const;
export type CreatableRole = (typeof CREATABLE_ROLES)[number];

export const ROLE_LABEL: Record<string, string> = {
  parent: "Parent", adult_learner: "Adult learner", fellow: "Kalamite", trainer: "Trainer", school_admin: "School admin",
  ops: "Robokalam ops", safeguarding: "Safeguarding", csr: "CSR partner",
};

/** Where each role signs in. */
export const DOOR_FOR_ROLE: Record<string, "learner" | "school" | "educator"> = {
  parent: "learner", adult_learner: "learner", fellow: "educator", trainer: "school", school_admin: "school",
  ops: "learner", safeguarding: "learner", csr: "learner",
};

/**
 * Find or create the account for a login someone else is setting up (a school
 * admin adding staff, ops creating a login). The email becomes the login email;
 * the person proves it with their first sign-in code. `reuse` decides whether
 * an existing account may take the new role.
 */
export async function provisionLogin(
  c: Tx,
  i: { email?: string | null; phone?: string | null; name: string; role: string; createdBy: string },
  reuse: (existing: { id: string; role: string }) => boolean | Promise<boolean>,
): Promise<{ id: string; created: boolean }> {
  if (!i.email && !i.phone) throw new HttpError(422, "Add an email (or a mobile number)", { fields: { email: "Required" } });
  const byEmail = i.email ? await accountForEmail(c, i.email) : null;
  const byPhone = i.phone ? (await c.query("SELECT id, role FROM accounts WHERE phone_e164 = $1", [i.phone])).rows[0] : null;
  if (byEmail && byPhone && byEmail.id !== byPhone.id) throw new HttpError(409, "That email and that mobile number belong to two different accounts.");
  const existing = (byEmail ?? byPhone) as { id: string; role: string } | null;
  if (existing) {
    if (!(await reuse(existing))) {
      throw new HttpError(409, `This ${byEmail ? "email" : "number"} already has a different Robokalam account (${ROLE_LABEL[existing.role] ?? existing.role}). Use another one.`);
    }
    await c.query(
      "UPDATE accounts SET role = $2, display_name = $3, login_email = COALESCE(login_email, $4), phone_e164 = COALESCE(phone_e164, $5), disabled_at = NULL WHERE id = $1",
      [existing.id, i.role, i.name, i.email ?? null, i.phone ?? null],
    );
    return { id: existing.id, created: false };
  }
  const id = uuid();
  await c.query(
    "INSERT INTO accounts (id, login_email, email, phone_e164, role, display_name, adult_declared_at, created_by) VALUES ($1,$2,$2,$3,$4,$5, UTC_TIMESTAMP(3), $6)",
    [id, i.email ?? null, i.phone ?? null, i.role, i.name, i.createdBy],
  );
  return { id, created: true };
}

/** Tell the person their login exists and where to sign in. */
export async function loginCreatedEmail(c: Tx, accountId: string, email: string | null | undefined, p: { name: string; role: string; by: string }) {
  if (!email) return;
  const door = DOOR_FOR_ROLE[p.role] ?? "learner";
  await enqueue(c, {
    to: email, accountId, template: "login_created", dedupe: `login-created:${accountId}:${p.role}`,
    payload: { name: p.name, by: p.by, role: ROLE_LABEL[p.role] ? `${/^[AEIOU]/.test(ROLE_LABEL[p.role]) ? "an" : "a"} ${ROLE_LABEL[p.role]}` : "", link: `${SITE.url}/login/${door}` },
  });
}

/* ------------------------------ Ops: manage logins ------------------------------ */


/** Ops creates a login. School roles join that school's staff list; everyone else gets a plain account. */
export async function createLogin(ops: Account, i: { name: string; email?: string; phone?: string; role: CreatableRole; schoolId?: string }) {
  if (i.role === "school_admin" || i.role === "trainer") {
    if (!i.schoolId) throw new HttpError(422, "Pick the school this person works at", { fields: { schoolId: "Required for school roles" } });
    const { addStaffAsOps } = await import("../schools/core");
    return addStaffAsOps(ops, i.schoolId, { name: i.name, email: i.email, phone: i.phone, role: i.role });
  }
  return system(async (c) => {
    const { id, created } = await provisionLogin(c, { ...i, createdBy: ops.id }, (existing) =>
      // A parent may be given an extra role only by ops, and never a Kalamite or school account.
      existing.role === i.role || (existing.role === "parent" && ["ops", "safeguarding", "csr", "adult_learner"].includes(i.role)));
    await audit(c, ops.id, created ? "login_created" : "login_updated", "account", id, { role: i.role, via: i.email ? "email" : "phone" });
    await loginCreatedEmail(c, id, i.email, { name: i.name, role: i.role, by: "Robokalam" });
    return id;
  });
}

/** Switch a login off (signs them out everywhere) or back on. Always with a reason. */
export async function setLoginDisabled(ops: Account, accountId: string, disabled: boolean, reason: string) {
  if (reason.trim().length < 5) throw new HttpError(422, "Write down why", { fields: { reason: "Required" } });
  if (accountId === ops.id) throw new HttpError(409, "You can't switch off your own login.");
  return system(async (c) => {
    const r = await c.query(`UPDATE accounts SET disabled_at = ${disabled ? "UTC_TIMESTAMP(3)" : "NULL"} WHERE id = $1 AND erased_at IS NULL`, [accountId]);
    if (!r.affectedRows) throw new HttpError(404, "Account not found");
    if (disabled) await c.query("UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE account_id = $1 AND revoked_at IS NULL", [accountId]);
    await audit(c, ops.id, disabled ? "login_disabled" : "login_enabled", "account", accountId, { reason });
  });
}

export async function findAccounts(q?: string) {
  return system(async (c) => {
    const like = q ? `%${q.trim().toLowerCase()}%` : null;
    return (await c.query(
      `SELECT a.id, a.display_name, a.role, a.login_email, a.email, a.phone_e164, a.created_at, a.disabled_at, a.created_by,
              (SELECT MAX(s.created_at) FROM sessions s WHERE s.account_id = a.id) AS last_login,
              sc.name AS school
       FROM accounts a
       LEFT JOIN school_staff st ON st.account_id = a.id AND st.removed_at IS NULL
       LEFT JOIN schools sc ON sc.id = st.school_id
       WHERE a.erased_at IS NULL ${like ? "AND (LOWER(COALESCE(a.login_email, a.email, '')) LIKE $1 OR a.phone_e164 LIKE $1 OR LOWER(COALESCE(a.display_name, '')) LIKE $1)" : ""}
       ORDER BY a.created_at DESC LIMIT 60`,
      like ? [like] : [],
    )).rows;
  });
}
