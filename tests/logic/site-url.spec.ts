import { test, expect } from "@playwright/test";
import { siteUrl } from "@/lib/site";

test("site URL never breaks the build", () => {
  expect(siteUrl(undefined)).toBe("https://robokalam.com");
  expect(siteUrl("")).toBe("https://robokalam.com");
  expect(siteUrl("check")).toBe("https://robokalam.com");
  expect(siteUrl("new.robokalam.com")).toBe("https://new.robokalam.com");
  expect(siteUrl("https://new.robokalam.com/")).toBe("https://new.robokalam.com");
  expect(siteUrl("http://localhost:3000")).toBe("http://localhost:3000");
});
