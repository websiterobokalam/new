import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FellowApply } from "@/components/fellow/FellowApply";
import { currentAccount } from "@/lib/auth/session";
import { PILOT } from "@/lib/fellows/core";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Apply to Kalam Fellows", description: "Apply to teach as a Kalam Fellow. For college students aged 18+." };

export default async function ApplyPage() {
  const a = await currentAccount().catch(() => null);
  if (a?.role === "fellow") redirect("/app/fellow");
  return (
    <section className="py-12 sm:py-20" style={{ viewTransitionName: "door-hero" }}>
      <div className="wrap max-w-3xl">
        <p className="eyebrow">Kalam Fellows · {PILOT.city} pilot</p>
        <h1 className="display-lg mt-3">Become a Fellow.</h1>
        <p className="lede mt-3">Two minutes now. Then a subject test, a short recorded demo, safety checks and paid Kalam Academy training. No fees, ever.</p>
        <div className="mt-10"><FellowApply signedIn={!!a} pilotCity={PILOT.city} /></div>
      </div>
    </section>
  );
}
