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
    card: "lab5.steps.degreaseCard",
    result: "lab5.steps.degreaseResult",
    full: 12,
    partial: 6,
  },
  {
    id: "saline",
    card: "lab5.steps.salineCard",
    result: "lab5.steps.salineResult",
    full: 12,
    partial: 6,
  },
  {
    id: "loop",
    card: "lab5.steps.loopCard",
    result: "lab5.steps.loopResult",
    full: 20,
    partial: 10,
  },
  {
    id: "mix",
    card: "lab5.steps.mixCard",
    result: "lab5.steps.mixResult",
    full: 18,
    partial: 9,
  },
  {
    id: "cover",
    card: "lab5.steps.coverCard",
    result: "lab5.steps.coverResult",
    full: 22,
    partial: 11,
  },
  {
    id: "micro",
    card: "lab5.steps.microCard",
    result: "lab5.steps.microResult",
    full: 16,
    partial: 8,
  },
];

export const MAX_SCORE = MAIN_STEPS.reduce((a, s) => a + s.full, 0); // 100
