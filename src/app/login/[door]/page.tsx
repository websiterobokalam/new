import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { doors, type DoorId } from "@/content/site";
import { Suspense } from "react";
import { LearnerLogin } from "@/components/app/LearnerLogin";
import { FellowLogin, SchoolLogin } from "@/components/app/DoorLogin";
import { smsLoginAvailable } from "@/lib/auth/otp";

// Rendered per request: which sign-in methods are on depends on this server's settings.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

const copy: Record<DoorId, { title: string; who: string; notes: string[] }> = {
  learner: {
    title: "Learner login",
    who: "Parent's",
    notes: [
      "Parents sign in with their email and a one-time code. You manage your child's account, consent and data.",
      "Students under 18 sign in through a parent-managed or school-issued account, never on their own.",
    ],
  },
  school: { title: "School login", who: "Staff", notes: ["For school admins, trainers and lab instructors. Your school admin (or Robokalam) adds you first, then you sign in with your work email.", "Students use the school-issued AADHYA login from their trainer, not this page."] },
  educator: { title: "Kalamite login", who: "Your", notes: ["For vetted Kalamites. Not a Kalamite yet?"] },
};

export default async function DoorLogin({ params }: { params: Promise<{ door: string }> }) {
  const { door } = await params;
  const d = doors.find((x) => x.id === door);
  if (!d) notFound();
  const c = copy[d.id];
  const sms = smsLoginAvailable();
  return (
    <section className="py-12 sm:py-20" style={{ viewTransitionName: "door-hero" }}>
      <div className="wrap grid max-w-5xl gap-10 md:grid-cols-2">
        <div>
          <p className="eyebrow">{d.name} door</p>
          <h1 className="display-lg mt-3">{c.title}</h1>
          {c.notes.map((n) => <p key={n} className="mt-4 text-muted">{n}</p>)}
          {d.id === "educator" && <Link className="mt-2 inline-block font-semibold text-link underline" href="/kalamites/apply">Apply to Kalamites</Link>}
          <p className="mt-6 text-sm text-muted"><Link className="underline" href="/login">Choose a different door</Link></p>
        </div>
        <div className="card p-6 sm:p-8">
          {d.id === "learner" ? <Suspense><LearnerLogin smsEnabled={sms} /></Suspense> : d.id === "educator" ? <Suspense><FellowLogin smsEnabled={sms} /></Suspense> : <Suspense><SchoolLogin smsEnabled={sms} /></Suspense>}
          <p className="mt-4 text-xs text-muted">We send a one-time code each time, so there&apos;s no password to remember or leak. {d.id === "school" ? "No account yet? Your school admin adds staff from the school portal." : ""}</p>
        </div>
      </div>
    </section>
  );
}
