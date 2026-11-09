import { publicPhotos, type Photo } from "@/content/photos";
import { RealPhoto } from "./RealPhoto";

/**
 * A 3D "coverflow" of real photos: the photo in the middle faces you, the ones
 * to either side turn away in depth as you swipe or scroll sideways. Pure CSS
 * (scroll-driven animations); in browsers without them it is a plain, swipeable
 * row. Only photos the register allows are shown.
 */
export function Gallery3D({ tag, ids, title, lede, eyebrow = "Robokalam in the real world", dark = false }: { tag?: Photo["tags"][number]; ids?: string[]; title: string; lede?: string; eyebrow?: string; dark?: boolean }) {
  const list = ids ? ids.map((id) => publicPhotos().find((p) => p.id === id)).filter((p): p is Photo => !!p) : publicPhotos(tag);
  if (!list.length) return null;
  return (
    <section className={`gallery3d py-16 sm:py-24 ${dark ? "bg-night text-[#e3eff5]" : ""}`} aria-labelledby={`g3d-${tag ?? ids?.[0]}`}>
      <div className="wrap">
        <p className={`eyebrow ${dark ? "!text-[#7FD0F2]" : ""}`}>{eyebrow}</p>
        <h2 id={`g3d-${tag ?? ids?.[0]}`} className={`display-lg mt-2 max-w-3xl ${dark ? "!text-white" : ""}`}>{title}</h2>
        {lede && <p className={`lede mt-3 max-w-2xl ${dark ? "!text-[#a3bccb]" : ""}`}>{lede}</p>}
      </div>
      <ul className="g3d-track" tabIndex={0} aria-label={`${title} (photos; scroll sideways for more)`}>
        {list.map((ph) => (
          <li key={ph.id} className="g3d-item">
            <figure className="g3d-card">
              <RealPhoto ph={ph} sizes="(min-width: 1024px) 560px, 80vw" className="g3d-img" />
              <figcaption className="g3d-cap">{ph.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
