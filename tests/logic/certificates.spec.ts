import { test, expect } from "@playwright/test";
import { newCode, normaliseCode } from "@/lib/certificates";

test("certificate IDs: unambiguous characters, and forgiving of how people type them", () => {
  for (let i = 0; i < 200; i++) expect(newCode()).toMatch(/^RK-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}$/);
  expect(new Set(Array.from({ length: 2000 }, newCode)).size).toBe(2000);
  expect(normaliseCode("rk-7kq2m-9xb4d")).toBe("RK-7KQ2M-9XB4D");
  expect(normaliseCode(" RK 7KQ2M 9XB4D ")).toBe("RK-7KQ2M-9XB4D");
  expect(normaliseCode("7KQ2M9XB4D")).toBe("RK-7KQ2M-9XB4D");
  expect(normaliseCode("RK-7KQ2M")).toBeNull();
  expect(normaliseCode("hello")).toBeNull();
});
