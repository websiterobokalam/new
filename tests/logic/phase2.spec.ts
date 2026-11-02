import { test, expect } from "@playwright/test";
import { evaluate } from "@/lib/learn/refunds";
import { buildJourney, plainProgress } from "@/lib/learn/journey";
import { gstSplit } from "@/lib/money";
import { ageFits } from "@/lib/learn/booking";

test("refund policy: full refund 24h+ before start, pro rata after", () => {
  const now = new Date("2026-11-10T10:00:00Z");
  expect(evaluate({ amount_paise: 400000 }, new Date("2026-11-12T10:00:00Z"), 8, 0, now)).toMatchObject({ rule: "full_before_start", amountPaise: 400000 });
  expect(evaluate({ amount_paise: 400000 }, new Date("2026-11-09T10:00:00Z"), 8, 2, now)).toMatchObject({ rule: "pro_rata", amountPaise: 300000 });
  expect(evaluate({ amount_paise: 400000 }, new Date("2026-11-09T10:00:00Z"), 8, 2, now).auto).toBe(false); // policy not approved
});

test("GST split is exact and inclusive", () => {
  expect(gstSplit(118000)).toEqual({ total: 118000, gst: 18000, net: 100000 });
  const s = gstSplit(400000);
  expect(s.gst + s.net).toBe(400000);
});

test("age bands overlap course ranges", () => {
  expect(ageFits("9-11", 7, 9)).toBe(true);
  expect(ageFits("6-8", 9, 14)).toBe(false);
  expect(ageFits("18+", 6, null)).toBe(true);
});

test("journey: prerequisites lock, built unlocks, recommendation follows stated interests only", () => {
  const P = [
    { id: "a", world: "robotics", level: 1, title: "A", builds: "a", prerequisites: [], age_min: 6 },
    { id: "b", world: "robotics", level: 2, title: "B", builds: "b", prerequisites: ["a"], age_min: 6 },
    { id: "c", world: "space", level: 1, title: "C", builds: "c", prerequisites: [], age_min: 6 },
  ];
  let n = buildJourney(P, {}, ["space"], "9-11");
  expect(n.find((x) => x.id === "b")!.state).toBe("locked");
  expect(n.find((x) => x.recommended)!.id).toBe("c");
  n = buildJourney(P, { a: "built" }, ["robotics"], "9-11");
  expect(n.find((x) => x.id === "b")!.state).toBe("available");
  expect(n.find((x) => x.recommended)!.id).toBe("b");
  expect(plainProgress("Asha", n)).toBe("Asha has built 1 project: A. Next up: B (b).");
});
