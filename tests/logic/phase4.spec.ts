import { test, expect } from "@playwright/test";
import { ticketClock, istToUtc, istDate } from "@/lib/schools/core";
import { toCsv } from "@/lib/schools/core";

const h = 3600_000;

test("ticket clock: running, overdue, met and missed, in words", () => {
  const now = new Date("2026-11-03T06:00:00Z");
  expect(ticketClock({ due_at: new Date(now.getTime() + 5 * h), resolved_at: null }, now)).toMatchObject({ state: "running", label: "5h 0m left" });
  expect(ticketClock({ due_at: new Date(now.getTime() + 50 * h), resolved_at: null }, now).label).toBe("2d 2h left");
  expect(ticketClock({ due_at: new Date(now.getTime() - 0.5 * h), resolved_at: null }, now)).toMatchObject({ state: "overdue", label: "Overdue by 30m" });
  expect(ticketClock({ due_at: now, resolved_at: new Date(now.getTime() - h) }).state).toBe("met");
  expect(ticketClock({ due_at: now, resolved_at: new Date(now.getTime() + h) }).state).toBe("missed");
});

test("timetable times are India time, stored as UTC", () => {
  expect(istToUtc("2026-11-02", "10:00").toISOString()).toBe("2026-11-02T04:30:00.000Z");
  expect(istToUtc("2026-11-02", "00:15:00").toISOString()).toBe("2026-11-01T18:45:00.000Z");
  expect(istDate(new Date("2026-11-01T19:00:00Z"))).toBe("2026-11-02");
});

test("audit CSV escapes commas, quotes and new lines", () => {
  expect(toCsv([["a", 'say "hi", ok', "x\ny", null]])).toBe('a,"say ""hi"", ok","x\ny",\n');
});
