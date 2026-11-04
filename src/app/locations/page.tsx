import type { Metadata } from "next";
import Link from "next/link";
import { cityList } from "@/content/cities";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Locations: Hyderabad, Warangal and online across India",
  description: "Where Robokalam works: head office at T-Hub Hyderabad, classes and school labs in Hyderabad and Warangal, and live online classes across India.",
  alternates: { canonical: "/locations" },
};

export default function Locations() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Locations", path: "/locations" }])} />
      <section className="py-12 sm:py-20">
        <div className="wrap">
          <p className="eyebrow">Locations</p>
          <h1 className="display-xl mt-3 max-w-4xl">Robokalam near you.</h1>
          <p className="lede mt-4 max-w-3xl">Head office at T-Hub, Hyderabad. Live classes online for every family in India, and school labs across Telangana.</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {cityList.map((c) => (
              <li key={c.id} className="flex">
                <Link href={`/locations/${c.id}`} className="solution-card flex w-full flex-col p-8">
                  <p className="eyebrow !text-xs">{c.region}</p>
                  <h2 className="mt-2 text-3xl font-bold text-heading">{c.name} <span lang="te" className="text-xl font-semibold text-muted">{c.te}</span></h2>
                  <p className="mt-3 text-muted">{c.lede}</p>
                  <p className="mt-auto pt-4 font-semibold text-link">Robokalam in {c.name} →</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
