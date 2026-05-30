import type { Lab2DState } from "@/engine2d/types";

/**
 * Exam-mode protocol for Lab 1 — methylene-blue simple stain.
 *
 * Two graded phases:
 *  - PLANNING: the student drags the 14 high-level cards into the correct order
 *    (graded by longest correctly-ordered subsequence → {@link PLANNING_POINTS}).
 *  - EXECUTION: the student performs the steps on the bench in any order they
 *    like; every protocol action is recorded (no hints, no checks). At the end
 *    the log + final state are scored against {@link MAIN_STEPS} (order) and
 *    {@link DETAIL_RULES} (technique), minus penalties for gross mistakes.
 *
 * Points: planning 2.0 + main steps 6.0 + details 2.0 = 10.0.
 */

export type LabMode = "learn" | "exam";
export type ExamPhase = "planning" | "execution" | "result";

/** A single performed action recorded during the execution phase. */
export interface ExamAction {
  /** Engine StepId, or "extinguish-lamp" (workbench-level). */
  intent: string;
  ts: number;
  /** loop.heatLevel captured at the moment of a take-sample (cool-before-use). */
  loopHeat?: number;
}

/** A high-level protocol step = one planning card + one scored execution step.
 *  `id` is the engine intent that *completes* the step (its milestone). */
export interface MainStep {
  id: string;
  /** Short label for the planning card. */
  card: string;
  /** Fuller label for the result breakdown. */
  result: string;
  points: number;
  /** Ids of steps that must be performed BEFORE this one (true dependencies). */
  requires: string[];
}

export const MAIN_STEPS: MainStep[] = [
  { id: "light-lamp", card: "Spirtovkani yoqish", result: "Spirtovkani yoqish", points: 0.3, requires: [] },
  { id: "clean-slide", card: "Oynani tozalash", result: "Buyum oynasini spirtli salfetka bilan tozalash", points: 0.4, requires: [] },
  { id: "add-nacl", card: "NaCl tomizish", result: "Oynaga NaCl tomchisini tomizish", points: 0.4, requires: ["clean-slide"] },
  { id: "sterilize-loop", card: "Halqani sterillash", result: "Bakteriologik halqani olovda sterillash", points: 0.5, requires: ["light-lamp", "add-nacl"] },
  { id: "take-sample", card: "Namuna olish", result: "Kulturadan namuna olish", points: 0.5, requires: ["sterilize-loop"] },
  { id: "smear-sample", card: "Surtma tayyorlash", result: "Surtma tayyorlash (NaCl bilan yoyish)", points: 0.7, requires: ["add-nacl", "take-sample"] },
  { id: "resterilize-loop", card: "Halqani qayta sterillash", result: "Halqani qayta sterillash", points: 0.3, requires: ["smear-sample"] },
  { id: "air-dry", card: "Havoda quritish", result: "Surtmani havoda quritish", points: 0.5, requires: ["smear-sample"] },
  { id: "flame-fix", card: "Termik fiksatsiya", result: "Olov ustidan o'tkazib termik fiksatsiya", points: 0.5, requires: ["air-dry"] },
  { id: "apply-mb", card: "Metilen ko'ki bilan bo'yash", result: "Metilen ko'ki bilan qoplab bo'yash", points: 0.5, requires: ["flame-fix"] },
  { id: "wash-mb", card: "Suv bilan yuvish", result: "Distillangan suv bilan yuvish", points: 0.4, requires: ["apply-mb"] },
  { id: "blot-filter", card: "Filtr bilan quritish", result: "Filtr qog'oz bilan bosib quritish", points: 0.3, requires: ["wash-mb"] },
  { id: "apply-oil", card: "Immersion moyi", result: "Immersion moyini tomizish", points: 0.3, requires: ["blot-filter"] },
  { id: "open-microscope", card: "Mikroskopda ko'rish", result: "Mikroskopda (100×) ko'rish", points: 0.4, requires: ["apply-oil"] },
];

export const PLANNING_POINTS = 2.0;
/** Compressed methylene-blue contact time (real 1–3 min) before washing. */
export const MB_WAIT_MS = 8000;
/** loop.heatLevel must have decayed to ≤ this to count as "cooled" before use. */
export const LOOP_COOL_MAX = 0.35;
/** More flame passes than this during fixation = overheating the smear. */
export const FIX_MAX_PASSES = 5;
export const PENALTY_PER = 0.2;
export const PENALTY_CAP = 1.0;

/** Everything the detail rules need to evaluate, derived from the run. */
export interface ExamContext {
  log: ExamAction[];
  state: Lab2DState;
  /** intent → first performance timestamp. */
  firstTs: Record<string, number>;
  /** intent → number of times performed. */
  count: Record<string, number>;
  loopOnStand: boolean;
  tubeInRack: boolean;
  /** loop.heatLevel captured at the (first) take-sample, or null if never sampled. */
  sampleLoopHeat: number | null;
}

export interface DetailRule {
  id: string;
  label: string;
  points: number;
  ok: (c: ExamContext) => boolean;
}

export const DETAIL_RULES: DetailRule[] = [
  {
    id: "discard-match",
    label: "Ishlatilgan gugurtni biohazard idishiga tashlash",
    points: 0.3,
    ok: (c) => c.state.trash.match === true,
  },
  {
    id: "loop-cooled",
    label: "Halqani sterillagach sovutib namuna olish",
    points: 0.3,
    ok: (c) => c.sampleLoopHeat != null && c.sampleLoopHeat <= LOOP_COOL_MAX,
  },
  {
    id: "waited-wash",
    label: "Bo'yagach yetarlicha kutib yuvish (erta emas)",
    points: 0.3,
    ok: (c) => {
      const a = c.firstTs["apply-mb"];
      const w = c.firstTs["wash-mb"];
      return a != null && w != null && w - a >= MB_WAIT_MS;
    },
  },
  {
    id: "dry-before-stain",
    label: "Oynani quritib (ho'l emas) bo'yash",
    points: 0.3,
    ok: (c) => {
      const d = c.firstTs["air-dry"];
      const m = c.firstTs["apply-mb"];
      return d != null && (m == null || d < m);
    },
  },
  {
    id: "loop-returned",
    label: "Halqani ishlatib bo'lib shtativga qo'yish",
    points: 0.2,
    ok: (c) => c.loopOnStand,
  },
  {
    id: "tube-returned",
    label: "Probirkani ishlatib bo'lib shtativga qaytarish",
    points: 0.2,
    ok: (c) => c.tubeInRack,
  },
  {
    id: "lamp-extinguished",
    label: "Spirtovkani oxirida qopqoq bilan o'chirish",
    points: 0.2,
    ok: (c) => c.firstTs["light-lamp"] != null && c.state.lamp.lit === false,
  },
  {
    id: "fix-not-overheated",
    label: "Fiksatsiyada olovda ushlamasdan o'tkazish (ortiqcha qizdirmaslik)",
    points: 0.2,
    ok: (c) => {
      const n = c.count["flame-fix"] ?? 0;
      return n >= 3 && n <= FIX_MAX_PASSES;
    },
  },
];
