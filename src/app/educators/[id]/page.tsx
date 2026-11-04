import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { anon } from "@/lib/db";
import { KalamBot } from "@/components/art/Small";
import { DbDown } from "@/components/app/DbDown";
import { FELLOW_PROFILES } from "@/lib/fellows/profiles";
import { tierLabel } from "@/lib/fellows/gigs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };
const NAME: Record<string, string> = { robotics: "Robotics", iot: "IoT", ai: "AI", coding: "Coding", finlit: "Financial Literacy", space: "Space" };
const LANG: Record<string, string> = { en: "English", te: "Telugu", hi: "Hindi" };
const BADGE: Record<string, string> = { identity: "ID verified", background: "Background checked", academy: "Kalam Academy + child safety", subject_test: "Subject tested" };

/** Public profile of a live Kalamite: no contact details, ever. */
export default async function EducatorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  let d;
  try {
    d = await anon(async (c) => {
      const p = (await c.query(`SELECT * FROM (${FELLOW_PROFILES}) fp WHERE fp.id = $1`, [id])).rows[0];
      if (!p) return null;
      const reviews = (await c.query("SELECT rating, body, created_at FROM reviews WHERE fellow_id = $1 AND NOT hidden ORDER BY created_at DESC LIMIT 10", [id])).rows;
      return { p, reviews };
    });
  } catch { return <DbDown />; }
  if (!d) notFound();
  const { p, reviews } = d;
  return (
    <section className="py-12"><div className="wrap grid max-w-3xl gap-6">
      <header className="flex items-center gap-4"><KalamBot className="h-16 w-16" /><div><p className="eyebrow">{tierLabel(p.tier)}</p><h1 className="display-lg">{p.display_name}</h1><p className="text-muted">{p.college}</p></div></header>
      <ul className="flex flex-wrap gap-2" aria-label="Verified">{p.verified.map((v: string) => <li key={v} className="rounded-full bg-leafmist px-3 py-1 text-sm font-semibold text-navy">✓ {BADGE[v] ?? v}</li>)}</ul>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4"><dt className="text-sm text-muted">Teaches</dt><dd className="font-semibold">{p.worlds.map((w: string) => NAME[w] ?? w).join(", ")}</dd></div>
        <div className="card p-4"><dt className="text-sm text-muted">Languages</dt><dd className="font-semibold">{p.languages.map((l: string) => LANG[l] ?? l).join(", ")}</dd></div>
        <div className="card p-4"><dt className="text-sm text-muted">Teaching hours</dt><dd className="font-semibold">{p.hours_taught}</dd></div>
      </dl>
      <section className="card p-6">
        <h2 className="text-xl font-bold">Verified parent reviews {p.rating ? `· ${p.rating}/5 from ${p.review_count}` : ""}</h2>
        <p className="text-sm text-muted">Only parents whose child attended a session with this Kalamite can review.</p>
        {reviews.length === 0 ? <p className="mt-3 text-muted">No reviews yet.</p> : <ul className="mt-3 grid gap-3">{reviews.map((r, i) => <li key={i}><span className="text-[#D9870A]" aria-label={`${r.rating} of 5`}>{"★".repeat(r.rating)}</span> {r.body}</li>)}</ul>}
      </section>
    </div></section>
  );
}
