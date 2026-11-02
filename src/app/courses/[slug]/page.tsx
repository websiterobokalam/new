import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/learn/catalogue";
import { FeeLine } from "@/components/FeeLine";
import { JsonLd } from "@/lib/jsonld";
import { SITE } from "@/lib/site";
import { DbDown } from "@/components/app/DbDown";

export const dynamic = "force-dynamic";
const LANG: Record<string, string> = { en: "English", te: "Telugu", hi: "Hindi" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getCourse((await params).slug).catch(() => null);
  return d ? { title: d.course.title, description: d.course.outcome } : {};
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let d;
  try { d = await getCourse(slug); } catch { return <DbDown />; }
  if (!d) notFound();
  const { course: c, batches } = d;
  return (
    <section className="py-10 sm:py-16">
      {!c.sample && <JsonLd data={{ "@context": "https://schema.org", "@type": "Course", name: c.title, description: c.outcome, provider: { "@type": "Organization", name: SITE.name, url: SITE.url } }} />}
      <div className="wrap grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="eyebrow">Age {c.age_min}{c.age_max ? `–${c.age_max}` : "+"}{c.programme ? ` · ${c.programme}` : ""}</p>
          <h1 className="display-lg mt-2">{c.title}</h1>
          <p className="lede mt-3">{c.outcome}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["Batch", `Up to ${c.batch_size_max}`], ["Classes", String(c.sessions)], ["Kit", c.kit ?? "None needed"]].map(([k, v]) => <div key={k} className="rounded-2xl bg-panel p-4"><dt className="text-sm text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
            <div className="rounded-2xl bg-panel p-4"><dt className="text-sm text-muted">Fee</dt><dd className="font-semibold"><FeeLine fee={c.fee_paise} approved={c.fee_approved} sample={c.sample} /></dd></div>
          </dl>
          <p className="mt-6 text-sm text-muted">Online classes are recorded on the platform for safety. All contact stays on Robokalam. <Link className="underline" href="/app/orders">Refund terms</Link></p>
        </div>
        <aside className="card self-start p-6">
          <h2 className="text-xl font-bold">Upcoming times</h2>
          {batches.length === 0 ? <p className="mt-2 text-muted">No times open right now.</p> : (
            <ul className="mt-3 grid gap-2">
              {batches.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                  <span className="text-sm"><span className="block font-semibold">{new Date(b.starts_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span><span className="text-muted">{b.mode === "online" ? "Online" : b.location} · {LANG[b.language] ?? b.language}</span></span>
                  <Link href={`/app/book/${b.id}`} className="btn btn-primary !min-h-10 !px-4 text-sm">Book</Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
