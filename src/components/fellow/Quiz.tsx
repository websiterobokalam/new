"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "../app/client";

/** Quiz used by the subject test and Kalam Academy modules. Grading happens on the server. */
export function Quiz({ url, questions, fixed, submit, onPassHref }: { url: string; questions: { q: string; options: { value: number; label: string }[] }[]; fixed: Record<string, unknown>; submit: string; onPassHref: string }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [res, setRes] = useState<{ passed: boolean; text: string }>();
  const [busy, setBusy] = useState(false);
  return (
    <form className="grid gap-5" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await post<{ passed: boolean; correct?: number; total?: number; score?: number; attemptsLeft?: number; academyDone?: boolean }>(url, { ...fixed, answers });
      setBusy(false);
      if (!r.ok) return setRes({ passed: false, text: r.error ?? "Could not submit" });
      setRes({ passed: r.passed, text: r.passed ? "Passed. Nice work." : `Not this time${r.correct != null ? ` (${r.correct}/${r.total})` : ""}.${r.attemptsLeft ? ` You have ${r.attemptsLeft} more attempt.` : " Read the points again and retry."}` });
      if (r.passed) setTimeout(() => { router.push(onPassHref); router.refresh(); }, 900);
    }}>
      {questions.map((q, qi) => (
        <fieldset key={qi} className="card grid gap-2 p-4">
          <legend className="px-1 font-semibold text-heading">{qi + 1}. {q.q}</legend>
          {q.options.map((o) => (
            <label key={o.value} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-panel">
              <input type="radio" name={`q${qi}`} className="h-5 w-5 accent-[var(--color-navy)]" checked={answers[qi] === o.value} onChange={() => setAnswers(answers.map((a, i) => (i === qi ? o.value : a)))} />
              {o.label}
            </label>
          ))}
        </fieldset>
      ))}
      {res && <p role="status" className={`rounded-xl p-3 font-semibold ${res.passed ? "bg-leafmist text-navy" : "bg-[#FEEBD0] text-[#6B3F00]"}`}>{res.text}</p>}
      <button className="btn btn-primary justify-self-start" disabled={busy || answers.includes(-1)}>{busy ? "Checking…" : submit}</button>
    </form>
  );
}
