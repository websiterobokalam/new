import { test, expect } from "@playwright/test";
import { courseRuleChecks, type Draft } from "@/lib/quality/flags";
import { evaluate } from "@/lib/market/gate";
import { ownerQuery, newId } from "../helpers";

const base: Draft = {
  id: "d", fellow_id: "f", title: "Line follower robots", world: "robotics", age_min: 9, age_max: 12,
  outcome: "Every learner builds a robot that follows a black line on its own.", sessions: 2, batch_size_max: 6, kit: "ASHAER pack", fee_paise: 200000,
  syllabus: [{ title: "Sensors", build: "A sensor that sees a black line" }, { title: "Steering", build: "A rover that follows the line" }],
};
const codes = (d: Partial<Draft>) => courseRuleChecks({ ...base, ...d }).map((f) => f.code);

test("course rules: a clean draft raises nothing", () => {
  expect(codes({})).toEqual([]);
});

test("course rules: the brief's hard rules are flagged as serious", () => {
  expect(codes({ world: "finlit", syllabus: [{ title: "Budgets", build: "A weekly budget" }, { title: "Stock tips for kids", build: "Pick shares to buy" }] })).toContain("finlit_investment");
  expect(codes({ world: "space", syllabus: [{ title: "Rockets", build: "A rocket motor with real propellant" }, { title: "Orbits", build: "An orbit model in a box" }] })).toContain("space_propellant");
  expect(codes({ outcome: "Message me on WhatsApp 98765 43210 for extra help with the robot." })).toContain("contact_details");
  expect(codes({ syllabus: [{ title: "One-on-one coaching", build: "Private session at your home" }, base.syllabus[1]] })).toContain("private_session");
  const sev = courseRuleChecks({ ...base, world: "finlit", outcome: "Learn trading basics and crypto so you can invest your pocket money." });
  expect(sev.find((f) => f.code === "finlit_investment")?.severity).toBe("high");
});

test("course rules: claims, institute links and syllabus gaps are flagged for a person to check", () => {
  expect(codes({ outcome: "Guaranteed admission to a top robotics club, 100% success for every learner." })).toContain("guarantee_claim");
  expect(codes({ title: "IIT-approved robotics" })).toContain("institute_link");
  expect(codes({ sessions: 3 })).toContain("syllabus_count");
  expect(codes({ age_min: 6, age_max: 16 })).toContain("age_span");
});

test("money basics without investing is fine", () => {
  expect(codes({ world: "finlit", outcome: "Every learner prices, budgets and runs a tiny stall for a day.", syllabus: [{ title: "Budgets", build: "A weekly budget sheet" }, { title: "Pricing", build: "A price list with costs and profit" }] })).toEqual([]);
});

test("readiness: a measure counts as met only with a target and data", () => {
  expect(evaluate({ better: "higher", value: 80, target: 75 })).toBe(true);
  expect(evaluate({ better: "higher", value: 70, target: 75 })).toBe(false);
  expect(evaluate({ better: "lower", value: 0.5, target: 1 })).toBe(true);
  expect(evaluate({ better: "lower", value: 2, target: 1 })).toBe(false);
  expect(evaluate({ better: "higher", value: null, target: 75 })).toBe(false);
  expect(evaluate({ better: "higher", value: 90, target: null })).toBe(false);
});

test("database: an automated check needs 14 days' notice before it takes effect", async () => {
  await expect(ownerQuery("INSERT INTO automated_systems (id, name, description, affects, notice_at, effective_at) VALUES ($1,'x','x','x', now(), now() + INTERVAL 13 DAY)", [`t-${newId().slice(0, 8)}`])).rejects.toThrow();
  await ownerQuery("INSERT INTO automated_systems (id, name, description, affects, notice_at, effective_at) VALUES ($1,'x','x','x', now(), now() + INTERVAL 14 DAY)", [`t-${newId().slice(0, 8)}`]);
});

test("database: a flag can't be closed without a person and a note", async () => {
  const id = newId();
  await ownerQuery("INSERT INTO quality_flags (id, system_id, subject_type, subject_id, code, severity, message) VALUES ($1,'session-signals','fellow',$2,'x','info','x')", [id, newId()]);
  await expect(ownerQuery("UPDATE quality_flags SET status = 'dismissed' WHERE id = $1", [id])).rejects.toThrow();
});

test("database: a Fellow course is never one-to-one", async () => {
  const f = { account_id: newId() };
  await ownerQuery("INSERT INTO accounts (id, phone_e164, role) VALUES ($1,$2,'fellow')", [f.account_id, `+919${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`]);
  await ownerQuery("INSERT INTO fellows (account_id, full_name, display_name, college, course, year, worlds, languages, hours_per_week, city, age_confirmed_at) VALUES ($1,'Test Person','Test P.','College','B.Tech','2','[\"coding\"]','[\"en\"]',5,'Hyderabad', now())", [f.account_id]);
  await expect(ownerQuery(
    "INSERT INTO course_drafts (id, fellow_id, title, world, age_min, age_max, outcome, sessions, batch_size_max, fee_paise, syllabus) VALUES ($1,$2,'t','coding',9,12,'o',1,1,0,'[]')",
    [newId(), f.account_id])).rejects.toThrow();
});
