import { z } from "zod";

/** Indian mobile (10 digits starting 6-9, optional +91/0) or E.164 international. */
export const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()-]/g, ""))
  .refine((s) => /^(?:\+91|0)?[6-9]\d{9}$/.test(s) || /^\+[1-9]\d{7,14}$/.test(s), "Enter a valid mobile number")
  .transform((s) => (s.startsWith("+") ? s : `+91${s.replace(/^0/, "").slice(-10)}`));

const name = z.string().trim().min(2, "Please enter a name").max(80);
const email = z.string().trim().toLowerCase().email("Enter a valid email").max(120);
const region = z.enum(["ts-ap", "india", "intl"]).default("ts-ap");
/** Explicit opt-in to be contacted. Required: no call without opt-in. */
const contactOptIn = z.literal(true, { message: "Please agree so we can contact you" });
const worldsEnum = z.enum(["robotics", "iot", "ai", "finlit", "space", "coding"]);

export const LearnerLead = z.object({
  door: z.literal("learner"),
  parentName: name,
  phone,
  /** Optional: for a confirmation email. Never the child's. */
  email: email.optional().or(z.literal("").transform(() => undefined)),
  /** Age band only, never date of birth. */
  childAgeBand: z.enum(["6-8", "9-11", "12-14", "15-17", "18+"]),
  interest: worldsEnum,
  language: z.enum(["English", "Telugu", "Hindi"]).default("English"),
  mode: z.enum(["online", "offline", "either"]).default("online"),
  region,
  contactOptIn,
  followUpOptIn: z.boolean().default(false),
});

export const SchoolLead = z.object({
  door: z.literal("school"),
  name,
  role: z.enum(["Principal", "Correspondent or owner", "Teacher", "CSR or foundation", "Government", "Other"]),
  institution: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(60),
  board: z.enum(["CBSE", "ICSE", "State board", "IB", "Cambridge", "College", "Other"]),
  students: z.coerce.number().int().min(1).max(20000),
  phone,
  email: email.optional().or(z.literal("").transform(() => undefined)),
  preferredTime: z.enum(["Morning", "Afternoon", "Evening"]).default("Morning"),
  region,
  contactOptIn,
  plan: z.record(z.string(), z.unknown()).optional(),
});

export const EducatorLead = z.object({
  door: z.literal("educator"),
  name,
  phone,
  email,
  college: z.string().trim().min(2).max(120),
  course: z.string().trim().min(2).max(80),
  year: z.enum(["1", "2", "3", "4", "5", "PG", "Graduated"]),
  ageConfirmed: z.literal(true, { message: "Kalamites must be 18 or older" }),
  worlds: z.array(worldsEnum).min(1, "Pick at least one world"),
  hoursPerWeek: z.coerce.number().int().min(1).max(40),
  city: z.string().trim().min(2).max(60),
  languages: z.array(z.enum(["English", "Telugu", "Hindi"])).min(1),
  region,
  contactOptIn,
});

export const Lead = z.discriminatedUnion("door", [LearnerLead, SchoolLead, EducatorLead]);
export type LeadInput = z.input<typeof Lead>;
export type LeadData = z.output<typeof Lead>;

/** Which CRM queue a lead goes to. Contact pages reuse this ("route by door"). */
export function routeFor(lead: LeadData): { queue: string; envKey: string } {
  switch (lead.door) {
    case "learner":
      return { queue: "learner-build-session", envKey: "CRM_WEBHOOK_LEARNER" };
    case "school":
      return lead.plan ? { queue: "school-lab-planner", envKey: "CRM_WEBHOOK_SCHOOL" } : { queue: "school-demo", envKey: "CRM_WEBHOOK_SCHOOL" };
    case "educator":
      return { queue: "fellow-waitlist", envKey: "CRM_WEBHOOK_EDUCATOR" };
  }
}

/** Mask phone numbers in logs. */
export function maskPhone(p: string) {
  return p.slice(0, 4) + "******" + p.slice(-2);
}
