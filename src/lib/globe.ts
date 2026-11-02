/**
 * The Robokalam binary globe, generated as SVG primitives so it is crisp at
 * any size: rows of 0s and 1s wrapped onto a sphere. Digits shrink and squash
 * toward the edge, like the logo. Colours: mostly navy, with green, orange
 * and cyan accents.
 */
export const BRAND = { navy: "#0B4168", cyan: "#1AB0E2", green: "#97BC3D", orange: "#F7A21C" };

export type Digit = { x: number; y: number; size: number; sx: number; rot: number; ch: "0" | "1"; color: string; opacity: number };

export function globeDigits(r = 50): Digit[] {
  const out: Digit[] = [];
  const rows = 10;
  // Fixed pseudo-random sequence so the globe is identical on server and client.
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < rows; i++) {
    const lat = -Math.PI / 2 + ((i + 0.5) / rows) * Math.PI; // -90..90
    const y = Math.sin(lat) * r * 0.95;
    const ringR = Math.cos(lat) * r;
    const size = Math.max(5, 16.5 * Math.cos(lat) ** 0.55);
    const cols = Math.max(4, Math.round((2 * ringR) / (size * 0.5)));
    for (let j = 0; j < cols; j++) {
      const lon = -Math.PI / 2 + ((j + 0.5) / cols) * Math.PI; // front hemisphere
      const x = Math.sin(lon) * ringR;
      const sx = Math.max(0.22, Math.cos(lon) ** 0.9); // squash toward the limb
      const roll = rnd();
      const color = roll < 0.1 ? BRAND.green : roll < 0.17 ? BRAND.orange : roll < 0.23 ? BRAND.cyan : BRAND.navy;
      const big = Math.abs(lon) < 0.6 && Math.abs(lat) < 0.55;
      out.push({ x, y, size: big ? size * 1.15 : size * (0.8 + 0.25 * sx), sx, rot: (x / r) * (y / r) * -40 + (x / r) * 8, ch: rnd() < 0.5 ? "0" : "1", color, opacity: 0.7 + 0.3 * sx });
    }
  }
  return out;
}

/** Standalone SVG string (favicon, manifest icon, share images). */
export function globeSvg(size = 64, bg = "none") {
  const d = globeDigits(50);
  const body = d.map((g) => `<text x="0" y="0" transform="translate(${(g.x + 50).toFixed(2)} ${(g.y + 50 + g.size * 0.36).toFixed(2)}) rotate(${g.rot.toFixed(1)}) scale(${g.sx.toFixed(2)} 1)" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${g.size.toFixed(1)}" fill="${g.color}" fill-opacity="${g.opacity.toFixed(2)}">${g.ch}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${bg !== "none" ? `<rect width="100" height="100" rx="22" fill="${bg}"/>` : ""}<clipPath id="c"><circle cx="50" cy="50" r="50"/></clipPath><g clip-path="url(#c)">${body}</g></svg>`;
}
