import { test, expect } from "@playwright/test";
import { claims, ClaimSchema } from "@/content/claims";
import { isPublishable, claimText } from "@/lib/claims";

test("every claim matches the schema and ids are unique", () => {
  for (const c of claims) ClaimSchema.parse(c);
  expect(new Set(claims.map((c) => c.id)).size).toBe(claims.length);
});

test("a claim needs approval, value, date, evidence and owner to publish", () => {
  const base = { ...claims[0], approved: true, asOf: "2026-10-01", evidence: "doc", owner: "ops", value: 20 };
  expect(isPublishable(base)).toBe(true);
  expect(isPublishable({ ...base, approved: false })).toBe(false);
  expect(isPublishable({ ...base, asOf: null })).toBe(false);
  expect(isPublishable({ ...base, evidence: null })).toBe(false);
  expect(isPublishable({ ...base, owner: null })).toBe(false);
  expect(isPublishable({ ...base, value: null })).toBe(false);
  expect(isPublishable({ ...base, retired: true })).toBe(false);
  expect(claimText(base)).toBe("20-day rollout");
});

test("banned language never appears as an approvable claim", () => {
  const banned = /no\.?\s?1|guarantee|top 1%|soc ?2/i;
  for (const c of claims.filter((c) => !c.retired)) expect(c.display).not.toMatch(banned);
});
