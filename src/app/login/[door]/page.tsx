import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { doors, type DoorId } from "@/content/site";
import { Suspense } from "react";
import { OtpLogin } from "@/components/forms/OtpLogin";
import { LearnerLogin } from "@/components/app/LearnerLogin";

export const dynamicParams = false;
export function generateStaticParams() {
  return doors.map((d) => ({ door: d.id }));
}
export const metadata: Metadata = { robots: { index: false } };

const copy: Record<DoorId, { title: string; who: string; notes: string[] }> = {
  learner: {
    title: "Learner login",
    who: "Parent's",
    notes: [
      "Parents sign in with their phone number. You manage your child's account, consent and data.",
      "Students under 18 sign in through a parent-managed or school-issued account, never on their own.",
    ],
  },
  school: { title: "School login", who: "Staff", notes: ["For school admins, trainers and lab instructors. Your school admin adds you first."] },
  educator: { title: "Fellow login", who: "Your", notes: ["For vetted Kalam Fellows. Not a Fellow yet?"] },
};

export default async function DoorLogin({ params }: { params: Promise<{ door: string }> }) {
  const { door } = await params;
  const d = doors.find((x) => x.id === door);
  if (!d) notFound();
  const c = copy[d.id];
  return (
    <section className="py-12 sm:py-20" style={{ viewTransitionName: "door-hero" }}>
      <div className="wrap grid max-w-5xl gap-10 md:grid-cols-2">
        <div>
          <p className="eyebrow">{d.name} door</p>
          <h1 className="display-lg mt-3">{c.title}</h1>
          {c.notes.map((n) => <p key={n} className="mt-4 text-muted">{n}</p>)}
          {d.id === "educator" && <Link className="mt-2 inline-block font-semibold text-link underline" href="/fellows/apply">Apply to Kalam Fellows</Link>}
          <p className="mt-6 text-sm text-muted"><Link className="underline" href="/login">Choose a different door</Link></p>
        </div>
        <div className="card p-6 sm:p-8">
          {d.id === "learner" ? <Suspense><LearnerLogin /></Suspense> : <OtpLogin who={c.who} />}
          <p className="mt-4 text-xs text-muted">We will text a one-time code. {d.id === "learner" ? "" : d.id === "school" ? "School accounts open in Phase 4." : "Fellow accounts open with the Phase 3 pilot."}</p>
        </div>
      </div>
    </section>
  );
}
