import type { Lab2DState, ScoreRule } from "./types";

/**
 * Runs the lab's score rules against the current state and returns earned
 * weight (0..weightSum) plus normalized 0..10. Pure — UI calls this on
 * demand when state changes.
 */
export function computeScore(state: Lab2DState, rules: ScoreRule[]): {
  earned: number;
  weightSum: number;
  outOfTen: number;
  satisfied: string[];
  missing: string[];
} {
  let earned = 0;
  let weightSum = 0;
  const satisfied: string[] = [];
  const missing: string[] = [];
  for (const r of rules) {
    weightSum += r.weight;
    if (r.predicate(state)) {
      earned += r.weight;
      satisfied.push(r.id);
    } else {
      missing.push(r.id);
    }
  }
  const outOfTen = weightSum === 0 ? 0 : Math.round((earned / weightSum) * 100) / 10;
  return { earned, weightSum, outOfTen, satisfied, missing };
}
