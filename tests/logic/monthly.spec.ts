import { test, expect } from "@playwright/test";
import { reportingMonth } from "@/lib/email/monthly";

test("monthly summary: reports last month in India time, only on the 1st to 3rd", () => {
  // 1 Dec 2026, 09:00 IST
  const r = reportingMonth(new Date("2026-12-01T03:30:00Z"));
  expect(r).toMatchObject({ due: true, key: "2026-11", label: "November 2026" });
  expect(r.from.toISOString()).toBe("2026-10-31T18:30:00.000Z"); // 1 Nov 00:00 IST
  expect(r.to.toISOString()).toBe("2026-11-30T18:30:00.000Z"); // 1 Dec 00:00 IST
  // January reports December of the year before
  expect(reportingMonth(new Date("2027-01-02T06:00:00Z"))).toMatchObject({ due: true, key: "2026-12", label: "December 2026" });
  // 30 Nov 23:00 UTC is already 1 Dec in India
  expect(reportingMonth(new Date("2026-11-30T23:00:00Z")).key).toBe("2026-11");
  expect(reportingMonth(new Date("2026-11-15T06:00:00Z")).due).toBe(false);
});
