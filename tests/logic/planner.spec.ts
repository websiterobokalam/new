import { test, expect } from "@playwright/test";
import { planLab } from "@/lib/planner";

test("plan for classes 3-8 with 600 students, 40 per section", () => {
  const p = planLab({ board: "CBSE", classFrom: 3, classTo: 8, students: 600, sectionSize: 40, roomSqft: 900 });
  expect(p.benches).toBe(10);
  expect(p.sqftNeeded).toBe(1000);
  expect(p.room).toBe("tight");
  expect(p.sections).toBe(15);
  expect(p.labsNeeded).toBe(1);
  expect(p.bands[0]).toMatchObject({ classes: "3", programme: "CODO Ashaers" });
  expect(p.bands.at(-1)?.programme).toBe("Advance Ashaers");
});

test("reversed and out-of-range classes are clamped", () => {
  const p = planLab({ board: "ICSE", classFrom: 15, classTo: 0, students: 50, sectionSize: 25, roomSqft: null });
  expect([p.from, p.to]).toEqual([1, 12]);
  expect(p.room).toBe("unknown");
});

test("many sections need more than one lab", () => {
  expect(planLab({ board: "CBSE", classFrom: 1, classTo: 12, students: 3000, sectionSize: 40, roomSqft: null }).labsNeeded).toBe(3);
});
