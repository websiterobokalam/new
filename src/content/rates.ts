/**
 * Fellow rate card. ALL VALUES PENDING ({{rate card}} in the brief).
 * The earnings calculator shows the formula and the inputs, and only shows
 * rupee estimates once `approved` is true and every rate is filled in.
 */
export const rateCard = {
  approved: false,
  asOf: null as string | null,
  rates: [
    { gig: "Live Batch", perSession: null as number | null, minutes: null as number | null },
    { gig: "Campus Session", perSession: null as number | null, minutes: null as number | null },
    { gig: "Weekend Workshop", perSession: null as number | null, minutes: null as number | null },
    { gig: "Doubt Desk", perSession: null as number | null, minutes: null as number | null },
    { gig: "Project Mentor", perSession: null as number | null, minutes: null as number | null },
  ],
  /** Deductions shown before a gig is accepted. Percent of gross. */
  deductions: [
    { name: "TDS (if applicable)", percent: null as number | null },
    { name: "Payment processing", percent: null as number | null },
  ],
};

export function estimateWeekly(perSession: number, sessions: number, deductionPercents: number[]) {
  const gross = perSession * sessions;
  const ded = deductionPercents.reduce((a, p) => a + (gross * p) / 100, 0);
  return { gross, deductions: Math.round(ded), net: Math.round(gross - ded) };
}
