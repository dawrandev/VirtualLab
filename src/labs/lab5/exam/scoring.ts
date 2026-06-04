import { MAIN_STEPS, MAX_SCORE } from "./protocol";
import { SPECIMEN, type WetMountState } from "../state";

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

export function scoreWetMountExam(_log: ExamAction[], s: WetMountState): ExamResult {
  const byId = Object.fromEntries(MAIN_STEPS.map((m) => [m.id, m]));
  const grade = (id: string, status: StepStatus, notes: string[]): StepResult => {
    const def = byId[id];
    const earned = status === "full" ? def.full : status === "partial" ? def.partial : 0;
    return { id, label: def.result, full: def.full, partial: def.partial, earned, status, notes };
  };

  const steps: StepResult[] = [];

  // 1 — degrease the slide
  steps.push(s.slideDegreased ? grade("degrease", "full", []) : grade("degrease", "zero", ["Buyum oynasi olovda yog'sizlantirilmadi"]));

  // 2 — saline drop
  steps.push(s.salineApplied ? grade("saline", "full", []) : grade("saline", "zero", ["Fiziologik eritma tomizilmadi"]));

  // 3 — sterilise loop + take culture
  if (!s.loopCharged && !s.mixed) steps.push(grade("loop", "zero", ["Kulturadan olinmadi"]));
  else if (!s.loopFlamed) steps.push(grade("loop", "partial", ["Halqa sterillanmagan holda ishlatildi"]));
  else steps.push(grade("loop", "full", []));

  // 4 — mix to an even suspension
  steps.push(s.mixed ? grade("mix", "full", []) : grade("mix", "zero", ["Kultura tomchiga aralashtirilmadi"]));

  // 5 — cover slip + blot excess
  if (!s.coverPlaced) steps.push(grade("cover", "zero", ["Qoplag'ich oyna qo'yilmadi"]));
  else if (!s.blotted) steps.push(grade("cover", "partial", ["Ortiqcha suyuqlik filtr qog'oz bilan olinmadi"]));
  else steps.push(grade("cover", "full", []));

  // 6 — microscopy + motility call
  if (!s.observed) steps.push(grade("micro", "zero", ["Preparat mikroskopda ko'rilmadi"]));
  else if (s.motilePick == null) steps.push(grade("micro", "partial", ["Harakatchanlik aniqlanmadi"]));
  else if (s.motilePick !== SPECIMEN.motility) steps.push(grade("micro", "partial", ["Harakatchanlik noto'g'ri aniqlandi"]));
  else steps.push(grade("micro", "full", []));

  const total = steps.reduce((a, x) => a + x.earned, 0);
  return { total, max: MAX_SCORE, steps };
}
