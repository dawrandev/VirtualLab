import { MAIN_STEPS, MAX_SCORE } from "./protocol";
import { SPECIMEN, type Motility, type WetMountState } from "../state";

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

export function scoreWetMountExam(_log: ExamAction[], s: WetMountState, correctMotility: Motility = SPECIMEN.motility): ExamResult {
  const byId = Object.fromEntries(MAIN_STEPS.map((m) => [m.id, m]));
  const grade = (id: string, status: StepStatus, notes: string[]): StepResult => {
    const def = byId[id];
    const earned = status === "full" ? def.full : status === "partial" ? def.partial : 0;
    return { id, label: def.result, full: def.full, partial: def.partial, earned, status, notes };
  };

  const steps: StepResult[] = [];

  // 1 — degrease the slide
  steps.push(s.slideDegreased ? grade("degrease", "full", []) : grade("degrease", "zero", ["lab5.score.degreaseZero"]));

  // 2 — saline drop
  steps.push(s.salineApplied ? grade("saline", "full", []) : grade("saline", "zero", ["lab5.score.salineZero"]));

  // 3 — sterilise loop + take culture
  if (!s.loopCharged && !s.mixed) steps.push(grade("loop", "zero", ["lab5.score.loopZero"]));
  else if (!s.loopFlamed) steps.push(grade("loop", "partial", ["lab5.score.loopPartial"]));
  else steps.push(grade("loop", "full", []));

  // 4 — mix to an even suspension
  steps.push(s.mixed ? grade("mix", "full", []) : grade("mix", "zero", ["lab5.score.mixZero"]));

  // 5 — cover slip + blot excess
  if (!s.coverPlaced) steps.push(grade("cover", "zero", ["lab5.score.coverZero"]));
  else if (!s.blotted) steps.push(grade("cover", "partial", ["lab5.score.coverPartial"]));
  else steps.push(grade("cover", "full", []));

  // 6 — microscopy + motility call
  if (!s.observed) steps.push(grade("micro", "zero", ["lab5.score.microZero"]));
  else if (s.motilePick == null) steps.push(grade("micro", "partial", ["lab5.score.microNoPick"]));
  else if (s.motilePick !== correctMotility) steps.push(grade("micro", "partial", ["lab5.score.microWrong"]));
  else steps.push(grade("micro", "full", []));

  const total = steps.reduce((a, x) => a + x.earned, 0);
  return { total, max: MAX_SCORE, steps };
}
