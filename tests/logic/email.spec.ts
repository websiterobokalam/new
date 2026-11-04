import { test, expect } from "@playwright/test";
import { TEMPLATES, render, categoryOf, type TemplateId } from "@/lib/email/templates";

const sample: Record<string, unknown> = {
  name: "Anita", ref: "RK-1234ABCD", link: "/x", institution: "Sample School", door: "learner", queue: "q", phone: "+91••", summary: "s",
  child: "Asha", granted: ["Your family account"], declined: [], notice: "learner-2026-12-en", when: "Mon, 3 Nov, 5:00 pm IST", oneToOne: true, purpose: "One-to-one",
  course: "Robotics", where: "Online", educator: "Kiran M.", fee: "₹3,000.00 incl. GST", mission: "Find three things", amount: "₹3,000.00", invoice: "RK/2026-27/000001",
  attended: true, built: "First light", feedback: "Great work", nextStep: "Level 2", profile: "/educators/x", classLink: "/app", status: "approved", note: "n", from: "Kiran M.",
  respondBy: "Tue", category: "safety", page: "/app", kind: "deletion", step: "Subject test", outcome: "passed", title: "Gig", pay: "₹500.00", gross: "₹500.00",
  deductions: "None", net: "₹500.00", effective: "17 Nov", noticeUntil: "10 Nov", childSafety: false, decision: "approved", message: "m", school: "S", role: "a trainer",
  due: "d", clock: "2d left", fellow: "Kiran M.", flags: "0", college: "C", city: "Hyderabad", code: "123456", by: "Robokalam",
};

test("every email renders a subject, accessible HTML and a plain-text twin", () => {
  for (const id of Object.keys(TEMPLATES) as TemplateId[]) {
    const r = render(id, sample, { unsubscribe: "https://example.test/u" });
    expect(r.subject.length, id).toBeGreaterThan(5);
    expect(r.html, id).toContain('<html lang="en">');
    expect(r.text.length, id).toBeGreaterThan(20);
    expect(r.html, id).not.toMatch(/undefined|\[object Object\]/);
    expect(r.html, id).not.toMatch(/<img/i); // no tracking pixels
  }
});

test("only reminders and summaries carry an unsubscribe line; oversight emails can't be turned off", () => {
  expect(render("class_reminder", sample, { unsubscribe: "https://example.test/u" }).text).toContain("Turn them off");
  expect(render("oto_before", sample, { unsubscribe: "https://example.test/u" }).text).not.toContain("Turn them off");
  expect(render("oto_after", sample, { unsubscribe: "https://example.test/u" }).text).toContain("can't be turned off while one-to-one classes are on");
  expect(categoryOf("oto_before")).toBe("oversight");
  expect(categoryOf("payment_receipt")).toBe("transactional");
});

test("user text is escaped in HTML", () => {
  const r = render("session_summary", { ...sample, feedback: '<script>alert("x")</script>' });
  expect(r.html).not.toContain("<script>");
  expect(r.html).toContain("&lt;script&gt;");
});
