"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "../app/client";
import { FormError } from "../forms/ui";

export function ReferencesForm() {
  const router = useRouter();
  const [err, setErr] = useState<string>();
  return (
    <form className="grid gap-4" noValidate onSubmit={async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const refs = [0, 1].map((i) => ({ name: f.get(`name${i}`), relation: f.get(`rel${i}`), contact: f.get(`contact${i}`) }));
      const r = await post("/api/fellow/references", { refs });
      if (!r.ok) return setErr(r.error);
      router.refresh();
    }}>
      {[0, 1].map((i) => (
        <fieldset key={i} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-3">
          <legend className="px-1 font-semibold">Reference {i + 1}</legend>
          <label className="field"><span className="text-sm">Name</span><input className="input" name={`name${i}`} /></label>
          <label className="field"><span className="text-sm">How they know you</span><input className="input" name={`rel${i}`} /></label>
          <label className="field"><span className="text-sm">Their phone or email</span><input className="input" name={`contact${i}`} /></label>
        </fieldset>
      ))}
      <FormError msg={err} />
      <button className="btn btn-primary justify-self-start">Submit references</button>
    </form>
  );
}
