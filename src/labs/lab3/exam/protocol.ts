/**
 * Lab 3 — **Drigalski spread-plate** (isolation of a pure culture). Exam scoring
 * follows the assignment PDF exactly: five criteria, each graded full / partial
 * (half) / zero, max 100.
 */

export type LabMode = "learn" | "exam";
export type ExamPhase = "planning" | "execution" | "result";

/** Pure culture eventually identified — Staphylococcus aureus, Gram-positive. */
export const SPECIMEN = {
  name: "Staphylococcus aureus",
  gram: "positive" as "positive" | "negative",
};

/** Compressed incubation (real 18–24 h) shown as a sped-up countdown. */
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
    id: "get-dishes",
    card: "lab3.steps.dishesCard",
    result: "lab3.steps.dishesResult",
    full: 10,
    partial: 5,
    requires: [],
  },
  {
    id: "inoculate-1",
    card: "lab3.steps.spread1Card",
    result: "lab3.steps.spread1Result",
    full: 30,
    partial: 15,
    requires: ["get-dishes"],
  },
  {
    id: "spread-23",
    card: "lab3.steps.spread23Card",
    result: "lab3.steps.spread23Result",
    full: 20,
    partial: 10,
    requires: ["inoculate-1"],
  },
  {
    id: "pick-stain",
    card: "lab3.steps.colonyCard",
    result: "lab3.steps.colonyResult",
    full: 30,
    partial: 15,
    requires: ["spread-23"],
  },
  {
    id: "microscopy",
    card: "lab3.steps.microCard",
    result: "lab3.steps.microResult",
    full: 10,
    partial: 5,
    requires: ["pick-stain"],
  },
];

export const MAX_SCORE = MAIN_STEPS.reduce((a, s) => a + s.full, 0); // 100
