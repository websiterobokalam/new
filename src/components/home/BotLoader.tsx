"use client";
import dynamic from "next/dynamic";

/** Lazy scene: Try the Bot loads after hydration, outside the first-load budget. */
const TryTheBot = dynamic(() => import("./TryTheBot").then((m) => m.TryTheBot), {
  ssr: false,
  loading: () => <div className="card grid h-[420px] place-items-center text-muted">Loading the maze…</div>,
});

export function BotLoader() {
  return <TryTheBot />;
}
