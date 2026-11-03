import { createHash } from "node:crypto";
import { testProvidersAllowed } from "../providers";

/**
 * AADHYA (learning platform), 21cschool (school ERP) and Validate
 * (certificates) are integrated, not rebuilt. Each sits behind one small
 * interface. The HTTP contract below is our proposal: if the real APIs
 * differ, only this file changes.
 *
 * Child data rule: rosters and submissions are read live and never stored
 * by Robokalam. We keep counts only (present / total, reviewed).
 */

export class NotConnected extends Error {
  constructor(public service: "AADHYA" | "21cschool" | "Validate") { super(`${service} is not connected yet`); }
}

export type Student = { ref: string; name: string };
export type LessonPlan = { title: string; plan: string; kit: string[] };
export type Submission = { id: string; student: string; project: string; submittedAt: string; status: "pending" | "approved" | "revise" };

export interface SchoolErp {
  roster(schoolRef: string, classRef: string): Promise<Student[]>;
  submitAttendance(schoolRef: string, classRef: string, date: string, presentRefs: string[]): Promise<{ receipt: string }>;
}
export interface Aadhya {
  lessonPlan(tenant: string, world: string, grade: number, date: string): Promise<LessonPlan | null>;
  submissions(tenant: string, classRef: string): Promise<Submission[]>;
  review(tenant: string, submissionId: string, verdict: "approved" | "revise", comment: string): Promise<void>;
}
export interface Validate {
  certificates(schoolRef: string): Promise<{ issued: number; pending: number }>;
}

/* ---------------- HTTP adapters (proposed contract) ---------------- */

function http(base: string, key: string, service: NotConnected["service"]) {
  return async <T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> => {
    const r = await fetch(new URL(path, base), {
      method: init?.method ?? "GET",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json" },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`${service} responded ${r.status}`);
    return (await r.json()) as T;
  };
}
const enc = encodeURIComponent;

function httpErp(base: string, key: string): SchoolErp {
  const call = http(base, key, "21cschool");
  return {
    roster: async (s, c) => (await call<{ students: Student[] }>(`schools/${enc(s)}/classes/${enc(c)}/students`)).students,
    submitAttendance: (s, c, date, present) => call(`schools/${enc(s)}/classes/${enc(c)}/attendance`, { method: "POST", body: { date, present } }),
  };
}
function httpAadhya(base: string, key: string): Aadhya {
  const call = http(base, key, "AADHYA");
  return {
    lessonPlan: async (t, world, grade, date) => (await call<{ plan: LessonPlan | null }>(`tenants/${enc(t)}/lesson-plan?world=${enc(world)}&grade=${grade}&date=${enc(date)}`)).plan,
    submissions: async (t, c) => (await call<{ submissions: Submission[] }>(`tenants/${enc(t)}/classes/${enc(c)}/submissions`)).submissions,
    review: async (t, id, verdict, comment) => { await call(`tenants/${enc(t)}/submissions/${enc(id)}/review`, { method: "POST", body: { verdict, comment } }); },
  };
}
function httpValidate(base: string, key: string): Validate {
  const call = http(base, key, "Validate");
  return { certificates: (s) => call(`schools/${enc(s)}/certificates/summary`) };
}

/* ---------------- Test doubles (ALLOW_TEST_PROVIDERS=1 only) ---------------- */

const SAMPLE_NAMES = ["Aarav", "Diya", "Ishaan", "Meera", "Kabir", "Saanvi", "Vihaan", "Anika", "Arjun", "Tara", "Reyansh", "Myra"];
const reviews = new Map<string, Submission["status"]>();
const seeded = (s: string) => parseInt(createHash("sha256").update(s).digest("hex").slice(0, 8), 16);

const mockErp: SchoolErp = {
  roster: async (s, c) => SAMPLE_NAMES.slice(0, 6 + (seeded(s + c) % 6)).map((n, i) => ({ ref: `${c}-${i + 1}`, name: `${n} (sample)` })),
  submitAttendance: async (_s, c, date) => ({ receipt: `ERP-${seeded(c + date).toString(36).toUpperCase()}` }),
};
const mockAadhya: Aadhya = {
  lessonPlan: async (_t, world, grade) => ({
    title: `${world[0].toUpperCase()}${world.slice(1)} · Grade ${grade} · sample lesson`,
    plan: "Warm-up (5 min): recap last build.\nBuild (30 min): follow the AADHYA mission in pairs.\nShow (10 min): two pairs demo; class asks one question each.",
    kit: ["ASHAER pack", "RK Brain chip", "USB cable"],
  }),
  submissions: async (_t, c) => SAMPLE_NAMES.slice(0, 3).map((n, i) => {
    const id = `${c}-sub-${i + 1}`;
    return { id, student: `${n} (sample)`, project: ["Line follower", "Traffic light", "Rain alarm"][i], submittedAt: new Date(Date.now() - (i + 1) * 3600_000).toISOString(), status: reviews.get(id) ?? "pending" };
  }),
  review: async (_t, id, verdict) => { reviews.set(id, verdict); },
};
const mockValidate: Validate = { certificates: async (s) => ({ issued: seeded(s) % 40, pending: seeded(s) % 7 }) };

/* ---------------- Resolution ---------------- */

function pick<T>(service: NotConnected["service"], urlVar: string, keyVar: string, real: (b: string, k: string) => T, mock: T): T {
  const url = process.env[urlVar];
  const key = process.env[keyVar];
  if (url && key) return real(url.endsWith("/") ? url : url + "/", key);
  if (testProvidersAllowed()) return mock;
  throw new NotConnected(service);
}

export const erp = () => pick("21cschool", "SCHOOL21C_API_URL", "SCHOOL21C_API_KEY", httpErp, mockErp);
export const aadhya = () => pick("AADHYA", "AADHYA_API_URL", "AADHYA_API_KEY", httpAadhya, mockAadhya);
export const validate = () => pick("Validate", "VALIDATE_API_URL", "VALIDATE_API_KEY", httpValidate, mockValidate);

/** Call an integration; return a reason instead of throwing so pages degrade gracefully. */
export async function tryIntegration<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; reason: string }> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof NotConnected) return { ok: false, reason: e.message };
    console.error("integration error", (e as Error).message);
    return { ok: false, reason: "The service didn't respond. Try again in a few minutes." };
  }
}
