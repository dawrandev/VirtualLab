/**
 * Lab 4 — **paper-disk diffusion** (antibiotic sensitivity). Exam scoring
 * follows the assignment PDF exactly: five criteria, each graded full / partial
 * (half) / zero, max 100.
 */

export type LabMode = "learn" | "exam";
export type ExamPhase = "planning" | "execution" | "result";

export const INCUBATE_MS = 10000;
export const DISPLAY_INCUBATE_HOURS = 24;

export interface MainStep {
  id: string;
  card: string;
  result: string;
  full: number;
  partial: number;
  requires: string[];
}

export const MAIN_STEPS: MainStep[] = [
  {
    id: "lawn",
    card: "lab4.steps.lawnCard",
    result: "lab4.steps.lawnResult",
    full: 10,
    partial: 5,
    requires: [],
  },
  {
    id: "disks",
    card: "lab4.steps.disksCard",
    result: "lab4.steps.disksResult",
    full: 20,
    partial: 10,
    requires: ["lawn"],
  },
  {
    id: "incubate",
    card: "lab4.steps.incubateCard",
    result: "lab4.steps.incubateResult",
    full: 22,
    partial: 11,
    requires: ["disks"],
  },
  {
    id: "measure",
    card: "lab4.steps.measureCard",
    result: "lab4.steps.measureResult",
    full: 28,
    partial: 14,
    requires: ["incubate"],
  },
  {
    id: "classify",
    card: "lab4.steps.classifyCard",
    result: "lab4.steps.classifyResult",
    full: 20,
    partial: 10,
    requires: ["measure"],
  },
];

export const MAX_SCORE = MAIN_STEPS.reduce((a, s) => a + s.full, 0); // 100
