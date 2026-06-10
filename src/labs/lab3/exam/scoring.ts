import { MAIN_STEPS, MAX_SCORE } from "./protocol";
import type { DrigalskiState } from "../state";

export interface ExamAction {
  intent: string;
  ts: number;
}

export type StepStatus = "full" | "partial" | "zero";

export interface StepResult {
  id: string;
  label: string;
  full: number;
  partial: number;
  earned: number;
  status: StepStatus;
  notes: string[];
}

export interface ExamResult {
  total: number;
  max: number;
  steps: StepResult[];
}

export function scoreDrigalskiExam(log: ExamAction[], s: DrigalskiState): ExamResult {
  const firstTs: Record<string, number> = {};
  for (const a of log) if (firstTs[a.intent] == null) firstTs[a.intent] = a.ts;
  const byId = Object.fromEntries(MAIN_STEPS.map((m) => [m.id, m]));

  const grade = (id: string, status: StepStatus, notes: string[]): StepResult => {
    const def = byId[id];
    const earned = status === "full" ? def.full : status === "partial" ? def.partial : 0;
    return { id, label: def.result, full: def.full, partial: def.partial, earned, status, notes };
  };

  const steps: StepResult[] = [];

  // 1 — three plates obtained
  steps.push(s.dishes ? grade("get-dishes", "full", []) : grade("get-dishes", "zero", ["lab3.score.dishesZero"]));

  // 2 — spreader dipped in alcohol + flamed sterile over the (hand-lit) lamp
  {
    if (!s.spatulaSterile) {
      steps.push(grade("sterilize", "zero", ["lab3.score.spatulaNotSterile"]));
    } else {
      const dippedFirst = firstTs["dip-spatula"] != null;
      steps.push(grade("sterilize", dippedFirst ? "full" : "partial", dippedFirst ? [] : ["lab3.score.noAlcohol"]));
    }
  }

  // 3 — plate 1: material dropped + spread with the sterile spreader
  {
    const notes: string[] = [];
    if (!s.d1.spread) {
      steps.push(grade("inoculate-1", "zero", ["lab3.score.d1Zero"]));
    } else {
      if (!s.spatulaSterile) notes.push("lab3.score.spatulaNotSterile");
      if (!s.d1.material) notes.push("lab3.score.noMaterial");
      steps.push(grade("inoculate-1", s.spatulaSterile && s.d1.material ? "full" : "partial", notes));
    }
  }

  // 4 — same spreader (not re-sterilized) on plates 2 & 3
  {
    const notes: string[] = [];
    const any = s.d2.spread || s.d3.spread;
    if (!any) {
      steps.push(grade("spread-23", "zero", ["lab3.score.spread23Zero"]));
    } else {
      if (!s.d2.spread) notes.push("lab3.score.spread2Zero");
      if (!s.d3.spread) notes.push("lab3.score.spread3Zero");
      const reSterilized = firstTs["sterilize-spatula"] != null && firstTs["spread-2"] != null && firstTs["sterilize-spatula"] > firstTs["spread-1"];
      if (reSterilized) notes.push("lab3.score.respread");
      steps.push(grade("spread-23", s.d2.spread && s.d3.spread && !reSterilized ? "full" : "partial", notes));
    }
  }

  // 5 — used spreader decontaminated in the 5% chlorine jar
  {
    if (!s.spatulaDisinfected) {
      steps.push(grade("disinfect", "zero", ["lab3.score.disinfectZero"]));
    } else {
      const afterSpread = firstTs["disinfect-spatula"] != null && firstTs["spread-3"] != null && firstTs["disinfect-spatula"] > firstTs["spread-3"];
      steps.push(grade("disinfect", afterSpread ? "full" : "partial", afterSpread ? [] : ["lab3.score.disinfectEarly"]));
    }
  }

  // 6 — incubate the three plates 18–24 h at 37 °C
  {
    if (!s.incubated) {
      steps.push(grade("incubate", "zero", ["lab3.score.incubateZero"]));
    } else {
      const allSpread = s.d1.spread && s.d2.spread && s.d3.spread;
      steps.push(grade("incubate", allSpread ? "full" : "partial", allSpread ? [] : ["lab3.score.incubatePartial"]));
    }
  }

  const total = steps.reduce((a, x) => a + x.earned, 0);
  return { total, max: MAX_SCORE, steps };
}
