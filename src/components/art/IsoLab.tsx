/**
 * Original isometric illustration of a Robokalam 21C lab, generated from
 * simple boxes so it stays crisp, tiny (no image request) and on-palette.
 * Stand-in until the real 3D lab renders arrive.
 */
const S = 12;
const C = 0.866;
type P = [number, number, number];
const iso = ([x, y, z]: P) => [(x - y) * C * S, (x + y) * 0.5 * S - z * S] as const;
const pts = (ps: P[]) => ps.map((p) => iso(p).map((n) => n.toFixed(1)).join(",")).join(" ");

type Tone = { top: string; left: string; right: string };
function Box({ x, y, z, w, d, h, tone, stroke = "none" }: { x: number; y: number; z: number; w: number; d: number; h: number; tone: Tone; stroke?: string }) {
  return (
    <g stroke={stroke} strokeWidth={stroke === "none" ? 0 : 0.6} strokeLinejoin="round">
      {/* face toward viewer, lower-left (y + d) */}
      <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={tone.left} />
      {/* face toward viewer, lower-right (x + w) */}
      <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={tone.right} />
      <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={tone.top} />
    </g>
  );
}

const T = {
  floor: { top: "#EAF6FB", left: "#C7E3EF", right: "#A9D2E3" },
  wall: { top: "#FFFFFF", left: "#F4FAFD", right: "#E3F1F8" },
  bench: { top: "#FFFFFF", left: "#D6EAF3", right: "#BCDCEA" },
  navy: { top: "#1B6A93", left: "#0A4060", right: "#08324B" },
  aqua: { top: "#5FE3EA", left: "#00CBD6", right: "#00A9B3" },
  leaf: { top: "#C2DA7E", left: "#98B844", right: "#7E9C30" },
  spark: { top: "#FFE46B", left: "#FFD31D", right: "#E6BB00" },
  pcb: { top: "#2E8B57", left: "#24704A", right: "#1B5A3A" },
  sky: { top: "#5CC2EE", left: "#0098D6", right: "#0080B4" },
};

export function IsoLab({ className = "", idp = "iso" }: { className?: string; idp?: string }) {
  const floorLine = pts([[4, 37, 0.05], [4, 20, 0.05], [7, 17, 0.05], [7, 5, 0.05], [24, 5, 0.05], [24, 3, 0.05]]);
  const boardTrace = pts([[7, 1.05, 7], [10, 1.05, 7], [10, 1.05, 11], [14, 1.05, 11], [14, 1.05, 9], [18, 1.05, 9]]);
  return (
    <svg viewBox="-440 -250 880 720" className={className} role="img" aria-label="Illustration of a Robokalam STEM and AI lab: benches, robots, a satellite model, circuit boards and kit shelves">
      <defs>
        <linearGradient id={`${idp}-k`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0098D6" /><stop offset=".5" stopColor="#00CBD6" /><stop offset="1" stopColor="#98B844" />
        </linearGradient>
        <radialGradient id={`${idp}-shadow`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#0A4060" stopOpacity=".22" /><stop offset="1" stopColor="#0A4060" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="470" rx="380" ry="40" fill={`url(#${idp}-shadow)`} />
      <Box x={0} y={0} z={-2} w={40} d={40} h={2} tone={T.floor} />
      {/* walls */}
      <Box x={0} y={0} z={0} w={40} d={1} h={18} tone={T.wall} />
      <Box x={0} y={1} z={0} w={1} d={39} h={18} tone={T.wall} />
      {/* whiteboard with circuit trace on back wall */}
      <polygon points={pts([[5, 1.04, 5], [20, 1.04, 5], [20, 1.04, 14], [5, 1.04, 14]])} fill="#FFFFFF" stroke="#CFE4EE" strokeWidth="1.2" />
      <polyline points={boardTrace} fill="none" stroke={`url(#${idp}-k)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[[7, 7], [18, 9], [14, 11]].map(([x, z], i) => (
        <circle key={i} cx={iso([x, 1.05, z])[0]} cy={iso([x, 1.05, z])[1]} r="4.5" fill={i === 1 ? "#98B844" : "#00CBD6"} />
      ))}
      {/* orbit poster on side wall */}
      <polygon points={pts([[1.04, 24, 6], [1.04, 34, 6], [1.04, 34, 14], [1.04, 24, 14]])} fill="#0A4060" />
      <ellipse cx={iso([1.04, 29, 10])[0]} cy={iso([1.04, 29, 10])[1]} rx="40" ry="14" fill="none" stroke="#00CBD6" strokeWidth="1.6" transform={`rotate(-30 ${iso([1.04, 29, 10])[0]} ${iso([1.04, 29, 10])[1]})`} />
      <circle cx={iso([1.04, 29, 10])[0]} cy={iso([1.04, 29, 10])[1]} r="7" fill="#FFD31D" />
      {/* kit shelves */}
      <Box x={1} y={10} z={0} w={3} d={10} h={9} tone={T.bench} />
      {[0, 1, 2].map((i) => (
        <Box key={i} x={1.6} y={11 + i * 3} z={9} w={2} d={2.4} h={1.6} tone={[T.sky, T.leaf, T.spark][i]} />
      ))}
      {/* Kalam Line on the floor */}
      <polyline points={floorLine} fill="none" stroke={`url(#${idp}-k)`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
      {/* bench 1: monitor + circuit board */}
      <Box x={9} y={8} z={0} w={15} d={6} h={6} tone={T.bench} />
      <Box x={11} y={8.6} z={6} w={5} d={0.6} h={4.4} tone={T.navy} />
      <polygon points={pts([[11.3, 9.22, 6.4], [15.7, 9.22, 6.4], [15.7, 9.22, 10.1], [11.3, 9.22, 10.1]])} fill="#00CBD6" opacity=".9" />
      <polyline points={pts([[11.8, 9.25, 7.4], [13, 9.25, 8.6], [14, 9.25, 7.6], [15.2, 9.25, 9.3]])} fill="none" stroke="#fff" strokeWidth="1.6" />
      <Box x={17.5} y={9.5} z={6} w={4.5} d={3.4} h={0.35} tone={T.pcb} />
      <polyline points={pts([[18, 10, 6.4], [20, 10, 6.4], [20, 12, 6.4], [21.5, 12, 6.4]])} fill="none" stroke="#FFD31D" strokeWidth="1.2" />
      <Box x={19.6} y={10.6} z={6.35} w={1.2} d={1} h={0.5} tone={T.navy} />
      {/* bench 2: robot + satellite */}
      <Box x={9} y={21} z={0} w={15} d={6} h={6} tone={T.bench} />
      <Box x={11} y={22.5} z={6} w={3.4} d={3} h={2.6} tone={T.navy} />
      <Box x={11.5} y={22.9} z={8.6} w={2.4} d={2.2} h={2} tone={T.sky} />
      {[12.2, 13.3].map((x) => {
        const [cx, cy] = iso([x, 25.12, 9.8]);
        return <circle key={x} cx={cx} cy={cy} r="3" fill="#fff" />;
      })}
      <line x1={iso([12.7, 24, 10.6])[0]} y1={iso([12.7, 24, 10.6])[1]} x2={iso([12.7, 24, 12.4])[0]} y2={iso([12.7, 24, 12.4])[1]} stroke="#0A4060" strokeWidth="1.6" />
      <circle cx={iso([12.7, 24, 12.6])[0]} cy={iso([12.7, 24, 12.6])[1]} r="3.4" fill="#FFD31D" />
      <Box x={17} y={23} z={6} w={0.6} d={0.6} h={2.5} tone={T.navy} />
      <Box x={16.4} y={22.4} z={8.5} w={1.8} d={1.8} h={1.8} tone={T.spark} />
      <Box x={14.2} y={22.9} z={9.1} w={2.2} d={0.8} h={0.15} tone={T.sky} />
      <Box x={18.2} y={22.9} z={9.1} w={2.2} d={0.8} h={0.15} tone={T.sky} />
      {/* bench 3 */}
      <Box x={28} y={8} z={0} w={8} d={6} h={6} tone={T.bench} />
      <Box x={30} y={9} z={6} w={4} d={3} h={0.4} tone={T.leaf} />
      <Box x={31} y={9.6} z={6.4} w={1.2} d={1.2} h={1.6} tone={T.aqua} />
      {/* floor rover */}
      <Box x={29} y={26} z={0.8} w={5} d={4} h={2} tone={T.navy} />
      <Box x={30} y={26.8} z={2.8} w={3} d={2.4} h={1.2} tone={T.aqua} />
      {[[29.4, 30], [33.2, 30]].map(([x, y], i) => {
        const [cx, cy] = iso([x, y, 0.8]);
        return <ellipse key={i} cx={cx} cy={cy} rx="7" ry="8" fill="#0B2B3D" />;
      })}
      {/* nodes */}
      {[[4, 37], [7, 17], [24, 3]].map(([x, y], i) => {
        const [cx, cy] = iso([x, y, 0.06]);
        return <ellipse key={i} cx={cx} cy={cy} rx="7" ry="4" fill={i === 2 ? "#98B844" : "#00CBD6"} />;
      })}
    </svg>
  );
}
