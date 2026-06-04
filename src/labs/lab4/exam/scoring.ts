import { MAIN_STEPS, MAX_SCORE } from "./protocol";
import { ANTIBIOTICS, allDisksPlaced, interpret, SENS_LABEL, type DiskState, type Sens } from "../state";

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
  calls: Array<{ code: string; name: string; zoneMm: number; correct: string; picked: string | null; ok: boolean }>;
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
    if (s.lawnPasses === 0) steps.push(grade("lawn", "zero", ["Kultura gazon usulida ekilmadi"]));
    else {
      if (!s.lawnSpread) notes.push(`Gazon to'liq emas — faqat ${s.lawnPasses}/3 yo'nalishda surtildi`);
      if (!s.dried) notes.push("Idish ~5 daqiqa quritilmadi");
      steps.push(grade("lawn", s.lawnSpread && s.dried ? "full" : "partial", notes));
    }
  }

  // 2 — antibiotic disks placed (with flame-sterile forceps)
  if (placedCount === 0) steps.push(grade("disks", "zero", ["Antibiotik disklari qo'yilmadi"]));
  else {
    const notes: string[] = [];
    if (!s.forcepsSterile) notes.push("Pinset sterillanmagan");
    if (!allDisksPlaced(s)) notes.push(`Faqat ${placedCount}/${ANTIBIOTICS.length} disk qo'yildi`);
    steps.push(grade("disks", allDisksPlaced(s) && s.forcepsSterile ? "full" : "partial", notes));
  }

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
  const lab = (v: Sens | null) => (v ? SENS_LABEL[v] : null);
  const calls = ANTIBIOTICS.map((a) => {
    const correct = interpret(a);
    const picked = s.classified[a.id] ?? null;
    return { code: a.code, name: a.name, zoneMm: a.zoneMm, correct: SENS_LABEL[correct], picked: lab(picked), ok: picked === correct };
  });

  return { total, max: MAX_SCORE, steps, calls };
}
