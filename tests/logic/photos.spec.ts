import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { photos, publicPhotos, photo, isPublishable } from "@/content/photos";

test("children's photos stay off the site until parents' written consent is confirmed", () => {
  for (const ph of photos.filter((p) => p.people === "children")) {
    expect(isPublishable(ph), ph.id).toBe(ph.consentConfirmed === true);
    if (ph.consentConfirmed) expect(ph.consentRecord, `${ph.id} needs a consent record`).toBeTruthy();
    else {
      expect(photo(ph.id), ph.id).toBeNull();
      expect(publicPhotos().map((p) => p.id)).not.toContain(ph.id);
    }
  }
});

test("every photo has both sizes on disk and real alt text", () => {
  for (const ph of photos) {
    expect(existsSync(`public${ph.src}.webp`), ph.id).toBe(true);
    expect(existsSync(`public${ph.src}-800.webp`), ph.id).toBe(true);
    expect(ph.alt.length, ph.id).toBeGreaterThan(40);
  }
});
