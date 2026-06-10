import { describe, it, expect } from "vitest";
import { freshDrigalskiState, applyDrigalskiStep, dishGrowth, type DrigalskiIntent } from "@/labs/lab3/state";
import { scoreDrigalskiExam, type ExamAction } from "@/labs/lab3/exam/scoring";
import { MAX_SCORE } from "@/labs/lab3/exam/protocol";

function run(steps: DrigalskiIntent[]) {
  let s = freshDrigalskiState();
  const log: ExamAction[] = [];
  let t = 0;
  for (const intent of steps) {
    s = applyDrigalskiStep(s, intent);
    log.push({ intent, ts: (t += 100) });
  }
  return { s, log };
}

const PERFECT: DrigalskiIntent[] = [
  "get-dishes",
  "strike-match",
  "light-lamp",
  "dip-spatula",
  "sterilize-spatula",
  "load-pipette",
  "drop-material",
  "spread-1",
  "spread-2",
  "spread-3",
  "disinfect-spatula",
  "incubate",
];

describe("Lab 3 — Drigalski state", () => {
  it("the lamp is lit by hand: strike the match, then touch the wick", () => {
    let s = freshDrigalskiState();
    expect(s.lamp.lit).toBe(false);
    s = applyDrigalskiStep(s, "strike-match");
    expect(s.match.lit).toBe(true);
    s = applyDrigalskiStep(s, "light-lamp");
    expect(s.lamp.lit).toBe(true);
  });

  it("growth appears only after incubation", () => {
    let s = freshDrigalskiState();
    s = applyDrigalskiStep(s, "spread-1");
    expect(dishGrowth(s, 1)).toBe("none");
    s = applyDrigalskiStep(s, "spread-2");
    s = applyDrigalskiStep(s, "spread-3");
    s = applyDrigalskiStep(s, "incubate");
    expect(dishGrowth(s, 1)).toBe("lawn");
    expect(dishGrowth(s, 2)).toBe("merged");
    expect(dishGrowth(s, 3)).toBe("isolated");
  });

  it("dropping material empties the pipette", () => {
    let s = freshDrigalskiState();
    s = applyDrigalskiStep(s, "load-pipette");
    expect(s.pipetteLoaded).toBe(true);
    s = applyDrigalskiStep(s, "drop-material");
    expect(s.pipetteLoaded).toBe(false);
    expect(s.d1.material).toBe(true);
  });

  it("flaming the spreader clears the alcohol dip and makes it sterile", () => {
    let s = freshDrigalskiState();
    s = applyDrigalskiStep(s, "dip-spatula");
    expect(s.spatulaDipped).toBe(true);
    s = applyDrigalskiStep(s, "sterilize-spatula");
    expect(s.spatulaDipped).toBe(false);
    expect(s.spatulaSterile).toBe(true);
  });
});

describe("Lab 3 — exam scoring", () => {
  it("a perfect run scores 100, every step full", () => {
    const { s, log } = run(PERFECT);
    const res = scoreDrigalskiExam(log, s);
    expect(res.total).toBe(MAX_SCORE);
    expect(res.total).toBe(100);
    expect(res.steps.every((x) => x.status === "full")).toBe(true);
  });

  it("flaming without the alcohol dip makes the sterilize step partial", () => {
    const steps = PERFECT.filter((i) => i !== "dip-spatula");
    const { s, log } = run(steps);
    const res = scoreDrigalskiExam(log, s);
    expect(res.steps.find((x) => x.id === "sterilize")!.status).toBe("partial");
  });

  it("skipping the chlorine disinfection makes that step zero", () => {
    const steps = PERFECT.filter((i) => i !== "disinfect-spatula");
    const { s, log } = run(steps);
    const res = scoreDrigalskiExam(log, s);
    expect(res.steps.find((x) => x.id === "disinfect")!.status).toBe("zero");
  });

  it("no incubation makes the incubate step zero", () => {
    const steps = PERFECT.filter((i) => i !== "incubate");
    const { s, log } = run(steps);
    const res = scoreDrigalskiExam(log, s);
    expect(res.steps.find((x) => x.id === "incubate")!.status).toBe("zero");
  });

  it("missing everything scores zero per step (only the obtained plates count)", () => {
    const { s, log } = run(["get-dishes"]);
    const res = scoreDrigalskiExam(log, s);
    expect(res.steps.find((x) => x.id === "get-dishes")!.status).toBe("full");
    expect(res.steps.find((x) => x.id === "spread-23")!.status).toBe("zero");
    expect(res.steps.find((x) => x.id === "disinfect")!.status).toBe("zero");
    expect(res.steps.find((x) => x.id === "incubate")!.status).toBe("zero");
  });
});
