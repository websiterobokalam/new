import { ticketClock } from "@/lib/schools/core";

const TONE = { running: "bg-panel text-heading", overdue: "bg-[#fde8e7] text-[#8a1c13]", met: "bg-leafmist text-navy", missed: "bg-[#fff1d6] text-[#7a4a00]" };

/** The replacement clock, as text (not colour alone). Server-rendered at request time. */
export function TicketClock({ t }: { t: { due_at: Date | string; resolved_at: Date | string | null } }) {
  const c = ticketClock(t);
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${TONE[c.state]}`} data-clock={c.state}>{c.label}</span>;
}
