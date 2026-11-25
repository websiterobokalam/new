import { publicPhotos, type Photo } from "@/content/photos";
import { GalleryGrid } from "./GalleryGrid";

const TAG_LABEL: Record<Photo["tags"][number], string> = {
  lab: "Labs", robotics: "Robotics", coding: "Coding", space: "Space", iot: "IoT", events: "Events",
  schools: "Schools", warangal: "Warangal", hyderabad: "Hyderabad", recognition: "Recognition", classes: "Classes",
};

/**
 * An editorial photo gallery from the photo register: a featured photo, the rest
 * laid out by their real shape, filter chips, and a full-screen viewer.
 * Only photos the register allows are shown (children's photos need consent).
 */
export function PhotoGallery({ tag, ids, title, lede, eyebrow = "Robokalam in the real world", dark = false }: { tag?: Photo["tags"][number]; ids?: string[]; title: string; lede?: string; eyebrow?: string; dark?: boolean }) {
  const list = ids ? ids.map((id) => publicPhotos().find((p) => p.id === id)).filter((p): p is Photo => !!p) : publicPhotos(tag);
  if (!list.length) return null;
  const hid = `gal-${tag ?? ids?.[0] ?? "all"}`;
  // Filters: only tags that appear on at least two of these photos, most common first.
  const counts = new Map<string, number>();
  for (const p of list) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const filters = [...counts].filter(([t, n]) => n >= 2 && t !== tag && n < list.length).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([t]) => ({ id: t, label: TAG_LABEL[t as Photo["tags"][number]] ?? t }));
  const items = list.map((p) => ({ id: p.id, src: p.src, width: p.width, height: p.height, alt: p.alt, caption: p.caption, tags: p.tags, label: TAG_LABEL[p.tags[0]] }));
  return (
    <section className={`photo-gallery py-16 sm:py-24 ${dark ? "pg-dark" : ""}`} aria-labelledby={hid}>
      <div className="wrap">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={hid} className="display-lg mt-2">{title}</h2>
          {lede && <p className="lede mt-3 max-w-2xl">{lede}</p>}
        </div>
        <GalleryGrid items={items} filters={filters} title={title} />
      </div>
    </section>
  );
}
