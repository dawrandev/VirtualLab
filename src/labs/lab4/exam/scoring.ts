import { MAIN_STEPS, MAX_SCORE } from "./protocol";
import { ANTIBIOTICS, allDisksPlaced, sensitivityOf, type DiskState } from "../state";

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
  calls: Array<{ code: string; name: string; zoneMm: number; correct: "high" | "low"; picked: "high" | "low" | null; ok: boolean }>;
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
  const correctCount = ANTIBIOTICS.filter((a) => s.classified[a.id] === sensitivityOf(a.zoneMm)).length;

  const steps: StepResult[] = [];

  // 1 — lawn (gazon) spread
  {
    const notes: string[] = [];
    if (!s.lawnSpread) steps.push(grade("lawn", "zero", ["Kultura gazon usulida ekilmadi"]));
    else {
      if (!s.spatulaSterile) notes.push("Shpatel sterillanmagan");
      steps.push(grade("lawn", s.spatulaSterile ? "full" : "partial", notes));
    }
  }

  // 2 — antibiotic disks placed
  if (placedCount === 0) steps.push(grade("disks", "zero", ["Antibiotik disklari qo'yilmadi"]));
  else if (allDisksPlaced(s)) steps.push(grade("disks", "full", []));
  else steps.push(grade("disks", "partial", [`Faqat ${placedCount}/${ANTIBIOTICS.length} disk qo'yildi`]));

  // 3 — incubation
  steps.push(s.incubated ? grade("incubate", "full", []) : grade("incubate", "zero", ["Termostatga qo'yilmadi (24 soat inkubatsiya yo'q)"]));

  // 4 — zones measured / sensitivity determined for each disk
  if (classifiedCount === 0) steps.push(grade("measure", "zero", ["Zonalar o'lchanmadi / aniqlanmadi"]));
  else if (classifiedCount === ANTIBIOTICS.length) steps.push(grade("measure", "full", []));
  else steps.push(grade("measure", "partial", [`Faqat ${classifiedCount}/${ANTIBIOTICS.length} disk baholandi`]));

  // 5 — correct sensitivity classification (<10 low / >10 high)
  if (correctCount === 0) steps.push(grade("classify", "zero", ["Sezuvchanlik noto'g'ri aniqlandi"]));
  else if (correctCount === ANTIBIOTICS.length) steps.push(grade("classify", "full", []));
  else steps.push(grade("classify", "partial", [`${correctCount}/${ANTIBIOTICS.length} to'g'ri aniqlandi`]));

  const total = steps.reduce((a, x) => a + x.earned, 0);
  const calls = ANTIBIOTICS.map((a) => ({
    code: a.code,
    name: a.name,
    zoneMm: a.zoneMm,
    correct: sensitivityOf(a.zoneMm),
    picked: s.classified[a.id] ?? null,
    ok: s.classified[a.id] === sensitivityOf(a.zoneMm),
  }));

  return { total, max: MAX_SCORE, steps, calls };
}
