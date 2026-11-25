"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryItem = { id: string; src: string; width: number; height: number; alt: string; caption: string; tags: string[]; label?: string };

/** The first photo is featured across the top; the rest keep their real shape (very tall ones are trimmed a little). */
const shape = (i: number) => (i === 0 ? "pg-feature" : "");
const ratio = (it: GalleryItem) => `${it.width} / ${Math.min(it.height, Math.round(it.width * 1.3))}`;

export function GalleryGrid({ items, filters, title }: { items: GalleryItem[]; filters: { id: string; label: string }[]; title: string }) {
  const [filter, setFilter] = useState<string | null>(null);
  const shown = filter ? items.filter((it) => it.tags.includes(filter)) : items;
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const swipe = useRef<number | null>(null);

  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length)), [shown.length]);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const dl = dialog.current;
    if (!dl) return;
    if (open !== null && !dl.open) { dl.showModal(); document.documentElement.style.overflow = "hidden"; }
    if (open === null && dl.open) dl.close();
  }, [open]);

  useEffect(() => {
    const dl = dialog.current;
    if (!dl) return;
    const onClose = () => { setOpen(null); document.documentElement.style.overflow = ""; opener.current?.focus(); };
    dl.addEventListener("close", onClose);
    return () => dl.removeEventListener("close", onClose);
  }, []);

  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", key);
    // Warm the neighbours so next/previous feel instant.
    for (const d of [1, -1]) { const n = shown[(open + d + shown.length) % shown.length]; if (n) { const im = new Image(); im.src = `${n.src}.webp`; } }
    return () => window.removeEventListener("keydown", key);
  }, [open, go, shown]);

  const cur = open !== null ? shown[open] : null;

  return (
    <>
      {filters.length > 0 && (
        <div className="pg-filters" role="group" aria-label={`Filter ${title}`}>
          {[{ id: null as string | null, label: "All" }, ...filters].map((f) => {
            const n = f.id ? items.filter((it) => it.tags.includes(f.id!)).length : items.length;
            return (
              <button key={f.label} type="button" className="pg-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label} <span className="pg-count">{n}</span>
              </button>
            );
          })}
        </div>
      )}

      <ul className="pg-grid" aria-label={`${title}: ${shown.length} photos`}>
        {shown.map((it, i) => (
          <li key={it.id} className={`pg-tile ${shape(i)}`}>
            <button type="button" className="pg-open" style={{ aspectRatio: ratio(it) }} aria-label={`${it.label ? `${it.label} ` : ""}${it.caption} (open full size)`} onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}>
              <img
                src={`${it.src}-800.webp`}
                srcSet={`${it.src}-800.webp 800w, ${it.src}.webp ${Math.min(1600, it.width)}w`}
                sizes={i === 0 ? "(min-width: 1200px) 1200px, 100vw" : "(min-width: 768px) 400px, 50vw"}
                width={it.width}
                height={it.height}
                alt={it.alt}
                loading={i < 2 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                decoding="async"
                className="pg-img"
              />
              <span className="pg-shade" aria-hidden />
              <span className="pg-meta">
                {it.label && <span className="pg-tag">{it.label}</span>}
                <span className="pg-cap">{it.caption}</span>
              </span>
              <span className="pg-zoom" aria-hidden>
                <svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="pg-viewer"
        aria-label={cur ? `Photo ${open! + 1} of ${shown.length}: ${cur.caption}` : "Photo viewer"}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        onPointerDown={(e) => { swipe.current = e.clientX; }}
        onPointerUp={(e) => { if (swipe.current !== null) { const dx = e.clientX - swipe.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); } swipe.current = null; }}
      >
        {cur && (
          <div className="pg-stage">
            <figure className="pg-figure">
              <img key={cur.id} src={`${cur.src}.webp`} width={cur.width} height={cur.height} alt={cur.alt} className="pg-full" draggable={false} />
              <figcaption className="pg-figcap">
                <span>{cur.caption}</span>
                <span className="pg-counter" aria-hidden>{open! + 1} / {shown.length}</span>
              </figcaption>
            </figure>
            <button type="button" className="pg-nav pg-prev" aria-label="Previous photo" onClick={() => go(-1)}><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg></button>
            <button type="button" className="pg-nav pg-next" aria-label="Next photo" onClick={() => go(1)}><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg></button>
            <button type="button" className="pg-close" aria-label="Close" onClick={close} autoFocus><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
        )}
      </dialog>
    </>
  );
}
