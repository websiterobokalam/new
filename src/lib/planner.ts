/**
 * Lab Planner logic. Pure and unit-tested. Every rule-of-thumb constant is
 * named, labelled as an assumption on screen, and needs sign-off by the
 * schools team (open question in the Phase 1 review).
 */
export const ASSUMPTIONS = {
  learnersPerBench: 4,
  sqftPerLearner: 25,
  labPeriodsPerWeek: 36, // 6 days × 6 periods
  periodsPerSectionPerWeek: 1,
};

export type PlannerInput = {
  board: string;
  classFrom: number; // 1..12
  classTo: number;
  students: number; // total across those classes
  sectionSize: number; // learners per class section
  roomSqft: number | null;
};

const PROGRAMMES = [
  { name: "Electro Ashaers", minAge: 6 },
  { name: "Robo Ashaers", minAge: 7 },
  { name: "CODO Ashaers", minAge: 8 },
  { name: "Advance Ashaers", minAge: 9 },
];

/** Class n is roughly age n + 5. */
export const ageForClass = (c: number) => c + 5;

export function planLab(i: PlannerInput) {
  const from = Math.max(1, Math.min(12, Math.min(i.classFrom, i.classTo)));
  const to = Math.max(1, Math.min(12, Math.max(i.classFrom, i.classTo)));
  const bands: { classes: string; programme: string; worlds: string[] }[] = [];
  for (let c = from; c <= to; c++) {
    const age = ageForClass(c);
    const prog = [...PROGRAMMES].reverse().find((p) => age >= p.minAge)?.name ?? "Electro Ashaers";
    const worlds = c <= 3 ? ["Robotics", "Coding"] : c <= 6 ? ["Robotics", "Coding", "IoT", "Financial Literacy", "Space"] : ["Robotics", "Coding", "IoT", "AI", "Financial Literacy", "Space"];
    const last = bands[bands.length - 1];
    if (last && last.programme === prog && last.worlds.join() === worlds.join()) {
      last.classes = `${last.classes.split("–")[0]}–${c}`;
    } else bands.push({ classes: String(c), programme: prog, worlds });
  }
  const section = Math.max(1, Math.round(i.sectionSize));
  const benches = Math.ceil(section / ASSUMPTIONS.learnersPerBench);
  const sqftNeeded = section * ASSUMPTIONS.sqftPerLearner;
  const sections = Math.ceil(Math.max(1, i.students) / section);
  const periods = sections * ASSUMPTIONS.periodsPerSectionPerWeek;
  const labsNeeded = Math.ceil(periods / ASSUMPTIONS.labPeriodsPerWeek);
  const room = i.roomSqft == null ? "unknown" : i.roomSqft >= sqftNeeded ? "fits" : "tight";
  const span = to - from + 1;
  const profile = from <= 5 && to >= 8 ? "Full-span lab" : to <= 5 ? "Foundation lab" : "Senior lab";
  return { from, to, bands, benches, sqftNeeded, sections, periods, labsNeeded, room, profile, span };
}
