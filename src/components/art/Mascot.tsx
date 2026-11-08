/**
 * The Robokalam mascot: the official robot character (thumbs up, cape, the
 * binary globe on its chest). Use this everywhere a robot character appears.
 * Assets: /brand/mascot{,-600,-300}.webp (full figure, transparent) and
 * /brand/mascot-head{,-96}.webp (head only, for small sizes).
 */
export function Mascot({ className = "", sizes = "(min-width: 1024px) 420px, 60vw", float = true, priority = false, alt = "" }: { className?: string; sizes?: string; float?: boolean; priority?: boolean; alt?: string }) {
  return (
    <img
      src="/brand/mascot-600.webp"
      srcSet="/brand/mascot-300.webp 242w, /brand/mascot-600.webp 483w, /brand/mascot.webp 967w"
      sizes={sizes}
      width={967}
      height={1200}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`mascot select-none ${float ? "mascot-float" : ""} ${className}`}
    />
  );
}

/** Just the mascot's head, for small places (the scroll line, the maze game, icons). */
export function MascotHead({ className = "", big = false }: { className?: string; big?: boolean }) {
  return <img src={big ? "/brand/mascot-head.webp" : "/brand/mascot-head-96.webp"} width={big ? 256 : 96} height={big ? 216 : 81} alt="" aria-hidden decoding="async" draggable={false} className={`select-none ${className}`} />;
}
