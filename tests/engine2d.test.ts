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
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    Object.assign(state, {
      lamp: { uncapped: true, lit: true },
      match: { struck: true, lit: false, burned: true, burnProgress: 1 },
      loop: { heatLevel: 0, sterilizePasses: 3, carriesSample: false },
      trash: { match: true },
      slide: {
        onRack: true,
        naclApplied: true,
        smeared: true,
        smearAngle: 0,
        smearRotations: 3,
        dried: true,
        fixPasses: 3,
        activeStain: null,
        stains: {
          cv: { applied: true, appliedMs: 0, washed: true },
          lugol: { applied: true, appliedMs: 0, washed: true },
          decolor: { applied: true, appliedMs: 0, washed: false },
          safranin: { applied: true, appliedMs: 0, washed: true },
        },
      },
    });
    const { outOfTen } = computeScore(state, lab1Config.scoreRules);
    expect(outOfTen).toBeGreaterThanOrEqual(9.5);
  });
});

describe("engine2d — stage check predicates", () => {
  it("stage 1 fails before lamp lit", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    const result = lab1Config.stages[0].check(state);
    expect(result.ok).toBe(false);
  });

  it("stage 1 passes after lamp lit + 3 sterilizations", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    state.lamp = { uncapped: true, lit: true };
    state.loop.sterilizePasses = 3;
    const result = lab1Config.stages[0].check(state);
    expect(result.ok).toBe(true);
  });

  it("stage 2 fails on weak smear", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    state.slide.onRack = true;
    state.slide.naclApplied = true;
    state.slide.smeared = true;
    state.slide.smearRotations = 1;
    const result = lab1Config.stages[1].check(state);
    expect(result.ok).toBe(false);
  });

  it("stage 4 requires full Gram sequence", () => {
    const state = bootstrapStages(lab1Config, lab1Config.initialState());
    state.slide.stains.cv = { applied: true, appliedMs: 0, washed: true };
    state.slide.stains.lugol = { applied: true, appliedMs: 0, washed: true };
    state.slide.stains.decolor = { applied: true, appliedMs: 0, washed: false };
    state.slide.stains.safranin = { applied: true, appliedMs: 0, washed: true };
    const result = lab1Config.stages[3].check(state);
    expect(result.ok).toBe(true);
  });
});

describe("engine2d — microscope outcome", () => {
  it("ambiguous before fixation", () => {
    const state = freshLab2DState();
    const r = microscopeResult(state);
    expect(r.gramOutcome).toBe("ambiguous");
  });

  it("returns positive when CV dominates and decolorization is absent", () => {
    const state = freshLab2DState();
    state.slide.smeared = true;
    state.slide.fixPasses = 3;
    state.slide.stains.cv = { applied: true, appliedMs: 0, washed: false };
    state.slide.stains.lugol = { applied: true, appliedMs: 0, washed: true };
    state.slide.stains.decolor = { applied: true, appliedMs: 0, washed: false };
    state.slide.stains.safranin = { applied: true, appliedMs: 0, washed: true };
    const r = microscopeResult(state);
    expect(r.gramOutcome).toBe("positive");
  });

  it("returns negative when decolorizer washes CV", () => {
    const state = freshLab2DState();
    state.slide.smeared = true;
    state.slide.fixPasses = 3;
    state.slide.stains.cv = { applied: true, appliedMs: 0, washed: true };
    state.slide.stains.lugol = { applied: true, appliedMs: 0, washed: true };
    state.slide.stains.decolor = { applied: true, appliedMs: 0, washed: false };
    state.slide.stains.safranin = { applied: true, appliedMs: 0, washed: true };
    const r = microscopeResult(state);
    expect(r.gramOutcome).toBe("negative");
  });
});
