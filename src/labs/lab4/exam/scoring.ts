import { MAIN_STEPS, MAX_SCORE } from "./protocol";
import { ANTIBIOTICS, allDisksPlaced, interpret, type DiskState, type Sens } from "../state";

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
  /** Per-antibiotic correctness for the breakdown. */
  calls: Array<{ code: string; abId: string; zoneMm: number; correct: Sens; picked: Sens | null; ok: boolean }>;
}

export function scoreDiskExam(log: ExamAction[], s: DiskState): ExamResult {
  const byId = Object.fromEntries(MAIN_STEPS.map((m) => [m.id, m]));
  const grade = (id: string, status: StepStatus, notes: string[]): StepResult => {
    const def = byId[id];
    const earned = status === "full" ? def.full : status === "partial" ? def.partial : 0;
    return { id, label: def.result, full: def.full, partial: def.partial, earned, status, notes };
  };

  const placedCount = ANTIBIOTICS.filter((a) => s.disks[a.id]).length;
  const classifiedCount = ANTIBIOTICS.filter((a) => s.classified[a.id] != null).length;
  const correctCount = ANTIBIOTICS.filter((a) => s.classified[a.id] === interpret(a)).length;

  const steps: StepResult[] = [];

  // 1 — lawn (gazon) swab in 3 directions + drying
  {
    const notes: string[] = [];
    if (s.lawnPasses === 0) steps.push(grade("lawn", "zero", ["lab4.score.lawnZero"]));
    else {
      if (!s.lawnSpread) notes.push("lab4.score.lawnIncomplete");
      if (!s.dried) notes.push("lab4.score.notDried");
      steps.push(grade("lawn", s.lawnSpread && s.dried ? "full" : "partial", notes));
    }
  }

  // 2 — antibiotic disks placed (with flame-sterile forceps)
  if (placedCount === 0) steps.push(grade("disks", "zero", ["lab4.score.disksZero"]));
  else {
    const notes: string[] = [];
    if (!s.forcepsSterile) notes.push("lab4.score.forcepsNotSterile");
    if (!allDisksPlaced(s)) notes.push("lab4.score.disksIncomplete");
    steps.push(grade("disks", allDisksPlaced(s) && s.forcepsSterile ? "full" : "partial", notes));
  }

  // 3 — incubation
  steps.push(s.incubated ? grade("incubate", "full", []) : grade("incubate", "zero", ["lab4.score.incubateZero"]));

  // 4 — zones measured / sensitivity determined for each disk
  if (classifiedCount === 0) steps.push(grade("measure", "zero", ["lab4.score.measureZero"]));
  else if (classifiedCount === ANTIBIOTICS.length) steps.push(grade("measure", "full", []));
  else steps.push(grade("measure", "partial", ["lab4.score.measureIncomplete"]));

  // 5 — correct sensitivity classification
  if (correctCount === 0) steps.push(grade("classify", "zero", ["lab4.score.classifyZero"]));
  else if (correctCount === ANTIBIOTICS.length) steps.push(grade("classify", "full", []));
  else steps.push(grade("classify", "partial", ["lab4.score.classifyPartial"]));

  const total = steps.reduce((a, x) => a + x.earned, 0);
  const calls = ANTIBIOTICS.map((a) => {
    const correct = interpret(a);
    const picked = s.classified[a.id] ?? null;
    return { code: a.code, abId: a.id, zoneMm: a.zoneMm, correct, picked, ok: picked === correct };
  });

  return { total, max: MAX_SCORE, steps, calls };
}
