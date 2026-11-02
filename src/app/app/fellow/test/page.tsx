import Link from "next/link";
import { fellowContext } from "@/lib/fellows/context";
import { subjectTests, presentQuiz } from "@/content/fellows/subject-tests";
import { Quiz } from "@/components/fellow/Quiz";

export const metadata = { title: "Subject test" };
const NAME: Record<string, string> = { robotics: "Robotics", iot: "IoT", ai: "AI", coding: "Coding", finlit: "Financial Literacy", space: "Space" };

export default async function TestPage({ searchParams }: { searchParams: Promise<{ world?: string }> }) {
  const { fellow, steps } = await fellowContext("/app/fellow/test");
  const st = steps.subject_test;
  const world = (await searchParams).world ?? fellow.worlds[0];
  return (
    <section className="py-10"><div className="wrap max-w-3xl grid gap-6">
      <header><p className="eyebrow">Step 1 · Subject test</p><h1 className="display-lg mt-2">Show what you know.</h1>
        <p className="lede mt-2">5 questions in one of your worlds. Pass with 4 of 5. Two attempts; after that a person reviews.</p></header>
      {st.status === "passed" ? <p className="card p-6 text-lg font-semibold">Passed. <Link className="text-link underline" href="/app/fellow">Back to your path</Link></p>
        : st.status === "failed" ? <p className="card p-6">Both attempts used. Our team will review and contact you.</p> : (
        <>
          <nav aria-label="Choose a world" className="flex flex-wrap gap-2">{fellow.worlds.filter((w) => subjectTests[w]).map((w) => <Link key={w} href={`?world=${w}`} className="chip" aria-current={w === world ? "true" : undefined}>{NAME[w]}</Link>)}</nav>
          <Quiz url="/api/fellow/test" fixed={{ world }} questions={presentQuiz(subjectTests[world], world.length)} submit="Submit test" onPassHref="/app/fellow" />
        </>
      )}
    </div></section>
  );
}
