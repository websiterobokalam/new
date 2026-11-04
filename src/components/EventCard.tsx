import Link from "next/link";
import { EVENT_KINDS, ageLabel, seatsLeft, type PublicEvent } from "@/lib/events";

const day = (d: Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" });
const mon = (d: Date) => new Date(d).toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" });
const time = (d: Date) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function EventCard({ e }: { e: PublicEvent }) {
  const left = seatsLeft(e);
  return (
    <Link href={`/events/${e.slug}`} className="solution-card flex w-full gap-5 p-5">
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-center leading-tight text-[var(--color-ink)]" style={{ background: "var(--kalam-gradient)" }} aria-hidden>
        <span><span className="block text-2xl font-bold">{day(e.starts_at)}</span><span className="block text-xs font-semibold uppercase">{mon(e.starts_at)}</span></span>
      </span>
      <span className="grid gap-1">
        <span className="eyebrow !text-xs">{EVENT_KINDS[e.kind]} · {ageLabel(e)}</span>
        <span className="text-lg font-semibold text-heading">{e.title}</span>
        <span className="text-sm text-muted">{e.summary}</span>
        <span className="text-sm text-muted">
          <time dateTime={new Date(e.starts_at).toISOString()}>{new Date(e.starts_at).toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" })}, {time(e.starts_at)} IST</time>
          {" · "}{e.mode === "online" ? "Online" : e.city ?? e.venue}{" · "}{left > 0 ? `${left} place${left === 1 ? "" : "s"} left` : "Full"} · Free
        </span>
      </span>
    </Link>
  );
}
