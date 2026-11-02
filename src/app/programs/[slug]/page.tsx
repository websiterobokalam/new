import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { programmes } from "@/content/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return programmes.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = programmes.find((x) => x.slug === slug);
  return { title: p ? `${p.name}${p.age ? ` (${p.age}+)` : ""}` : undefined, description: p?.outcome };
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = programmes.find((x) => x.slug === slug);
  if (!p) notFound();
  const pending = ["Junior and Senior split", "Levels 1 to 3", "What you build", "Schedule", "Fee", "Kit", "Syllabus", "Refund terms", "One honest sample class"];
  return (
    <section className="py-12 sm:py-20">
      <div className="wrap max-w-4xl">
        <p className="eyebrow">{p.age ? `Ashaer track · age ${p.age}+` : "Programme"}</p>
        <h1 className="display-lg mt-3">{p.name}</h1>
        <p className="lede mt-4">{p.outcome}</p>
        <div className="mt-8 rounded-[var(--radius-card)] border-2 border-dashed border-line p-6">
          <p className="font-semibold text-heading">Full programme page ships in Phase 2 with:</p>
          <ul className="mt-3 flex flex-wrap gap-2">{pending.map((x) => <li key={x} className="rounded-full bg-panel px-3 py-1 text-sm">{x}</li>)}</ul>
        </div>
        <Link href="/learn#book" className="btn btn-primary mt-8">Book a Free Build Session</Link>
      </div>
    </section>
  );
}
