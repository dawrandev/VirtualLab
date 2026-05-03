import type { LabState, ScoreCriterion, ScoreState } from "./types";

export class ScoreEngine {
  private maxTotal: number;

  constructor(private rubric: ScoreCriterion[]) {
    this.maxTotal = rubric.reduce((sum, c) => sum + c.maxPoints, 0);
  }

  evaluate(state: LabState): ScoreState {
    const byCriterion: Record<string, number> = {};
    let total = 0;
    for (const c of this.rubric) {
      const raw = c.evaluator(state);
      const clamped = Math.min(c.maxPoints, Math.max(0, raw));
      byCriterion[c.id] = Number(clamped.toFixed(2));
      total += clamped;
    }
    const outOfTen =
      this.maxTotal === 0 ? 0 : Number(((total / this.maxTotal) * 10).toFixed(1));
    return {
      byCriterion,
      total: Number(total.toFixed(2)),
      outOfTen,
    };
  }

  get rubricMaxTotal(): number {
    return this.maxTotal;
  }
}

/**
 * Reference scoring helper for fixation pass count.
 * Mirrors /tmp/virtuallab_ref/.../lab1-bacterial-smear.js lines 2413-2420.
 *  - exactly 3 passes → 2.0
 *  - 2 or 4 passes → 1.0
 *  - 1 or 5 passes → 0.5
 *  - else → 0
 */
export function fixationScore(passes: number): number {
  if (passes === 3) return 2.0;
  if (passes === 2 || passes === 4) return 1.0;
  if (passes === 1 || passes === 5) return 0.5;
  return 0;
}

/** Washing-angle bonus from reference lines 2669-2679. */
export function washAngleBonus(angleDeg: number): number {
  if (angleDeg >= 40 && angleDeg <= 50) return 0.5;
  if (angleDeg >= 30 && angleDeg <= 60) return 0.3;
  return 0;
}
