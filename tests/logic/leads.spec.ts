import { test, expect } from "@playwright/test";
import { Lead, routeFor, maskPhone } from "@/lib/leads";

const learner = { door: "learner", parentName: "Asha", phone: "98765 43210", childAgeBand: "9-11", interest: "robotics", contactOptIn: true };

test("learner lead normalises the phone and routes to build-session queue", () => {
  const l = Lead.parse(learner);
  expect(l.phone).toBe("+919876543210");
  expect(routeFor(l).queue).toBe("learner-build-session");
});

test("no contact without opt-in", () => {
  expect(Lead.safeParse({ ...learner, contactOptIn: false }).success).toBe(false);
});

test("child data is an age band, never a date of birth", () => {
  expect(Lead.safeParse({ ...learner, childAgeBand: "2015-04-01" }).success).toBe(false);
});

test("Fellows must confirm 18+", () => {
  const f = { door: "educator", name: "Ravi", phone: "+919876543210", email: "ravi@college.ac.in", college: "Any College", course: "B.Tech ECE", year: "3", ageConfirmed: false, worlds: ["iot"], hoursPerWeek: 6, city: "Hyderabad", languages: ["English"], contactOptIn: true };
  expect(Lead.safeParse(f).success).toBe(false);
  const ok = Lead.parse({ ...f, ageConfirmed: true });
  expect(routeFor(ok).queue).toBe("fellow-waitlist");
});

test("school lead with a planner payload routes to the planner queue", () => {
  const s = { door: "school", name: "Principal K", role: "Principal", institution: "Model School", city: "Warangal", board: "CBSE", students: "600", phone: "9876543210", contactOptIn: true };
  expect(routeFor(Lead.parse(s)).queue).toBe("school-demo");
  expect(routeFor(Lead.parse({ ...s, plan: { benches: 10 } })).queue).toBe("school-lab-planner");
});

test("phone is masked in logs", () => {
  expect(maskPhone("+919876543210")).toBe("+919******10");
});
