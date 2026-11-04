import { smsLoginAvailable } from "@/lib/auth/otp";
import type { Metadata } from "next";
import { BuildSessionFlow } from "@/components/app/BuildSessionFlow";
import { anon } from "@/lib/db";
import { getNotice } from "@/lib/learn/consent";
import { currentAccount } from "@/lib/auth/session";
import { getLocale } from "@/i18n";
import { DbDown } from "@/components/app/DbDown";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Book a Free Build Session", description: "One free live session. Your child finishes one real build." };

export default async function BuildSessionPage({ searchParams }: { searchParams: Promise<{ age?: string; interest?: string }> }) {
  const sp = await searchParams;
  try {
    const account = await currentAccount();
    const notice = await anon((c) => getNotice(c, account?.language ?? "en"));
    void (await getLocale(account?.language));
    return (
      <section className="py-10 sm:py-16" style={{ viewTransitionName: "door-hero" }}>
        <div className="wrap max-w-3xl">
          <p className="eyebrow">Free Build Session</p>
          <h1 className="display-lg mt-3">One session. One finished build.</h1>
          <p className="lede mt-3">Four short steps. No payment, no pressure.</p>
          <div className="mt-8"><BuildSessionFlow notice={notice} signedIn={!!account} smsEnabled={smsLoginAvailable()} preset={{ ageBand: sp.age, interest: sp.interest }} /></div>
        </div>
      </section>
    );
  } catch {
    return <DbDown />;
  }
}
