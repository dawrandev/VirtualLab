import { describe, expect, it } from "vitest";
import { freshLabState } from "@/engine/initialState";
import { StepMachine } from "@/engine/stateMachine";
import type { LabState, StepConfig } from "@/engine/types";

const lab1Steps: StepConfig[] = [
  {
    id: 0,
    titleKey: "lab1.step0Title",
    descriptionKey: "lab1.step0Desc",
    isComplete: (s) => s.lamp.lit,
    canAdvance: (s) => s.lamp.lit,
  },
  {
    id: 1,
    titleKey: "lab1.step1Title",
    descriptionKey: "lab1.step1Desc",
    isComplete: (s) => s.sterilization.isSterilized,
    canAdvance: (s) => s.sterilization.isSterilized,
  },
  {
    id: 2,
    titleKey: "lab1.step2Title",
    descriptionKey: "lab1.step2Desc",
    isComplete: (s) => s.sampling.hasSample,
    canAdvance: (s) => s.sampling.hasSample,
  },
  {
    id: 3,
    titleKey: "lab1.step3Title",
    descriptionKey: "lab1.step3Desc",
    isComplete: (s) => s.smear.completed,
    canAdvance: (s) => s.smear.completed,
  },
  {
    id: 4,
    titleKey: "lab1.step4Title",
    descriptionKey: "lab1.step4Desc",
    isComplete: (s) => s.fixation.isFixed,
    canAdvance: (s) => s.fixation.isFixed,
  },
  {
    id: 5,
    titleKey: "lab1.step5Title",
    descriptionKey: "lab1.step5Desc",
    isComplete: (s) => s.dye.applied && s.wash.completed,
    canAdvance: (s) => s.dye.applied && s.wash.completed,
  },
];

describe("StepMachine", () => {
  const sm = new StepMachine(lab1Steps);

  it("fresh state → currentFor returns step 0", () => {
    expect(sm.currentFor(freshLabState(1))).toBe(0);
  });

  it("after lamp lit → currentFor returns step 1", () => {
    const s = freshLabState(1);
    s.lamp.lit = true;
    expect(sm.currentFor(s)).toBe(1);
  });

  it("after sterilization → step 2", () => {
    const s = freshLabState(1);
    s.lamp.lit = true;
    s.sterilization.isSterilized = true;
    expect(sm.currentFor(s)).toBe(2);
  });

  it("all steps complete → returns step+1", () => {
    const s = freshLabState(1);
    s.lamp.lit = true;
    s.sterilization.isSterilized = true;
    s.sampling.hasSample = true;
    s.smear.completed = true;
    s.fixation.isFixed = true;
    s.dye.applied = true;
    s.wash.completed = true;
    expect(sm.currentFor(s)).toBe(6);
    expect(sm.isAllComplete(s)).toBe(true);
  });

  it("reconcile detects step boundary advance", () => {
    const prev = freshLabState(1);
    const next: LabState = { ...prev, lamp: { lit: true } };
    expect(sm.reconcile(prev, next)).toBe(1);
  });

  it("reconcile returns null when no boundary crossed", () => {
    const prev = freshLabState(1);
    const next = freshLabState(1);
    expect(sm.reconcile(prev, next)).toBeNull();
  });

  it("canAdvance reflects per-step gate", () => {
    const s = freshLabState(1);
    expect(sm.canAdvance(s, 0)).toBe(false);
    s.lamp.lit = true;
    expect(sm.canAdvance(s, 0)).toBe(true);
  });
});
