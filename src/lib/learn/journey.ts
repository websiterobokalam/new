import type { Tx } from "../db";

export type NodeState = "built" | "started" | "available" | "locked";
export type JourneyNode = { id: string; world: string; level: number; title: string; builds: string; prerequisites: string[]; state: NodeState; recommended: boolean; ageOk: boolean };

const BAND_MIN: Record<string, number> = { "6-8": 6, "9-11": 9, "12-14": 12, "15-17": 15, "18+": 18 };

/**
 * Journey: levels are real projects linked by prerequisites. Recommendations
 * come only from completed work and the interests a parent stated. No
 * behavioural profiling.
 */
export function buildJourney(
  projects: { id: string; world: string; level: number; title: string; builds: string; prerequisites: string[]; age_min: number }[],
  progress: Record<string, "built" | "started">,
  interests: string[],
  ageBand: string,
): JourneyNode[] {
  const age = BAND_MIN[ageBand] ?? 6;
  const nodes: JourneyNode[] = projects.map((p) => {
    const ageOk = age + 2 >= p.age_min; // band lower bound, allow the top of the band
    const prereqsMet = p.prerequisites.every((q) => progress[q] === "built");
    const state: NodeState = (progress[p.id] as NodeState | undefined) ?? (prereqsMet && ageOk ? "available" : "locked");
    return { id: p.id, world: p.world, level: p.level, title: p.title, builds: p.builds, prerequisites: p.prerequisites, state, recommended: false, ageOk };
  });
  const avail = nodes.filter((n) => n.state === "available");
  const pick = avail.filter((n) => interests.includes(n.world)).sort((a, b) => a.level - b.level)[0] ?? avail.sort((a, b) => a.level - b.level)[0];
  if (pick) pick.recommended = true;
  return nodes;
}

export async function loadJourney(c: Tx, learner: { id: string; interests: string[]; age_band: string }) {
  const p = await c.query("SELECT id, world, level, title, builds, prerequisites, age_min FROM projects ORDER BY world, level, id");
  const g = await c.query("SELECT project_id, status FROM learner_progress WHERE learner_id = $1", [learner.id]);
  const progress = Object.fromEntries(g.rows.map((r) => [r.project_id, r.status]));
  return buildJourney(p.rows, progress, learner.interests, learner.age_band);
}

/** Plain-language progress for parents. */
export function plainProgress(name: string, nodes: JourneyNode[]) {
  const built = nodes.filter((n) => n.state === "built");
  const next = nodes.find((n) => n.recommended);
  const parts = [built.length === 0 ? `${name} hasn't finished a build yet.` : `${name} has built ${built.length} project${built.length === 1 ? "" : "s"}: ${built.map((b) => b.title).join(", ")}.`];
  if (next) parts.push(`Next up: ${next.title} (${next.builds.toLowerCase()}).`);
  return parts.join(" ");
}
