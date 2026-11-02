import { notFound } from "next/navigation";
import { fellowContext } from "@/lib/fellows/context";
import { academy } from "@/content/fellows/academy";
import { presentQuiz } from "@/content/fellows/subject-tests";
import { Quiz } from "@/components/fellow/Quiz";

export const metadata = { title: "Academy module" };

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await fellowContext(`/app/fellow/academy/${id}`);
  const m = academy.find((x) => x.id === id);
  if (!m) notFound();
  return (
    <section className="py-10"><div className="wrap max-w-3xl grid gap-6">
      <header><p className="eyebrow">Kalam Academy · {m.minutes} min</p><h1 className="display-lg mt-2">{m.title}</h1></header>
      <ul className="card grid gap-3 p-6">{m.points.map((p) => <li key={p} className="flex gap-3"><span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-aqua" />{p}</li>)}</ul>
      <h2 className="display-md">Check your understanding</h2>
      <Quiz url="/api/fellow/academy" fixed={{ moduleId: m.id }} questions={presentQuiz(m.quiz, m.id.length)} submit="Submit answers" onPassHref="/app/fellow/academy" />
    </div></section>
  );
}
