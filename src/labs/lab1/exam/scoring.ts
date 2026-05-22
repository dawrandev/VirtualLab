import type { Lab2DState } from "@/engine2d/types";
import {
  MAIN_STEPS,
  DETAIL_RULES,
  PLANNING_POINTS,
  PENALTY_PER,
  PENALTY_CAP,
  type ExamAction,
  type ExamContext,
} from "./protocol";

export type StepStatus = "ok" | "order" | "missing";

export interface StepResult {
  id: string;
  label: string;
  max: number;
  earned: number;
  status: StepStatus;
  /** True when performed with NONE of its prerequisites met (gross/premature). */
  gross: boolean;
}

export interface DetailResult {
  id: string;
  label: string;
  max: number;
  earned: number;
  ok: boolean;
}

export interface PlanningResult {
  earned: number;
  max: number;
  correct: number;
  total: number;
}

export interface ExamResult {
  total: number; // 0..10
  planning: PlanningResult;
  steps: StepResult[];
  details: DetailResult[];
  penalty: number;
  /** Labels of gross/premature actions (for the breakdown). */
  grossLabels: string[];
}

/** Longest common subsequence length of two id arrays. */
function lcsLen(a: string[], b: string[]): number {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[n][m];
}

export interface FinishContext {
  loopOnStand: boolean;
  tubeInRack: boolean;
}

/** Builds the evaluation context from the recorded action log + final state. */
export function buildContext(log: ExamAction[], state: Lab2DState, fin: FinishContext): ExamContext {
  const firstTs: Record<string, number> = {};
  const count: Record<string, number> = {};
  let sampleLoopHeat: number | null = null;
  for (const a of log) {
    if (firstTs[a.intent] == null) firstTs[a.intent] = a.ts;
    count[a.intent] = (count[a.intent] ?? 0) + 1;
    if (a.intent === "take-sample" && sampleLoopHeat == null && a.loopHeat != null) {
      sampleLoopHeat = a.loopHeat;
    }
  }
  return {
    log,
    state,
    firstTs,
    count,
    loopOnStand: fin.loopOnStand,
    tubeInRack: fin.tubeInRack,
    sampleLoopHeat,
  };
}

/**
 * Full exam score from the planned card order, the execution log and final
 * state. Pure — the result UI renders the returned breakdown directly.
 */
export function scoreExam(
  plannedOrder: string[],
  log: ExamAction[],
  state: Lab2DState,
  fin: FinishContext,
): ExamResult {
  const canonical = MAIN_STEPS.map((s) => s.id);
  const ctx = buildContext(log, state, fin);

  // --- Planning: longest correctly-ordered subsequence of the canonical order.
  const correct = lcsLen(plannedOrder, canonical);
  const planning: PlanningResult = {
    earned: Math.round((correct / canonical.length) * PLANNING_POINTS * 100) / 100,
    max: PLANNING_POINTS,
    correct,
    total: canonical.length,
  };

  // --- Execution main steps: full if all prerequisites preceded it, half if
  //     out of order, zero if never performed. None-of-prereqs-met = gross.
  let penaltyCount = 0;
  const grossLabels: string[] = [];
  const steps: StepResult[] = MAIN_STEPS.map((s) => {
    const ts = ctx.firstTs[s.id];
    if (ts == null) {
      return { id: s.id, label: s.result, max: s.points, earned: 0, status: "missing", gross: false };
    }
    const metBefore = s.requires.filter((r) => ctx.firstTs[r] != null && ctx.firstTs[r] < ts);
    const allMet = metBefore.length === s.requires.length;
    if (allMet) {
      return { id: s.id, label: s.result, max: s.points, earned: s.points, status: "ok", gross: false };
    }
    const gross = s.requires.length > 0 && metBefore.length === 0;
    if (gross) {
      penaltyCount += 1;
      grossLabels.push(s.result);
    }
    return { id: s.id, label: s.result, max: s.points, earned: Math.round((s.points / 2) * 100) / 100, status: "order", gross };
  });

  // --- Technique details.
  const details: DetailResult[] = DETAIL_RULES.map((d) => {
    const ok = d.ok(ctx);
    return { id: d.id, label: d.label, max: d.points, earned: ok ? d.points : 0, ok };
  });

  const penalty = Math.min(PENALTY_CAP, penaltyCount * PENALTY_PER);
  const raw =
    planning.earned +
    steps.reduce((a, s) => a + s.earned, 0) +
    details.reduce((a, d) => a + d.earned, 0) -
    penalty;
  const total = Math.max(0, Math.min(10, Math.round(raw * 10) / 10));

  return { total, planning, steps, details, penalty, grossLabels };
}
