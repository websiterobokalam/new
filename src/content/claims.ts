import { z } from "zod";

/**
 * CLAIMS REGISTER
 * ----------------
 * Every public number or proof statement lives here. A claim renders on the
 * public site ONLY when `approved` is true AND it has a value, definition,
 * as-of date, evidence and owner. Everything else falls back to neutral copy
 * supplied by the component (see <Claim/>), or is hidden.
 *
 * In Phase 1 this file is the source of truth. It maps 1:1 to the "claims"
 * collection in the headless CMS (see docs/PHASE-1.md), so editors can take it
 * over without changing components.
 *
 * Nothing below has been approved. Values marked null are unknown: they were
 * not in the brief and the source sites could not be read from the build
 * environment. Do not fill them from memory. Fill them from evidence.
 */

export const ClaimSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Text shown when approved, e.g. "{value}-day rollout". */
  display: z.string(),
  value: z.union([z.string(), z.number()]).nullable(),
  /** Short unit shown next to big numbers, e.g. "schools". */
  unit: z.string().optional(),
  definition: z.string(),
  asOf: z.string().nullable(),
  evidence: z.string().nullable(),
  owner: z.string().nullable(),
  approved: z.boolean(),
  where: z.array(z.string()),
  notes: z.string().optional(),
  /** Retired claims never render, even if someone flips approved. */
  retired: z.boolean().optional(),
});

export type Claim = z.infer<typeof ClaimSchema>;

const raw: Claim[] = [
  // ---- Lab promises shown on today's robokalam.com (per brief) ----
  {
    id: "lab.rollout",
    label: "Lab rollout time",
    display: "{value}-day rollout",
    value: 20,
    unit: "days",
    definition: "Calendar days from signed order and room-ready confirmation to first class in the lab.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/", "/21c-lab", "/21c-lab/planner"],
    notes: "Shown on today's robokalam.com per brief. Confirm the start event (order date or room-ready date) before approving.",
  },
  {
    id: "lab.instructor",
    label: "Resident certified instructor",
    display: "Resident certified instructor",
    value: "yes",
    definition: "A Robokalam-certified instructor is based at the school for the contracted period.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/21c-lab"],
    notes: "Which packages include it? Who certifies the instructor?",
  },
  {
    id: "lab.roadmap",
    label: "Curriculum roadmap length",
    display: "{value}-year roadmap",
    value: 12,
    unit: "years",
    definition: "Number of school years covered by the published curriculum sequence.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/21c-lab", "/"],
  },
  {
    id: "lab.hardware-sla",
    label: "Hardware replacement time",
    display: "{value}-hour hardware replacement",
    value: 72,
    unit: "hours",
    definition: "Hours from a logged hardware ticket to a working replacement at the school.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/21c-lab"],
    notes: "Needs the SLA measurement: business hours or clock hours, and current on-time rate.",
  },
  {
    id: "curriculum.nep-cbse",
    label: "Curriculum mapping",
    display: "Mapped to NEP 2020 and CBSE",
    value: "mapped",
    definition: "Robokalam has an internal mapping document from each lesson to NEP 2020 and CBSE learning outcomes. Not a certification.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/21c-lab", "/learn"],
  },
  {
    id: "curriculum.cbse-ct-ai",
    label: "CBSE CT and AI mapping, Classes 3 to 8",
    display: "Mapped to CBSE Computational Thinking and AI, Classes 3 to 8",
    value: "mapped",
    definition: "Lesson-level mapping to CBSE CT and AI curriculum for Classes 3 to 8.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/21c-lab"],
    notes: "Brief says: show once verified.",
  },
  // ---- Initiatives and partner names (need permission to name) ----
  {
    id: "initiative.tita",
    label: "Telangana Early Coders with TITA",
    display: "Telangana Early Coders, with TITA",
    value: "named",
    definition: "Programme run with Telangana Information Technology Association.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/", "/stories"],
    notes: "Need written OK from TITA to name them, plus dates and reach numbers for the story.",
  },
  {
    id: "initiative.code-week",
    label: "Ashaers Code Week",
    display: "Ashaers Code Week",
    value: "named",
    definition: "Robokalam's own code week. Needs edition, dates and participation.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/", "/stories", "/events"],
  },
  {
    id: "initiative.code-to-change",
    label: "Code to Change Jr.",
    display: "Code to Change Jr.",
    value: "named",
    definition: "Robokalam initiative. Needs description, dates and outcomes.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/", "/stories"],
  },
  {
    id: "initiative.t-hub",
    label: "Igniting Innovation conference at T-Hub",
    display: "Igniting Innovation, at T-Hub",
    value: "named",
    definition: "Conference hosted at T-Hub, Hyderabad.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    where: ["/", "/events"],
    notes: "Need permission to name T-Hub and the year.",
  },
  // ---- Impact numbers: unknown. Never fill from memory. ----
  ...(
    [
      ["impact.schools", "Partner schools", "schools"],
      ["impact.labs", "Labs installed", "labs"],
      ["impact.learners", "Learners taught", "learners"],
      ["impact.teachers", "Teachers trained", "teachers"],
      ["impact.projects", "Projects built", "projects"],
      ["impact.states", "States reached", "states"],
    ] as const
  ).map(
    ([id, label, unit]): Claim => ({
      id,
      label,
      display: "{value}",
      value: null,
      unit,
      definition: "Definition needed: what counts, and over what period.",
      asOf: null,
      evidence: null,
      owner: null,
      approved: false,
      where: ["/", "/impact", "/21c-lab"],
    }),
  ),
  // ---- Policy defaults from the brief, shown publicly once confirmed ----
  {
    id: "fellows.hours-cap",
    label: "Term-time weekly hours cap",
    display: "{value} hours a week during term",
    value: 15,
    unit: "hours",
    definition: "Default maximum teaching hours a Fellow can accept per week during college term.",
    asOf: null,
    evidence: "Brief v2, section 11 (placeholder value)",
    owner: null,
    approved: false,
    where: ["/fellows"],
  },
  {
    id: "fellows.own-course-share",
    label: "Fellow share of own-course fees",
    display: "You keep {value}% of fees",
    value: 70,
    unit: "%",
    definition: "Share of learner fees (after GST and payment charges) paid to the Fellow for an approved Fellow's Own Course.",
    asOf: null,
    evidence: "Brief v2, section 11 (placeholder value)",
    owner: null,
    approved: false,
    where: ["/fellows", "/fellows/earnings"],
    notes: "Confirm whether the % is of gross or net fees.",
  },
  {
    id: "safety.recording-retention",
    label: "Class recording retention",
    display: "Kept for {value} days",
    value: 30,
    unit: "days",
    definition: "Days an online class recording is kept before deletion, unless held for an open safety case.",
    asOf: null,
    evidence: "Brief v2, section 11 (placeholder value)",
    owner: null,
    approved: false,
    where: ["/fellows/safety", "/child-safety"],
  },
  // ---- Retired: must never render ----
  {
    id: "retired.soc2",
    label: "SOC 2 language",
    display: "SOC 2",
    value: null,
    definition: "Removed: no audit report on file.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    retired: true,
    where: [],
    notes: "Brief: remove SOC 2 language without an audit report.",
  },
  {
    id: "retired.no1",
    label: "\"India's No.1\" and similar",
    display: "",
    value: null,
    definition: "Banned superlatives unless independently proven.",
    asOf: null,
    evidence: null,
    owner: null,
    approved: false,
    retired: true,
    where: [],
  },
];

export const claims: Claim[] = raw.map((c) => ClaimSchema.parse(c));
