import { MAIN_STEPS, MAX_SCORE, SPECIMEN } from "./protocol";
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
  classification: { picked: "positive" | "negative" | null; correct: "positive" | "negative"; isRight: boolean };
}

export function scoreDrigalskiExam(
  log: ExamAction[],
  s: DrigalskiState,
  classification: "positive" | "negative" | null,
): ExamResult {
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
  steps.push(s.dishes ? grade("get-dishes", "full", []) : grade("get-dishes", "zero", ["3 ta Petri idishi olinmadi"]));

  // 2 — plate 1: sterile spreader + material + spread
  {
    const notes: string[] = [];
    if (!s.d1.spread) {
      steps.push(grade("inoculate-1", "zero", ["1-idishga ekilmadi"]));
    } else {
      if (!s.spatulaSterile) notes.push("Shpatel oldindan sterillanmagan");
      if (!s.d1.material) notes.push("Tekshiriluvchi material solinmagan");
      steps.push(grade("inoculate-1", s.spatulaSterile && s.d1.material ? "full" : "partial", notes));
    }
  }

  // 3 — same spreader on plates 2 & 3 + incubate
  {
    const notes: string[] = [];
    const any = s.d2.spread || s.d3.spread;
    if (!any) {
      steps.push(grade("spread-23", "zero", ["2 va 3-idishlarga surtilmadi"]));
    } else {
      if (!s.d2.spread) notes.push("2-idishga surtilmadi");
      if (!s.d3.spread) notes.push("3-idishga surtilmadi");
      if (!s.incubated) notes.push("Termostatga qo'yilmadi (inkubatsiya yo'q)");
      const reSterilized = firstTs["sterilize-spatula"] != null && firstTs["spread-2"] != null && firstTs["sterilize-spatula"] > firstTs["spread-1"];
      if (reSterilized) notes.push("Shpatel 2-3 idish oldidan qayta sterillangan — suyultirish buziladi");
      steps.push(grade("spread-23", s.d2.spread && s.d3.spread && s.incubated && !reSterilized ? "full" : "partial", notes));
    }
  }

  // 4 — pick isolated colony, smear, Gram stain
  {
    const notes: string[] = [];
    const g = s.gram;
    const gramDone = g.gv && g.lugol && g.alcohol && g.fuchsin;
    if (!s.colonyPicked && !s.smeared) {
      steps.push(grade("pick-stain", "zero", ["Koloniya olinmadi / surtma tayyorlanmadi"]));
    } else {
      if (!s.colonyPicked) notes.push("Alohida koloniya olinmadi");
      if (!s.smeared) notes.push("Surtma tayyorlanmadi");
      if (!gramDone) notes.push("Gram bo'yash to'liq bajarilmadi (4 reaktiv: gensianviolet, lyugol, spirt, fuksin)");
      steps.push(grade("pick-stain", s.colonyPicked && s.smeared && gramDone ? "full" : "partial", notes));
    }
  }

  // 5 — microscopy + identification
  {
    if (!s.microscopeOpen) {
      steps.push(grade("microscopy", "zero", ["Mikroskopda ko'rilmadi"]));
    } else if (classification == null) {
      steps.push(grade("microscopy", "partial", ["Morfologik/tinktorial xususiyat aniqlanmadi"]));
    } else if (classification === SPECIMEN.gram) {
      steps.push(grade("microscopy", "full", []));
    } else {
      steps.push(grade("microscopy", "partial", ["Gram tegishliligi noto'g'ri aniqlandi"]));
    }
  }

  const total = steps.reduce((a, x) => a + x.earned, 0);
  return {
    total,
    max: MAX_SCORE,
    steps,
    classification: { picked: classification, correct: SPECIMEN.gram, isRight: classification === SPECIMEN.gram },
  };
}
