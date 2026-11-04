import { test, expect } from "@playwright/test";
import { orderBoard, eligible } from "@/lib/fellows/gigs";
import { suggestTier } from "@/lib/fellows/tiers";
import { academy, gradeModule } from "@/content/fellows/academy";
import { gradeSubject, subjectTests } from "@/content/fellows/subject-tests";
import { hasContactDetails } from "@/lib/fellows/community";
import { statementCsv } from "@/lib/fellows/earnings";

test("matching: the Kalamite's worlds first, then earliest start", () => {
  const g = [
    { id: "a", world: "space", starts_at: "2026-11-10T05:00:00Z" },
    { id: "b", world: "robotics", starts_at: "2026-11-12T05:00:00Z" },
    { id: "c", world: "robotics", starts_at: "2026-11-11T05:00:00Z" },
  ];
  expect(orderBoard(g, ["robotics"]).map((x) => x.id)).toEqual(["c", "b", "a"]);
});

test("matching inputs are tier, language and city only (no protected characteristics)", () => {
  const f = { tier: "fellow", languages: ["en", "te"], city: "Hyderabad" };
  expect(eligible({ min_tier: "apprentice", language: "te", mode: "online", city: "Pune" }, f)).toBe(true);
  expect(eligible({ min_tier: "senior", language: "en", mode: "online", city: "Hyderabad" }, f)).toBe(false);
  expect(eligible({ min_tier: "apprentice", language: "hi", mode: "online", city: "Hyderabad" }, f)).toBe(false);
  expect(eligible({ min_tier: "apprentice", language: "en", mode: "offline", city: "Pune" }, f)).toBe(false);
  // The function cannot see anything else: its parameter types only carry these fields.
  expect(eligible.length).toBe(2);
});

test("tiers: reliability, progress and verified feedback; never volume alone", () => {
  expect(suggestTier({ delivered: 200, noShows: 50, reliability: 0.8, progress: 1, rating: 5, reviews: 50 })).toBe("apprentice");
  expect(suggestTier({ delivered: 12, noShows: 0, reliability: 1, progress: 0.2, rating: null, reviews: 0 })).toBe("fellow");
  expect(suggestTier({ delivered: 45, noShows: 1, reliability: 0.98, progress: 0.4, rating: 4.6, reviews: 12 })).toBe("senior");
});

test("grading: safety modules need every answer; others pass at two thirds", () => {
  const safety = academy.find((m) => m.passAll)!;
  const right = safety.quiz.map((q) => q.answer);
  expect(gradeModule(safety, right).passed).toBe(true);
  expect(gradeModule(safety, right.map((a, i) => (i === 0 ? (a + 1) % 3 : a))).passed).toBe(false);
  const craft = academy.find((m) => !m.passAll)!;
  expect(gradeModule(craft, craft.quiz.map((q, i) => (i === 0 ? (q.answer + 1) % 3 : q.answer))).passed).toBe(true);
  expect(gradeSubject("iot", subjectTests.iot.map((q) => q.answer))).toMatchObject({ correct: 5, passed: true });
});

test("contact details are detected in messages", () => {
  for (const s of ["call 98765 43210", "+91 98765-43210", "ravi@gmail.com", "add me on insta", "WhatsApp me", "dm @ravi.t", "www.mysite.in", "t.me/ravi"]) expect(hasContactDetails(s), s).toBe(true);
  for (const s of ["Great work on the rover!", "Class at 5:30 on 12-11", "She built 3 circuits", "Email support via Robokalam"]) expect(hasContactDetails(s), s).toBe(false);
});

test("statement CSV escapes and itemises deductions", () => {
  const csv = statementCsv([{ earned_at: "2026-11-02T10:00:00Z", kind: "session", description: 'Robo "Ashaers"', gross_paise: 60000, deductions: [{ label: "TDS", paise: 600 }], net_paise: 59400, payout_id: null }]);
  expect(csv).toContain('"Robo ""Ashaers"""');
  expect(csv).toContain("600.00,\"TDS 6.00\",594.00,pending");
});
