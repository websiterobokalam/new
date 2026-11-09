import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/learn/catalogue";
import { FeeLine } from "@/components/FeeLine";
import { JsonLd, breadcrumbLd, courseLd } from "@/lib/jsonld";
import { DbDown } from "@/components/app/DbDown";
import { metaClip, OG_IMAGES } from "@/lib/site";

export const dynamic = "force-dynamic";
const LANG: Record<string, string> = { en: "English", te: "Telugu", hi: "Hindi" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getCourse((await params).slug).catch(() => null);
  if (!d) return {};
  const c = d.course;
  const ages = `ages ${c.age_min}${c.age_max ? `–${c.age_max}` : "+"}`;
  const description = metaClip(`${c.outcome.replace(/\.?$/, ".")} ${c.title}: a live Robokalam course for ${ages}, ${c.sessions} classes, from Hyderabad and Warangal.`);
  return { title: c.title, description, alternates: { canonical: `/courses/${c.slug}` }, robots: c.sample ? { index: false } : undefined, openGraph: { type: "website", title: c.title, description, url: `/courses/${c.slug}`, images: OG_IMAGES } };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let d;
  try { d = await getCourse(slug); } catch { return <DbDown />; }
  if (!d) notFound();
  const { course: c, batches } = d;
  return (
    <section className="py-10 sm:py-16">
      {!c.sample && <JsonLd data={courseLd({ name: c.title, description: c.outcome, path: `/courses/${c.slug}`, ageMin: c.age_min, ageMax: c.age_max, feeRupees: c.fee_approved && c.fee_paise ? c.fee_paise / 100 : null })} />}
      {!c.sample && <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }, { name: c.title, path: `/courses/${c.slug}` }])} />}
      <div className="wrap grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="eyebrow">Age {c.age_min}{c.age_max ? `–${c.age_max}` : "+"}{c.programme ? ` · ${c.programme}` : ""}</p>
          <h1 className="display-lg mt-2">{c.title}</h1>
          <p className="lede mt-3">{c.outcome}</p>
          {c.format === "one_to_one" && <p className="mt-3 max-w-2xl rounded-lg bg-leafmist px-4 py-3 text-navy dark:bg-panel-2 dark:text-heading">One-to-one, online and recorded, with you in the loop: an email before and a written summary after every session, and you can join any session. <Link className="font-semibold underline" href="/one-to-one">How it works</Link></p>}
          {c.author_fellow_id && <p className="mt-3 max-w-2xl text-sm text-muted">Written by the Kalamite who teaches it, and reviewed by Robokalam before it was listed: safety, age fit and honest claims. Online, in a small group, and recorded like every class.</p>}
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["Batch", c.format === "one_to_one" ? "One learner" : `Up to ${c.batch_size_max}`], ["Classes", String(c.sessions)], ["Kit", c.kit ?? "None needed"]].map(([k, v]) => <div key={k} className="rounded-2xl bg-panel p-4"><dt className="text-sm text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
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
                  <span className="text-sm"><span className="block font-semibold">{new Date(b.starts_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span><span className="text-muted">{b.mode === "online" ? "Online" : b.location} · {LANG[b.language] ?? b.language}{b.educator_label ? <> · {b.fellow_id ? <Link className="underline" href={`/educators/${b.fellow_id}`}>{b.educator_label}</Link> : b.educator_label}</> : ""}</span></span>
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
