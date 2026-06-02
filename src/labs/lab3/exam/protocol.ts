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
    card: "3 ta Petri idishini olish",
    result: "Oziqa muhiti solingan 3 ta Petri idishini olish",
    full: 10,
    partial: 5,
    requires: [],
  },
  {
    id: "inoculate-1",
    card: "1-idishga material + shpatel",
    result: "1-idishga pipetka bilan material solib, shpatel bilan agarga surtish",
    full: 30,
    partial: 15,
    requires: ["get-dishes"],
  },
  {
    id: "spread-23",
    card: "O'sha shpatel bilan 2-3 idish + termostat",
    result: "O'sha shpatel bilan (sterillamasdan) 2 va 3-idishga surtib, termostatga qo'yish",
    full: 20,
    partial: 10,
    requires: ["inoculate-1"],
  },
  {
    id: "pick-stain",
    card: "Alohida koloniya → surtma → Gram",
    result: "Alohida koloniyadan toza kultura olib, surtma tayyorlab Gram usulida bo'yash",
    full: 30,
    partial: 15,
    requires: ["spread-23"],
  },
  {
    id: "microscopy",
    card: "Mikroskopda o'rganish",
    result: "Surtmani mikroskopda ko'rib, morfologik va tinktorial xususiyatlarni aniqlash",
    full: 10,
    partial: 5,
    requires: ["pick-stain"],
  },
];

export const MAX_SCORE = MAIN_STEPS.reduce((a, s) => a + s.full, 0); // 100
