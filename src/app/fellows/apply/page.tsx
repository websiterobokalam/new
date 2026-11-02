import type { Metadata } from "next";
import { FellowApplyForm } from "@/components/forms/LeadForms";

export const metadata: Metadata = { title: "Apply to Kalam Fellows", description: "Join the Kalam Fellows waitlist. For college students aged 18+." };

export default function ApplyPage() {
  return (
    <section className="py-12 sm:py-20" style={{ viewTransitionName: "door-hero" }}>
      <div className="wrap max-w-3xl">
        <p className="eyebrow">Kalam Fellows · pilot waitlist</p>
        <h1 className="display-lg mt-3">Become a Fellow.</h1>
        <p className="lede mt-3">Two minutes now. Phone OTP, subject test and a recorded demo come next, when your pilot batch opens.</p>
        <div className="mt-10"><FellowApplyForm /></div>
      </div>
    </section>
  );
}
