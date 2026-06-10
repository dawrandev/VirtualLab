/**
 * Lab 3 — **Drigalski spread-plate** (isolation of a pure culture). The work
 * ends once the incubated plates are taken out of the thermostat. Exam scoring:
 * six criteria, each graded full / partial (half) / zero, max 100.
 */

export type LabMode = "learn" | "exam";
export type ExamPhase = "planning" | "execution" | "result";

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
    id: "sterilize",
    card: "lab3.steps.sterilizeCard",
    result: "lab3.steps.sterilizeResult",
    full: 15,
    partial: 7,
    requires: ["get-dishes"],
  },
  {
    id: "inoculate-1",
    card: "lab3.steps.spread1Card",
    result: "lab3.steps.spread1Result",
    full: 25,
    partial: 12,
    requires: ["sterilize"],
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
    id: "disinfect",
    card: "lab3.steps.disinfectCard",
    result: "lab3.steps.disinfectResult",
    full: 15,
    partial: 7,
    requires: ["spread-23"],
  },
  {
    id: "incubate",
    card: "lab3.steps.incubateCard",
    result: "lab3.steps.incubateResult",
    full: 15,
    partial: 7,
    requires: ["disinfect"],
  },
];

export const MAX_SCORE = MAIN_STEPS.reduce((a, s) => a + s.full, 0); // 100
