import type { JourneyNode } from "@/lib/learn/journey";
import type { Dict } from "@/i18n/en";

const WORLDS = ["coding", "robotics", "iot", "ai", "finlit", "space"] as const;
const NAMES: Record<string, string> = { coding: "Coding", robotics: "Robotics", iot: "IoT", ai: "AI", finlit: "Money", space: "Space" };
const COLOR: Record<string, string> = { coding: "#0B2B3D", robotics: "#1AB0E2", iot: "#1590BC", ai: "#F7A21C", finlit: "#7A9E2C", space: "#0B4168" };
const W = 170, H = 120, NW = 140, NH = 64;

/**
 * Journey map: projects (nodes) linked by prerequisites (edges), drawn as
 * Kalam Line traces. Lanes are worlds; rows are levels. A text list follows
 * for screen readers and small screens.
 */
export function JourneyMap({ nodes, t }: { nodes: JourneyNode[]; t: Dict }) {
  const pos = new Map<string, { x: number; y: number }>();
  const slot = new Map<string, number>();
  for (const n of nodes) {
    const lane = WORLDS.indexOf(n.world as (typeof WORLDS)[number]);
    const key = `${lane}-${n.level}`;
    const k = slot.get(key) ?? 0;
    slot.set(key, k + 1);
    pos.set(n.id, { x: 20 + lane * W, y: 50 + (n.level - 1) * H * 1.5 + k * (NH + 14) });
  }
  const height = Math.max(...[...pos.values()].map((p) => p.y)) + NH + 30;
  const width = 20 + WORLDS.length * W;

  return (
    <div>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface" tabIndex={0} role="region" aria-label="Journey map (scrolls sideways)">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block" aria-hidden>
          <defs>
            <linearGradient id="jm-g" x1="0" x2="1"><stop offset="0" stopColor="#1AB0E2" /><stop offset=".5" stopColor="#5CC6EC" /><stop offset="1" stopColor="#97BC3D" /></linearGradient>
          </defs>
          {WORLDS.map((w, i) => (
            <text key={w} x={20 + i * W + NW / 2} y={28} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" letterSpacing="2" fill="var(--muted)">{NAMES[w].toUpperCase()}</text>
          ))}
          {nodes.flatMap((n) =>
            n.prerequisites.map((p) => {
              const a = pos.get(p), b = pos.get(n.id);
              if (!a || !b) return null;
              const built = nodes.find((x) => x.id === p)?.state === "built";
              const x1 = a.x + NW / 2, y1 = a.y + NH, x2 = b.x + NW / 2, y2 = b.y;
              return <path key={`${p}>${n.id}`} d={`M${x1} ${y1} C ${x1} ${y1 + 40}, ${x2} ${y2 - 40}, ${x2} ${y2}`} fill="none" stroke={built ? "url(#jm-g)" : "var(--line)"} strokeWidth={built ? 3 : 2} strokeDasharray={built ? undefined : "4 6"} />;
            }),
          )}
          {nodes.map((n) => {
            const p = pos.get(n.id)!;
            const c = COLOR[n.world];
            const fill = n.state === "built" ? c : "var(--surface)";
            const ink = n.state === "built" ? "#fff" : n.state === "locked" ? "var(--muted)" : "var(--heading)";
            return (
              <g key={n.id} transform={`translate(${p.x} ${p.y})`} opacity={n.state === "locked" ? 0.6 : 1}>
                {n.recommended && <rect x={-5} y={-5} width={NW + 10} height={NH + 10} rx={18} fill="none" stroke="#F7A21C" strokeWidth={3} />}
                <rect width={NW} height={NH} rx={14} fill={fill} stroke={c} strokeWidth={n.state === "available" ? 2.5 : 1.5} strokeDasharray={n.state === "locked" ? "4 4" : undefined} />
                <text x={12} y={26} fontFamily="var(--font-display)" fontWeight="700" fontSize="14" fill={ink}>{n.title.length > 17 ? n.title.slice(0, 16) + "…" : n.title}</text>
                <text x={12} y={46} fontFamily="var(--font-mono)" fontSize="10.5" fill={ink}>L{n.level} · {t[n.state]}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="Projects">
        {nodes.filter((n) => n.state !== "locked").concat(nodes.filter((n) => n.state === "locked")).map((n) => (
          <li key={n.id} className={`rounded-2xl border p-4 ${n.recommended ? "border-[#D9870A] bg-[#FEF3E2] dark:bg-[#2b2408]" : "border-line bg-surface"}`}>
            <p className="font-semibold text-heading">{n.recommended && <span className="mr-2 rounded-full bg-spark px-2 py-0.5 text-xs text-night">{t.next_up}</span>}{n.title}</p>
            <p className="text-sm text-muted">{NAMES[n.world]} · Level {n.level} · {t[n.state]}</p>
            <p className="mt-1 text-sm">{n.builds}</p>
            {n.state === "locked" && n.prerequisites.length > 0 && <p className="mt-1 text-xs text-muted">{t.needs}: {n.prerequisites.map((q) => nodes.find((x) => x.id === q)?.title).join(", ")}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
