import {
  MAIN_STEPS,
  MAX_SCORE,
  SPECIMEN,
  STAIN_WAIT_MS,
  DECOLOR_MIN_MS,
  DECOLOR_MAX_MS,
} from "./protocol";
import type { GramState } from "../state";

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
  /** Short reasons explaining a partial/zero (the "where did I go wrong"). */
  notes: string[];
}

export interface ExamResult {
  total: number;
  max: number;
  steps: StepResult[];
  classification: { picked: "positive" | "negative" | null; correct: "positive" | "negative"; isRight: boolean };
}

interface Ctx {
  firstTs: Record<string, number>;
  lastTs: Record<string, number>;
  /** Ordered list of timestamps for a repeated intent (e.g. multiple washes). */
  series: Record<string, number[]>;
}

function buildCtx(log: ExamAction[]): Ctx {
  const firstTs: Record<string, number> = {};
  const lastTs: Record<string, number> = {};
  const series: Record<string, number[]> = {};
  for (const a of log) {
    if (firstTs[a.intent] == null) firstTs[a.intent] = a.ts;
    lastTs[a.intent] = a.ts;
    (series[a.intent] ??= []).push(a.ts);
  }
  return { firstTs, lastTs, series };
}

/** Timestamp of the wash that rinsed the alcohol (first wash after alcohol,
 *  before fuchsin) and the wash that rinsed the fuchsin (first wash after it). */
function washTimes(ctx: Ctx) {
  const alcohol = ctx.firstTs["apply-alcohol"];
  const fuchsin = ctx.firstTs["apply-fuchsin"];
  const washes = ctx.series["wash"] ?? [];
  let alcoholWash: number | undefined;
  let fuchsinWash: number | undefined;
  for (const w of washes) {
    if (alcohol != null && w > alcohol && (fuchsin == null || w < fuchsin) && alcoholWash == null) alcoholWash = w;
    if (fuchsin != null && w > fuchsin && fuchsinWash == null) fuchsinWash = w;
  }
  return { alcoholWash, fuchsinWash };
}

export function scoreGramExam(
  log: ExamAction[],
  state: GramState,
  classification: "positive" | "negative" | null,
  correctGram: "positive" | "negative" = SPECIMEN.gram,
): ExamResult {
  const ctx = buildCtx(log);
  const { alcoholWash, fuchsinWash } = washTimes(ctx);
  const sl = state.slide;
  const byId = Object.fromEntries(MAIN_STEPS.map((s) => [s.id, s]));

  const grade = (id: string, status: StepStatus, notes: string[]): StepResult => {
    const def = byId[id];
    const earned = status === "full" ? def.full : status === "partial" ? def.partial : 0;
    return { id, label: def.result, full: def.full, partial: def.partial, earned, status, notes };
  };

  const steps: StepResult[] = [];

  // 1 — Gentian violet (filter paper, wait, remove + pour off)
  {
    const notes: string[] = [];
    if (!sl.gv.applied) {
      steps.push(grade("gentian-violet", "zero", ["lab2.score.gvZero"]));
    } else {
      if (!sl.gv.filterUsed) notes.push("lab2.score.noFilter");
      if (!sl.gv.removed) notes.push("lab2.score.filterNotRemoved");
      const waited = sl.gv.removed && ctx.firstTs["remove-filter"] - ctx.firstTs["apply-gv"] >= STAIN_WAIT_MS;
      if (sl.gv.removed && !waited) notes.push("lab2.score.gvTooEarly");
      steps.push(grade("gentian-violet", sl.gv.filterUsed && sl.gv.removed && waited ? "full" : "partial", notes));
    }
  }

  // 2 — Lugol's iodine (wait, pour off)
  {
    const notes: string[] = [];
    if (!sl.lugol.applied) {
      steps.push(grade("lugol", "zero", ["lab2.score.lugolZero"]));
    } else {
      const order = ctx.firstTs["apply-gv"] != null && ctx.firstTs["apply-lugol"] > ctx.firstTs["apply-gv"];
      if (!order) notes.push("lab2.score.lugolOrder");
      const next = ctx.firstTs["apply-alcohol"];
      const waited = next == null || next - ctx.firstTs["apply-lugol"] >= STAIN_WAIT_MS;
      if (!waited) notes.push("lab2.score.lugolTooShort");
      steps.push(grade("lugol", order && waited ? "full" : "partial", notes));
    }
  }

  // 3 — Decolorization (alcohol within window) + water wash
  {
    const notes: string[] = [];
    if (!sl.alcohol.applied) {
      steps.push(grade("decolorize", "zero", ["lab2.score.alcoholZero"]));
    } else {
      const order = ctx.firstTs["apply-lugol"] != null && ctx.firstTs["apply-alcohol"] > ctx.firstTs["apply-lugol"];
      if (!order) notes.push("lab2.score.alcoholOrder");
      if (!sl.alcohol.washed) notes.push("lab2.score.noWashAfterAlcohol");
      let timingOk = false;
      if (alcoholWash != null) {
        const dur = alcoholWash - ctx.firstTs["apply-alcohol"];
        timingOk = dur >= DECOLOR_MIN_MS && dur <= DECOLOR_MAX_MS;
        if (dur < DECOLOR_MIN_MS) notes.push("lab2.score.alcoholTooFast");
        if (dur > DECOLOR_MAX_MS) notes.push("lab2.score.alcoholTooLong");
      }
      steps.push(grade("decolorize", order && sl.alcohol.washed && timingOk ? "full" : "partial", notes));
    }
  }

  // 4 — Fuchsin counterstain (wait, wash, dry)
  {
    const notes: string[] = [];
    if (!sl.fuchsin.applied) {
      steps.push(grade("fuchsin", "zero", ["lab2.score.fuchsinZero"]));
    } else {
      const order = ctx.firstTs["apply-alcohol"] != null && ctx.firstTs["apply-fuchsin"] > ctx.firstTs["apply-alcohol"];
      if (!order) notes.push("lab2.score.fuchsinOrder");
      const waited = fuchsinWash != null && fuchsinWash - ctx.firstTs["apply-fuchsin"] >= STAIN_WAIT_MS;
      if (!waited) notes.push("lab2.score.fuchsinTooShort");
      if (!sl.fuchsin.washed) notes.push("lab2.score.noWash");
      if (!sl.fuchsin.blotted) notes.push("lab2.score.notBlotted");
      steps.push(
        grade("fuchsin", order && waited && sl.fuchsin.washed && sl.fuchsin.blotted ? "full" : "partial", notes),
      );
    }
  }

  // 5 — Identify the Gram type
  {
    if (classification == null) {
      steps.push(grade("classify", "zero", ["lab2.score.classifyZero"]));
    } else if (classification === correctGram) {
      steps.push(grade("classify", "full", []));
    } else {
      steps.push(grade("classify", "zero", ["lab2.score.classifyWrong"]));
    }
  }

  const total = steps.reduce((a, s) => a + s.earned, 0);
  return {
    total,
    max: MAX_SCORE,
    steps,
    classification: { picked: classification, correct: correctGram, isRight: classification === correctGram },
  };
}
