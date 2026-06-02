/**
 * Lab 2 — **Gram staining** (differensial bo'yash). The student starts from a
 * pre-fixed smear and performs the four staining steps, then identifies the
 * Gram type under the microscope.
 *
 * Exam scoring follows the assignment PDF exactly: five criteria, each graded
 * full / partial (half) / zero. Max = 100.
 */

export type LabMode = "learn" | "exam";
export type ExamPhase = "planning" | "execution" | "result";

/** The pre-fixed specimen on the slide. Staphylococcus aureus — Gram-positive
 *  cocci, retains the gentian-violet/iodine complex → stains violet. */
export const SPECIMEN = {
  name: "Staphylococcus aureus",
  gram: "positive" as "positive" | "negative",
  shapeUz: "kokklar (uzum boshiga o'xshash to'plamlar)",
};

/** Compressed contact time before pouring off / next reagent. Real protocol is
 *  1–2 min; the sim waits 10 s but the learn-mode countdown DISPLAYS the real
 *  2:00 → 0:00 minutes (sped up ~12×). */
export const STAIN_WAIT_MS = 10000;
/** Protocol time shown on the (sped-up) learn-mode reaction countdown. */
export const DISPLAY_WAIT_SECONDS = 120;
/** Decolorization window after applying alcohol (real 30–60 s). Washing inside
 *  this window = correct; too early = under-decolorized, too late = over. */
export const DECOLOR_MIN_MS = 2500;
export const DECOLOR_MAX_MS = 7000;

export interface MainStep {
  id: string;
  /** Planning-card label. */
  card: string;
  /** Result-breakdown label. */
  result: string;
  /** PDF points: full answer / partial answer. */
  full: number;
  partial: number;
  /** Steps that must precede this one (true order dependency). */
  requires: string[];
}

export const MAIN_STEPS: MainStep[] = [
  {
    id: "gentian-violet",
    card: "Gensianviolet bilan bo'yash",
    result: "Gensianviolet (filtr qog'oz ustidan) — 1-2 daq, qog'oz olinib bo'yoq to'kiladi",
    full: 10,
    partial: 5,
    requires: [],
  },
  {
    id: "lugol",
    card: "Lyugol eritmasi",
    result: "Lyugol eritmasi bilan ishlov (1-2 daq), bo'yoq to'kiladi",
    full: 20,
    partial: 10,
    requires: ["gentian-violet"],
  },
  {
    id: "decolorize",
    card: "Spirt bilan rangsizlantirish",
    result: "Etil spirti bilan rangsizlantirish (30-60 s) va suv bilan yuvish",
    full: 24,
    partial: 12,
    requires: ["lugol"],
  },
  {
    id: "fuchsin",
    card: "Fuksin bilan bo'yash",
    result: "Fuksin bilan bo'yash (1-2 daq), yuvish va quritish",
    full: 28,
    partial: 14,
    requires: ["decolorize"],
  },
  {
    id: "classify",
    card: "Natijani aniqlash",
    result: "Mikroskopda Gram tegishliligini aniqlash",
    full: 18,
    partial: 9,
    requires: ["fuchsin"],
  },
];

export const MAX_SCORE = MAIN_STEPS.reduce((a, s) => a + s.full, 0); // 100
