import { test, expect } from "@playwright/test";
import { analyticsAllowedOn } from "@/components/Analytics";

test("analytics is never allowed on account, sign-in or children's pages", () => {
  for (const p of ["/app", "/app/orders", "/login", "/login/school", "/learn/build-session", "/kalamites/apply", "/certificates/ABC123", "/api/leads"]) expect(analyticsAllowedOn(p), p).toBe(false);
  for (const p of ["/", "/learn", "/21c-lab", "/blog/robotics-classes-hyderabad", "/locations/warangal", "/apply-later"]) expect(analyticsAllowedOn(p), p).toBe(true);
});
