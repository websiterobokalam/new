import { fellowContext } from "@/lib/fellows/context";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Recorded demo" };

export default async function DemoPage() {
  const { steps } = await fellowContext("/app/fellow/demo");
  const st = steps.demo;
  return (
    <section className="py-10"><div className="wrap max-w-3xl grid gap-6">
      <header><p className="eyebrow">Step 2 · Recorded demo</p><h1 className="display-lg mt-2">Teach us for 10 minutes.</h1>
        <p className="lede mt-2">Record a short lesson for a 9 to 11 year old on any topic in your worlds. No children in the video. Upload it as a private or unlisted link and paste it here. Paid once reviewed.</p></header>
      <ul className="card list-disc p-6 pl-10 text-muted"><li>Open with what we will build.</li><li>Explain one idea with an everyday example.</li><li>Ask at least two questions as if learners were there.</li><li>End with a plain next step.</li></ul>
      {st.status === "passed" ? <p className="card p-6 font-semibold">Demo accepted.</p> : st.status === "submitted" ? <p className="card p-6">Submitted. A reviewer scores it on the same rubric we use for classes.</p> : (
        <div className="card p-6"><JsonForm url="/api/fellow/demo" redirect="/app/fellow" submit="Submit demo" fields={[{ name: "topic", label: "Topic" }, { name: "url", label: "Private video link", type: "url" }]} /></div>
      )}
    </div></section>
  );
}
