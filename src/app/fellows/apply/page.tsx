import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FellowApply } from "@/components/fellow/FellowApply";
import { currentAccount } from "@/lib/auth/session";
import { PILOT } from "@/lib/fellows/core";
import { system } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Apply to Kalam Fellows", description: "Apply to teach as a Kalam Fellow. For college students aged 18+." };

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const a = await currentAccount().catch(() => null);
  if (a?.role === "fellow") redirect("/app/fellow");
  const ref = (await searchParams).ref;
  const d = await system(async (c) => ({
    cities: (await c.query("SELECT name FROM cities WHERE status IN ('pilot','open') ORDER BY status = 'open', name")).rows.map((r) => r.name as string),
    colleges: (await c.query("SELECT co.name FROM colleges co ORDER BY co.name")).rows.map((r) => r.name as string),
  })).catch(() => ({ cities: [PILOT.city], colleges: [] as string[] }));
  const cities = d.cities.length ? d.cities : [PILOT.city];
  return (
    <section className="py-12 sm:py-20" style={{ viewTransitionName: "door-hero" }}>
      <div className="wrap max-w-3xl">
        <p className="eyebrow">Kalam Fellows · {cities.length > 1 ? `open in ${cities.join(", ")}` : `${cities[0]} pilot`}</p>
        <h1 className="display-lg mt-3">Become a Fellow.</h1>
        <p className="lede mt-3">Two minutes now. Then a subject test, a short recorded demo, safety checks and paid Kalam Academy training. No fees, ever.</p>
        <div className="mt-10"><FellowApply signedIn={!!a} pilotCity={cities[0]} openCities={cities} colleges={d.colleges} referral={ref && /^[A-Za-z0-9]{4,12}$/.test(ref) ? ref : undefined} /></div>
      </div>
    </section>
  );
}
