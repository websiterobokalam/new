/** The hardware replacement clock. No imports, so any module can use it. */
export type Clock = { state: "running" | "overdue" | "met" | "missed"; hours: number; label: string };

/** The replacement clock. Stops at resolution; never restarts on reopen. */
export function ticketClock(t: { due_at: Date | string; resolved_at: Date | string | null }, now = new Date()): Clock {
  const due = new Date(t.due_at).getTime();
  if (t.resolved_at) {
    const met = new Date(t.resolved_at).getTime() <= due;
    return { state: met ? "met" : "missed", hours: 0, label: met ? "Fixed within the agreed time" : "Fixed, but after the agreed time" };
  }
  const left = (due - now.getTime()) / 3600_000;
  if (left >= 0) return { state: "running", hours: left, label: `${fmtHours(left)} left` };
  return { state: "overdue", hours: -left, label: `Overdue by ${fmtHours(-left)}` };
}
const fmtHours = (h: number) => (h >= 24 ? `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h` : h >= 1 ? `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m` : `${Math.max(1, Math.round(h * 60))}m`);

