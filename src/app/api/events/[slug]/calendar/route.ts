import { eventBySlug } from "@/lib/events";
import { ics, icsResponse } from "@/lib/calendar";
import { SITE } from "@/lib/site";

/** Public: an event's date and place only, no personal data. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const e = await eventBySlug((await params).slug);
  if (!e || e.status !== "published") return new Response("Not found", { status: 404 });
  return icsResponse(ics([{ uid: `event-${e.id}`, start: new Date(e.starts_at), minutes: e.duration_min, title: `Robokalam: ${e.title}`, description: e.summary, location: e.mode === "online" ? "Online, on Robokalam" : e.venue ?? undefined, url: `${SITE.url}/events/${e.slug}` }]), `${e.slug}.ics`);
}
