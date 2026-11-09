import type { Photo } from "@/content/photos";

/** A real photo from the photo register: responsive, lazy, with its alt text. */
export function RealPhoto({ ph, sizes = "(min-width: 1024px) 50vw, 92vw", className = "", priority = false }: { ph: Photo; sizes?: string; className?: string; priority?: boolean }) {
  return (
    <img
      src={`${ph.src}.webp`}
      srcSet={`${ph.src}-800.webp 800w, ${ph.src}.webp ${Math.min(1600, ph.width)}w`}
      sizes={sizes}
      width={ph.width}
      height={ph.height}
      alt={ph.alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
