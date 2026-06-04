/**
 * Lab 5 — crushed-drop / wet mount («раздавленная капля»). Six procedural
 * stages from the assignment PDF, each graded full / partial (half) / zero,
 * max 100. The PDF lists no explicit point split, so the weights below put the
 * emphasis on the sterility (loop) and the defining cover-slip technique.
 */

export type LabMode = "learn" | "exam";
export type ExamPhase = "planning" | "execution" | "result";

export interface MainStep {
  id: string;
  card: string;
  result: string;
  full: number;
  partial: number;
}

export const MAIN_STEPS: MainStep[] = [
  {
    id: "degrease",
    card: "Buyum oynasini yog'sizlantirish",
    result: "Buyum oynasini tozalab, spirtovka olovidan o'tkazib yog'sizlantirish",
    full: 12,
    partial: 6,
  },
  {
    id: "saline",
    card: "Fiziologik eritma tomchisi",
    result: "Oyna markaziga steril fiziologik eritma tomchisini tomizish",
    full: 12,
    partial: 6,
  },
  {
    id: "loop",
    card: "Halqani sterillab, kultura olish",
    result: "Halqani olovda qizdirib, sovutib, kulturadan yengil teginib olish",
    full: 20,
    partial: 10,
  },
  {
    id: "mix",
    card: "Tomchiga aralashtirish",
    result: "Kulturani tomchiga bir tekis (gomogen) bo'lguncha aralashtirish",
    full: 18,
    partial: 9,
  },
  {
    id: "cover",
    card: "Qoplag'ich oyna bilan yopish",
    result: "Tomchini qoplag'ich oyna bilan yopib (qirrasidan asta tushirib, pufaksiz), ortig'ini filtr qog'oz bilan olish",
    full: 22,
    partial: 11,
  },
  {
    id: "micro",
    card: "Mikroskopda ko'rish (×40)",
    result: "Preparatni ×40 obyektivda ko'rib, harakatchanligini aniqlash",
    full: 16,
    partial: 8,
  },
];

export const MAX_SCORE = MAIN_STEPS.reduce((a, s) => a + s.full, 0); // 100
