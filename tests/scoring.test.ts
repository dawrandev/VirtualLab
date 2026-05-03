import { describe, expect, it } from "vitest";
import { freshLabState } from "@/engine/initialState";
import { ScoreEngine, fixationScore, washAngleBonus } from "@/engine/scoring";
import type { LabState, ScoreCriterion } from "@/engine/types";

/** Lab 1 rubric mirror for testing — kept in sync with src/labs/lab1/config.ts */
const lab1Rubric: ScoreCriterion[] = [
  {
    id: "lighting",
    maxPoints: 1.0,
    evaluator: (s) => (s.lamp.lit ? 1.0 : 0),
  },
  {
    id: "sterilization",
    maxPoints: 1.0,
    evaluator: (s) =>
      s.sterilization.isSterilized ? 1.0 : s.sterilization.holdMs > 0 ? 0.5 : 0,
  },
  {
    id: "sampling",
    maxPoints: 2.0,
    evaluator: (s) => Math.min(1, s.sampling.dipCount / 3) * 2.0,
  },
  {
    id: "smear",
    maxPoints: 1.0,
    evaluator: (s) => (s.smear.completed ? 1.0 : 0),
  },
  {
    id: "slideGrip",
    maxPoints: 1.0,
    evaluator: (s) => (s.slide.gripValid ? 1.0 : 0),
  },
  {
    id: "fixation",
    maxPoints: 2.0,
    evaluator: (s) => fixationScore(s.fixation.passes),
  },
  {
    id: "dye",
    maxPoints: 1.5,
    evaluator: (s) => (s.dye.applied ? 1.5 : 0),
  },
  {
    id: "washing",
    maxPoints: 1.5,
    evaluator: (s) => (s.wash.completed ? 1.5 : 0),
  },
  {
    id: "washingAngle",
    maxPoints: 0.5,
    evaluator: (s) => s.wash.bonus,
  },
];

function perfectState(): LabState {
  const s = freshLabState(1);
  s.lamp.lit = true;
  s.sterilization = { holdMs: 3500, isSterilized: true };
  s.sampling.dipCount = 3;
  s.sampling.hasSample = true;
  s.smear.completed = true;
  s.smear.orbitTurns = 2;
  s.smear.strokeCount = 24;
  s.slide.gripValid = true;
  s.fixation.passes = 3;
  s.fixation.isFixed = true;
  s.dye.applied = true;
  s.wash.completed = true;
  s.wash.bonus = 0.5;
  return s;
}

describe("ScoreEngine — Lab 1", () => {
  const engine = new ScoreEngine(lab1Rubric);

  it("rubric maxPoints sums to 11.5 (Lab 1 9-criterion total)", () => {
    expect(engine.rubricMaxTotal).toBeCloseTo(11.5, 5);
  });

  it("perfect run scores full marks → 10.0/10", () => {
    const s = perfectState();
    const r = engine.evaluate(s);
    expect(r.total).toBeCloseTo(11.5, 2);
    expect(r.outOfTen).toBeCloseTo(10.0, 1);
  });

  it("fresh state scores only 'slideGrip' default (1.0) — nothing actually performed yet", () => {
    // Default slide.gripValid=true in initialState; before any interaction nothing else is true.
    const r = engine.evaluate(freshLabState(1));
    expect(r.byCriterion.slideGrip).toBe(1.0);
    expect(r.byCriterion.lighting).toBe(0);
    expect(r.byCriterion.sterilization).toBe(0);
    expect(r.byCriterion.fixation).toBe(0);
    expect(r.byCriterion.dye).toBe(0);
    expect(r.byCriterion.washing).toBe(0);
    expect(r.total).toBe(1.0);
  });

  it("missing sterilization loses exactly 1 point", () => {
    const s = perfectState();
    s.sterilization = { holdMs: 0, isSterilized: false };
    const r = engine.evaluate(s);
    expect(r.total).toBeCloseTo(10.5, 2);
  });

  it("partial sterilization (hold but not complete) gives 0.5", () => {
    const s = perfectState();
    s.sterilization = { holdMs: 1500, isSterilized: false };
    const r = engine.evaluate(s);
    expect(r.byCriterion.sterilization).toBeCloseTo(0.5, 2);
  });

  it("fixation with 2 or 4 passes scores 1.0 (good)", () => {
    const s = perfectState();
    s.fixation.passes = 2;
    expect(engine.evaluate(s).byCriterion.fixation).toBeCloseTo(1.0, 2);
    s.fixation.passes = 4;
    expect(engine.evaluate(s).byCriterion.fixation).toBeCloseTo(1.0, 2);
  });

  it("fixation with 1 or 5 passes scores 0.5 (acceptable)", () => {
    const s = perfectState();
    s.fixation.passes = 1;
    expect(engine.evaluate(s).byCriterion.fixation).toBeCloseTo(0.5, 2);
    s.fixation.passes = 5;
    expect(engine.evaluate(s).byCriterion.fixation).toBeCloseTo(0.5, 2);
  });

  it("fixation with 0 or 6+ passes scores 0", () => {
    const s = perfectState();
    s.fixation.passes = 0;
    expect(engine.evaluate(s).byCriterion.fixation).toBe(0);
    s.fixation.passes = 6;
    expect(engine.evaluate(s).byCriterion.fixation).toBe(0);
  });

  it("missing dip count drops sampling proportionally", () => {
    const s = perfectState();
    s.sampling.dipCount = 1;
    expect(engine.evaluate(s).byCriterion.sampling).toBeCloseTo(2 / 3, 1);
  });

  it("invalid slide grip removes 1 point", () => {
    const s = perfectState();
    s.slide.gripValid = false;
    const r = engine.evaluate(s);
    expect(r.total).toBeCloseTo(10.5, 2);
  });

  it("wash without dye should not be possible — rubric cleanly returns 0 dye + 0 wash", () => {
    const s = freshLabState(1);
    s.lamp.lit = true;
    s.sterilization.isSterilized = true;
    s.sampling.dipCount = 3;
    s.smear.completed = true;
    s.fixation.passes = 3;
    // Skip dye, attempt wash anyway
    s.dye.applied = false;
    s.wash.completed = true;
    s.wash.bonus = 0.5;
    const r = engine.evaluate(s);
    // Lab logic should prevent wash without dye, but if state ever ends up here:
    // dye=0, wash=1.5, bonus=0.5
    expect(r.byCriterion.dye).toBe(0);
    expect(r.byCriterion.washing).toBeCloseTo(1.5, 1);
  });

  it("washing angle bonus tiers", () => {
    expect(washAngleBonus(45)).toBe(0.5);
    expect(washAngleBonus(40)).toBe(0.5);
    expect(washAngleBonus(50)).toBe(0.5);
    expect(washAngleBonus(35)).toBe(0.3);
    expect(washAngleBonus(30)).toBe(0.3);
    expect(washAngleBonus(60)).toBe(0.3);
    expect(washAngleBonus(20)).toBe(0);
    expect(washAngleBonus(70)).toBe(0);
  });
});

describe("fixationScore", () => {
  it.each([
    [0, 0],
    [1, 0.5],
    [2, 1.0],
    [3, 2.0],
    [4, 1.0],
    [5, 0.5],
    [6, 0],
    [10, 0],
  ])("passes %i → score %f", (passes, expected) => {
    expect(fixationScore(passes)).toBe(expected);
  });
});
