import Link from "next/link";
import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { eventBySlug, myRegistrations, ageLabel, seatsLeft, isOpen, ist, EVENT_KINDS } from "@/lib/events";
import { ageFits } from "@/lib/learn/booking";
import { currentConsents, hasRequired } from "@/lib/learn/consent";
import { EventRegister } from "@/components/app/EventRegister";

export const metadata = { title: "Register for an event" };
export const dynamic = "force-dynamic";

export default async function RegisterEvent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { account } = await appContext(`/app/events/${slug}`);
  const e = await eventBySlug(slug);
  if (!e || e.status !== "published") notFound();
  const data = await system(async (c) => {
    const mine = await myRegistrations(c, account.id, e.id);
    const kids = e.audience === "learners"
      ? await Promise.all((await c.query("SELECT id, first_name, age_band FROM learners WHERE guardian_account_id = $1 AND erased_at IS NULL ORDER BY created_at", [account.id])).rows.map(async (l) => ({
          id: l.id as string, first_name: l.first_name as string, fits: ageFits(l.age_band, e.age_min ?? 0, e.age_max), consented: hasRequired(await currentConsents(c, l.id)), registered: mine.some((m) => m.who === l.id),
        })))
      : [];
    return { mine, kids };
  });
  return (
    <section className="py-10">
      <div className="wrap grid max-w-3xl gap-6">
        <header>
          <p className="eyebrow">{EVENT_KINDS[e.kind]} · {ageLabel(e)} · Free</p>
          <h1 className="display-lg mt-2">{e.title}</h1>
          <p className="mt-2 text-muted">{ist(e.starts_at)} · {e.mode === "online" ? "Online, on Robokalam" : `${e.venue}${e.city ? `, ${e.city}` : ""}`} · {seatsLeft(e)} place{seatsLeft(e) === 1 ? "" : "s"} left</p>
          <Link className="mt-2 inline-block text-sm font-semibold text-link underline" href={`/events/${e.slug}`}>Event details</Link>
        </header>
        <section className="card p-6">
          {isOpen(e) || data.mine.length > 0 ? (
            <EventRegister slug={e.slug} audience={e.audience} kids={data.kids} selfRegistered={data.mine.some((m) => m.who === "self")} />
          ) : <p className="font-semibold text-muted">This event is full or has closed.</p>}
        </section>
      </div>
    </section>
  );
}
