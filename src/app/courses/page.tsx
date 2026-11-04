import type { Metadata } from "next";
import Link from "next/link";
import { listCourses, type Filters } from "@/lib/learn/catalogue";
import { FeeLine } from "@/components/FeeLine";
import { worlds } from "@/content/site";
import { DbDown } from "@/components/app/DbDown";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Courses", description: "Find a Robokalam course by age, world, language, online or offline, and time." };

const LANG: Record<string, string> = { en: "English", te: "Telugu", hi: "Hindi" };
const WORLD_KEYS: Record<string, string> = { "financial-literacy": "finlit" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const sp = await searchParams;
  const f: Filters = { ...sp, world: sp.world ? (WORLD_KEYS[sp.world] ?? sp.world) : undefined };
  let courses;
  try { courses = await listCourses(f); } catch { return <DbDown />; }
  const sel = (name: keyof Filters, label: string, opts: [string, string][]) => (
    <label className="field min-w-0"><span className="text-sm">{label}</span>
      <select name={name} defaultValue={f[name] ?? ""} className="input">
        <option value="">Any</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
  return (
    <section className="py-10 sm:py-16">
      <div className="wrap grid gap-8">
        <header>
          <p className="eyebrow">Courses</p>
          <h1 className="display-lg mt-2">Find a course.</h1>
          <p className="lede mt-2">Small live batches. Every course ends with something your child built.</p>
        </header>
        <form className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6" method="get" role="search" aria-label="Filter courses">
          {sel("age", "Age", [["6-8", "6–8"], ["9-11", "9–11"], ["12-14", "12–14"], ["15-17", "15–17"]])}
          {sel("world", "World", worlds.map((w) => [w.id, w.name]))}
          {sel("lang", "Language", [["en", "English"], ["te", "Telugu"], ["hi", "Hindi"]])}
          {sel("mode", "Where", [["online", "Online"], ["offline", "At a centre"]])}
          {sel("time", "Time", [["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]])}
          <div className="flex items-end gap-2"><button className="btn btn-primary w-full">Filter</button></div>
        </form>
        {courses.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-xl font-bold text-heading">No courses match these filters yet.</p>
            <p className="mt-2 text-muted">Try fewer filters, or start with a Free Build Session.</p>
            <div className="mt-4 flex justify-center gap-3"><Link href="/courses" className="btn btn-ghost">Clear filters</Link><Link href="/learn/build-session" className="btn btn-primary">Book a Free Build Session</Link></div>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <li key={c.id} className="card flex flex-col p-6">
                <p className="text-sm font-semibold text-link">Age {c.age_min}{c.age_max ? `–${c.age_max}` : "+"} · {worlds.find((w) => w.id === c.world)?.name}</p>
                <h2 className="mt-1 text-xl font-bold">{c.title}</h2>
                {c.format === "one_to_one" && <p className="mt-1 text-sm font-semibold text-heading">One-to-one · online · <Link className="underline" href="/one-to-one">parent-supervised</Link></p>}
                {c.programme === "Fellow's Own Course" && <p className="mt-1 text-sm font-semibold text-heading">Fellow&apos;s Own Course · reviewed by Robokalam</p>}
                <p className="mt-2 text-muted">{c.outcome}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div><dt className="text-muted">Batch</dt><dd className="font-semibold">{c.format === "one_to_one" ? "One learner" : `Up to ${c.batch_size_max}`}</dd></div>
                  <div><dt className="text-muted">Classes</dt><dd className="font-semibold">{c.sessions}</dd></div>
                  <div><dt className="text-muted">Next start</dt><dd className="font-semibold">{c.next_start ? new Date(c.next_start).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }) : "To be scheduled"}</dd></div>
                  <div><dt className="text-muted">Language</dt><dd className="font-semibold">{c.languages.map((l) => LANG[l] ?? l).join(", ") || "—"}</dd></div>
                  <div><dt className="text-muted">Educator</dt><dd className="font-semibold">{c.educator ?? "Assigned soon"}</dd></div>
                  <div><dt className="text-muted">Kit</dt><dd className="font-semibold">{c.kit ?? "None needed"}</dd></div>
                  <div className="col-span-2"><dt className="text-muted">Fee</dt><dd className="font-semibold text-heading"><FeeLine fee={c.fee_paise} approved={c.fee_approved} sample={c.sample} /></dd></div>
                </dl>
                <Link href={`/courses/${c.slug}`} className="btn btn-primary mt-5 self-start">See times</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
