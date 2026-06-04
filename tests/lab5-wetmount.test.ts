import { describe, it, expect } from "vitest";
import { freshWetMountState, applyWetStep, dropStage, canObserve, SPECIMEN, type WetIntent } from "@/labs/lab5/state";
import { scoreWetMountExam, type ExamAction } from "@/labs/lab5/exam/scoring";
import { MAX_SCORE } from "@/labs/lab5/exam/protocol";

function perfect() {
  let s = freshWetMountState();
  const log: ExamAction[] = [];
  let t = 0;
  const step = (i: WetIntent) => {
    s = applyWetStep(s, i);
    log.push({ intent: i, ts: (t += 100) });
  };
  step("degrease-slide");
  step("apply-saline");
  step("flame-loop");
  step("charge-loop");
  step("mix-drop");
  step("place-cover");
  step("blot-excess");
  step("observe");
  s = { ...s, motilePick: SPECIMEN.motility };
  return { s, log };
}

describe("Lab 5 — wet-mount state", () => {
  it("drop stage advances through the workflow", () => {
    let s = freshWetMountState();
    expect(dropStage(s)).toBe("none");
    s = applyWetStep(s, "apply-saline");
    expect(dropStage(s)).toBe("saline");
    s = applyWetStep(s, "mix-drop");
    expect(dropStage(s)).toBe("mixed");
    s = applyWetStep(s, "place-cover");
    expect(dropStage(s)).toBe("covered");
    s = applyWetStep(s, "blot-excess");
    expect(dropStage(s)).toBe("blotted");
  });

  it("mixing consumes the charged loop", () => {
    let s = applyWetStep(freshWetMountState(), "charge-loop");
    expect(s.loopCharged).toBe(true);
    s = applyWetStep(s, "mix-drop");
    expect(s.mixed).toBe(true);
    expect(s.loopCharged).toBe(false);
  });

  it("canObserve only once the cover slip is on", () => {
    let s = freshWetMountState();
    expect(canObserve(s)).toBe(false);
    s = applyWetStep(s, "place-cover");
    expect(canObserve(s)).toBe(true);
    s = applyWetStep(s, "observe");
    expect(canObserve(s)).toBe(false);
  });
});

describe("Lab 5 — exam scoring", () => {
  it("a perfect run + correct motility scores 100", () => {
    const { s, log } = perfect();
    const res = scoreWetMountExam(log, s);
    expect(res.total).toBe(MAX_SCORE);
    expect(res.total).toBe(100);
    expect(res.steps.every((x) => x.status === "full")).toBe(true);
  });

  it("sampling with an unflamed loop → loop step partial", () => {
    let s = freshWetMountState();
    s = { ...s, slideDegreased: true, salineApplied: true, loopCharged: true, mixed: true, coverPlaced: true, blotted: true, observed: true, motilePick: SPECIMEN.motility };
    const res = scoreWetMountExam([], s);
    expect(res.steps.find((x) => x.id === "loop")!.status).toBe("partial");
  });

  it("cover slip without blotting → cover step partial", () => {
    const { s } = perfect();
    const s2 = { ...s, blotted: false };
    const res = scoreWetMountExam([], s2);
    expect(res.steps.find((x) => x.id === "cover")!.status).toBe("partial");
  });

  it("wrong motility call → micro step partial", () => {
    const { s } = perfect();
    const s2 = { ...s, motilePick: "nonmotile" as const };
    const res = scoreWetMountExam([], s2);
    expect(res.steps.find((x) => x.id === "micro")!.status).toBe("partial");
  });

  it("nothing done → zero", () => {
    const res = scoreWetMountExam([], freshWetMountState());
    expect(res.total).toBe(0);
  });
});
