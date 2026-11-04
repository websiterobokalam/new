"use client";
import { useRef, useState } from "react";
import { KalamBot } from "../art/Small";

/**
 * Try the Bot: snap 3 to 5 blocks, drive the robot through a small maze, see
 * the Python. No login. Nothing is stored or sent anywhere.
 */
type Block = "F" | "F2" | "L" | "R";
const BLOCKS: Record<Block, { label: string; py: string; color: string }> = {
  F: { label: "Forward", py: "robot.forward()", color: "bg-sky text-white" },
  F2: { label: "Forward ×2", py: "robot.forward(2)", color: "bg-[#075a80] text-white" },
  L: { label: "Turn left", py: "robot.turn_left()", color: "bg-leaf text-night" },
  R: { label: "Turn right", py: "robot.turn_right()", color: "bg-aqua text-night" },
};
const SIZE = 5;
const START = { x: 0, y: 4, dir: 0 }; // dir: 0 east, 1 north, 2 west, 3 south
const GOAL = { x: 3, y: 1 };
const WALLS = new Set(["1,2", "2,2", "0,1", "4,3", "2,0", "4,1", "1,0"]);
const MAX = 5;
const DX = [1, 0, -1, 0];
const DY = [0, -1, 0, 1];

type State = { x: number; y: number; dir: number };

export function TryTheBot() {
  const [prog, setProg] = useState<Block[]>([]);
  const [bot, setBot] = useState<State>(START);
  const [status, setStatus] = useState<"idle" | "running" | "win" | "bump" | "short">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>[]>([]);

  function add(b: Block) {
    if (prog.length >= MAX || status === "running") return;
    setProg([...prog, b]);
    setStatus("idle");
  }
  function reset(clear = false) {
    timer.current.forEach(clearTimeout);
    setBot(START);
    setStatus("idle");
    if (clear) setProg([]);
  }
  function run() {
    if (prog.length < 3) return setStatus("short");
    reset();
    setStatus("running");
    // expand to single steps
    const steps: ("F" | "L" | "R")[] = prog.flatMap((b) => (b === "F2" ? ["F", "F"] : [b])) as ("F" | "L" | "R")[];
    let s: State = { ...START };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dt = reduced ? 60 : 420;
    let ended = false;
    steps.forEach((st, i) => {
      timer.current.push(
        setTimeout(() => {
          if (ended) return;
          if (st === "L") s = { ...s, dir: (s.dir + 1) % 4 };
          else if (st === "R") s = { ...s, dir: (s.dir + 3) % 4 };
          else {
            const nx = s.x + DX[s.dir];
            const ny = s.y + DY[s.dir];
            if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || WALLS.has(`${nx},${ny}`)) {
              ended = true;
              setStatus("bump");
              return;
            }
            s = { ...s, x: nx, y: ny };
          }
          setBot(s);
          if (i === steps.length - 1) setStatus(s.x === GOAL.x && s.y === GOAL.y ? "win" : "idle");
          if (s.x === GOAL.x && s.y === GOAL.y) { ended = true; setStatus("win"); }
        }, dt * (i + 1)),
      );
    });
  }

  const py = ["from robokalam import Robot", "", "robot = Robot()", ...prog.map((b) => BLOCKS[b].py)];
  const msg = {
    idle: prog.length ? "Press Run to drive the bot." : "Snap 3 to 5 blocks to reach the green square.",
    running: "Driving…",
    win: "You did it. That is real Python, and you just wrote it.",
    bump: "Bump! The bot hit a wall. Change a block and run again.",
    short: "Add at least 3 blocks first.",
  }[status];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="card p-4 sm:p-6">
        <div className="relative mx-auto aspect-square w-full max-w-[340px] rounded-2xl bg-panel p-1.5" role="img" aria-label={`Maze. Robot at column ${bot.x + 1}, row ${bot.y + 1}. Goal at column ${GOAL.x + 1}, row ${GOAL.y + 1}.`}>
          <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-1.5">
            {Array.from({ length: SIZE * SIZE }).map((_, i) => {
              const x = i % SIZE, y = Math.floor(i / SIZE);
              const wall = WALLS.has(`${x},${y}`);
              const goal = x === GOAL.x && y === GOAL.y;
              return <div key={i} className={`rounded-lg ${wall ? "bg-navy" : goal ? "bg-leaf" : "bg-surface"}`} />;
            })}
          </div>
          <div className="absolute left-1.5 top-1.5 h-[calc((100%-12px-24px)/5)] w-[calc((100%-12px-24px)/5)] transition-transform duration-300 ease-out"
            style={{ transform: `translate(calc(${bot.x} * (100% + 6px)), calc(${bot.y} * (100% + 6px)))` }} aria-hidden>
            <div className="relative h-full w-full p-1">
              <KalamBot className="h-full w-full" mood={status === "win" ? "wave" : "idle"} />
              <svg viewBox="0 0 20 20" className="absolute -right-1 -top-1 h-1/3 w-1/3 transition-transform duration-300" style={{ transform: `rotate(${-bot.dir * 90}deg)` }}>
                <circle cx="10" cy="10" r="10" fill="#FFD31D" /><path d="M6 10h8m-3-3 3 3-3 3" stroke="#00445F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-heading" role="status" aria-live="polite">{msg}</p>
      </div>

      <div className="grid gap-4">
        <div className="card p-4 sm:p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">Blocks</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(BLOCKS) as Block[]).map((b) => (
              <button key={b} type="button" onClick={() => add(b)} disabled={prog.length >= MAX || status === "running"}
                className={`min-h-11 rounded-xl px-4 py-2 font-semibold shadow-sm transition active:scale-95 disabled:opacity-40 ${BLOCKS[b].color}`}>
                + {BLOCKS[b].label}
              </button>
            ))}
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted">Your program ({prog.length}/{MAX})</p>
          <ol className="mt-2 flex min-h-12 flex-wrap gap-2" aria-label="Your program">
            {prog.length === 0 && <li className="text-sm text-muted">Empty. Tap a block to snap it in.</li>}
            {prog.map((b, i) => (
              <li key={i}>
                <button type="button" onClick={() => status !== "running" && setProg(prog.filter((_, j) => j !== i))}
                  className={`min-h-10 rounded-xl px-3 py-1.5 text-sm font-semibold ${BLOCKS[b].color}`} aria-label={`Step ${i + 1}: ${BLOCKS[b].label}. Remove`}>
                  {i + 1}. {BLOCKS[b].label} <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={run} disabled={status === "running"} className="btn btn-primary">▶ Run</button>
            <button type="button" onClick={() => reset(true)} className="btn btn-ghost">Clear</button>
          </div>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-card)] bg-night p-4 sm:p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-[#7FD0F2]">Python, live</p>
          <pre className="mt-2 overflow-x-auto font-mono text-sm leading-relaxed text-[#e3eff5]"><code>{py.join("\n")}</code></pre>
        </div>
      </div>
    </div>
  );
}
