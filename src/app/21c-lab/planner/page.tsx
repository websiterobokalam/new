import type { Metadata } from "next";
import { LabPlanner } from "@/components/forms/LabPlanner";
import { approvedClaim, claimText } from "@/lib/claims";

export const metadata: Metadata = {
  title: "Lab Planner",
  alternates: { canonical: "/21c-lab/planner" },
  description: "Tell us your board, classes, students and room. Get a suggested 21C lab setup, curriculum map and rollout plan as a PDF.",
};

export default function PlannerPage() {
  const r = approvedClaim("lab.rollout");
  return (
    <section className="py-12 sm:py-20" style={{ viewTransitionName: "door-hero" }}>
      <div className="wrap max-w-4xl">
        <p className="eyebrow">Lab Planner · 4 short steps</p>
        <h1 className="display-lg mt-3">Plan your 21C lab.</h1>
        <p className="lede mt-3">Board, classes, students, room. You get a suggested setup, a curriculum map and a rollout plan you can save as a PDF.</p>
        <div className="mt-10"><LabPlanner rolloutText={r ? claimText(r) : null} /></div>
      </div>
    </section>
  );
}
