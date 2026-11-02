import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { planned } from "@/content/planned";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(planned).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = planned[(await params).slug];
  return { title: p?.title, description: p?.line, robots: { index: false } };
}

export default async function PlannedPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = planned[(await params).slug];
  if (!p) notFound();
  return (
    <section className="py-16 sm:py-28">
      <div className="wrap max-w-3xl">
        <p className="eyebrow">Coming in Phase {p.phase}</p>
        <h1 className="display-lg mt-3">{p.title}</h1>
        <p className="lede mt-4">{p.line}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {p.cta && <Link href={p.cta.href} className="btn btn-primary">{p.cta.label}</Link>}
          <Link href="/" className="btn btn-ghost">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
