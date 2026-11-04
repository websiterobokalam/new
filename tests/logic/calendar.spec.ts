import { test, expect } from "@playwright/test";
import { ics, feedToken, checkFeedToken } from "@/lib/calendar";

test("calendar files follow RFC 5545: CRLF, escaping, folding, UTC times, a reminder", () => {
  const body = ics([{ uid: "booking-1", start: new Date("2026-11-10T11:30:00Z"), minutes: 60, title: "Asha: Robo Ashaers; Junior, L1", description: "Line one\nLine two, with a comma and a very long sentence that goes on well past seventy-five characters for folding", location: "Online, on Robokalam" }], { now: new Date("2026-11-04T00:00:00Z"), name: "Robokalam classes" });
  expect(body.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
  expect(body.endsWith("END:VCALENDAR\r\n")).toBe(true);
  expect(body).toContain("DTSTART:20261110T113000Z");
  expect(body).toContain("DTEND:20261110T123000Z");
  expect(body).toContain("SUMMARY:Asha: Robo Ashaers\\; Junior\\, L1");
  expect(body).toContain("Line one\\nLine two\\, with a comma");
  expect(body).toContain("TRIGGER:-PT30M");
  expect(body).toContain("UID:booking-1@robokalam.com");
  for (const line of body.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
  expect(body).not.toMatch(/[^\r]\n/); // every line break is CRLF
});

test("feed tokens: stable per account, change when reset, never accept a near miss", () => {
  const t = feedToken("a1", null);
  expect(feedToken("a1", null)).toBe(t);
  expect(checkFeedToken("a1", null, t)).toBe(true);
  expect(checkFeedToken("a1", "newsalt", t)).toBe(false);
  expect(checkFeedToken("a2", null, t)).toBe(false);
  expect(checkFeedToken("a1", null, t.slice(0, -1) + (t.endsWith("A") ? "B" : "A"))).toBe(false);
});
