import { describe, expect, it } from "vitest";
import lab1Config from "@/labs/lab1/config2d";
import { freshLab2DState } from "@/engine2d/initialState";
import { computeScore } from "@/engine2d/scoring";
import {
  bootstrapStages,
  markStepCompleted,
  setStageStatus,
} from "@/engine2d/stateMachine";
import { microscopeResult } from "@/labs/lab1/content/microscope";
import type { Lab2DState } from "@/engine2d/types";

/** A fully-correct methylene-blue preparation. */
function perfectState(): Lab2DState {
  const state = bootstrapStages(lab1Config, lab1Config.initialState());
  state.lamp = { uncapped: true, lit: true };
  state.match = { struck: true, lit: false, burned: true, burnProgress: 1 };
  state.trash.match = true;
  state.loop = { heatLevel: 0, sterilizePasses: 3, carriesSample: false, resterilized: true };
  state.slide = {
    onRack: true,
    cleaned: true,
    naclApplied: true,
    smeared: true,
    airDried: true,
    fixPasses: 3,
    methyleneBlue: { applied: true, appliedMs: 0, washed: true },
    blotted: true,
    oilApplied: true,
  };
  return state;
}

describe("engine2d — bootstrap + state machine", () => {
  it("seeds first stage as active and the rest pending", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    expect(state.currentStageId).toBe("stage-1");
    expect(state.stages["stage-1"].status).toBe("active");
    expect(state.stages["stage-2"].status).toBe("pending");
    expect(state.stages["stage-3"].status).toBe("pending");
    expect(state.stages["stage-4"].status).toBe("pending");
  });

  it("marks a step as completed in the active stage", () => {
    let s = bootstrapStages(lab1Config, lab1Config.initialState());
    s = markStepCompleted(s, "strike-match");
    expect(s.stages["stage-1"].stepsCompleted["strike-match"]).toBe(true);
  });

  it("transitions stage status via setStageStatus", () => {
    let s = bootstrapStages(lab1Config, lab1Config.initialState());
    s = setStageStatus(s, "stage-1", "completed");
    expect(s.stages["stage-1"].status).toBe("completed");
  });
});

describe("engine2d — scoring", () => {
  it("zero score on fresh state", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    const { earned, outOfTen } = computeScore(state, lab1Config.scoreRules);
    expect(earned).toBe(0);
    expect(outOfTen).toBe(0);
  });

  it("perfect happy path returns 10/10", () => {
    const { outOfTen, earned } = computeScore(perfectState(), lab1Config.scoreRules);
    expect(earned).toBe(10);
    expect(outOfTen).toBe(10);
  });
});

describe("engine2d — stage check predicates", () => {
  it("stage 1 fails before lamp is lit", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    expect(lab1Config.stages[0].check(state).ok).toBe(false);
  });

  it("stage 1 passes when lamp lit and match discarded", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    state.lamp = { uncapped: true, lit: true };
    state.trash.match = true;
    expect(lab1Config.stages[0].check(state).ok).toBe(true);
  });

  it("stage 2 fails when loop is not re-sterilized after the smear", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    state.loop.sterilizePasses = 3;
    state.loop.carriesSample = true;
    state.slide.onRack = true;
    state.slide.cleaned = true;
    state.slide.naclApplied = true;
    state.slide.smeared = true;
    state.loop.resterilized = false;
    expect(lab1Config.stages[1].check(state).ok).toBe(false);
  });

  it("stage 2 passes with full smear preparation + re-sterilization", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    state.loop.sterilizePasses = 3;
    state.loop.carriesSample = true;
    state.slide.onRack = true;
    state.slide.cleaned = true;
    state.slide.naclApplied = true;
    state.slide.smeared = true;
    state.loop.resterilized = true;
    expect(lab1Config.stages[1].check(state).ok).toBe(true);
  });

  it("stage 3 needs air-drying and 3 fixation passes", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    state.slide.airDried = true;
    state.slide.fixPasses = 2;
    expect(lab1Config.stages[2].check(state).ok).toBe(false);
    state.slide.fixPasses = 3;
    expect(lab1Config.stages[2].check(state).ok).toBe(true);
  });

  it("stage 4 requires methylene blue applied+washed, blotted and oiled", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    state.slide.methyleneBlue = { applied: true, appliedMs: 0, washed: true };
    state.slide.blotted = false;
    expect(lab1Config.stages[3].check(state).ok).toBe(false);
    state.slide.blotted = true;
    state.slide.oilApplied = true;
    expect(lab1Config.stages[3].check(state).ok).toBe(true);
  });
});

describe("engine2d — microscope outcome", () => {
  it("no cells visible before fixation/staining", () => {
    const r = microscopeResult(freshLab2DState());
    expect(r.cellsVisible).toBe(false);
    expect(r.qualityTier).toBe("low");
  });

  it("shows blue-stained cocci and rods on a complete preparation", () => {
    const state = perfectState();
    state.score = computeScore(state, lab1Config.scoreRules);
    const r = microscopeResult(state);
    expect(r.cellsVisible).toBe(true);
    expect(r.morphology).toEqual(expect.arrayContaining(["cocci", "rods"]));
    expect(r.qualityTier).toBe("high");
  });
});
