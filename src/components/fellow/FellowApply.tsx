"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OtpFlow } from "../app/OtpFlow";
import { Check, Chips, Field, FormError, WORLD_OPTIONS } from "../forms/ui";
import { post } from "../app/client";

export function FellowApply({ signedIn, pilotCity }: { signedIn: boolean; pilotCity: string }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(signedIn);
  const [worlds, setWorlds] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>(["en"]);
  const [year, setYear] = useState("2");
  const [age, setAge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ msg?: string; fields?: Record<string, string> }>({});

  if (!authed) return (
    <div className="card grid gap-3 p-5 sm:p-8">
      <h2 className="display-md">Verify your phone</h2>
      <p className="text-muted">Your own number. We use it to log you in and pay you.</p>
      <OtpFlow askAdult={false} cta="Send code" phoneLabel="Your mobile number" onDone={() => setAuthed(true)} />
    </div>
  );

  return (
    <form className="card grid gap-5 p-5 sm:p-8" noValidate onSubmit={async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      setBusy(true);
      const r = await post<{ status: string }>("/api/fellow/apply", {
        fullName: f.get("fullName"), college: f.get("college"), course: f.get("course"), year, collegeEmail: f.get("collegeEmail"),
        worlds, languages: langs, hoursPerWeek: f.get("hours"), city: f.get("city"), ageConfirmed: age,
      });
      setBusy(false);
      if (!r.ok) return setErr({ msg: r.error, fields: r.fields });
      router.push("/app/fellow"); router.refresh();
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name (as on your ID)" name="fullName" autoComplete="name" error={err.fields?.fullName} />
        <Field label="City" name="city" defaultValue={pilotCity} error={err.fields?.city} hint={`The pilot runs in ${pilotCity} first. Elsewhere, you join the waitlist.`} />
        <Field label="College" name="college" error={err.fields?.college} />
        <Field label="Course or branch" name="course" error={err.fields?.course} />
        <Field label="College email (optional, speeds up checks)" name="collegeEmail" type="email" error={err.fields?.collegeEmail} />
        <Field label="Hours a week you could teach" name="hours" type="number" inputMode="numeric" defaultValue={6} error={err.fields?.hoursPerWeek} />
      </div>
      <Chips legend="Year of study" name="year" value={year} onChange={(v) => setYear(v as string)} options={["1", "2", "3", "4", "5", "PG", "Graduated"].map((v) => ({ value: v, label: v }))} />
      <Chips legend="Worlds you can teach" name="worlds" type="checkbox" value={worlds} onChange={(v) => setWorlds(v as string[])} options={WORLD_OPTIONS} error={err.fields?.worlds} />
      <Chips legend="Languages you teach in" name="langs" type="checkbox" value={langs} onChange={(v) => setLangs(v as string[])} options={[["en", "English"], ["te", "Telugu"], ["hi", "Hindi"]].map(([v, l]) => ({ value: v, label: l }))} />
      <Check name="age" checked={age} onChange={setAge} error={err.fields?.ageConfirmed}>I am 18 or older.</Check>
      <FormError msg={err.msg} />
      <button className="btn btn-primary justify-self-start" disabled={busy}>{busy ? "Sending…" : "Start my application"}</button>
    </form>
  );
}
