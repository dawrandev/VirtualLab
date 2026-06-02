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
  "sterilize-spatula",
  "load-pipette",
  "drop-material",
  "spread-1",
  "spread-2",
  "spread-3",
  "incubate",
  "pick-colony",
  "make-smear",
  "apply-gv",
  "apply-lugol",
  "apply-alcohol",
  "apply-fuchsin",
  "to-microscope",
];

describe("Lab 3 — Drigalski state", () => {
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
});

describe("Lab 3 — exam scoring", () => {
  it("a perfect run + correct identification scores 100", () => {
    const { s, log } = run(PERFECT);
    const res = scoreDrigalskiExam(log, s, "positive");
    expect(res.total).toBe(MAX_SCORE);
    expect(res.total).toBe(100);
    expect(res.steps.every((x) => x.status === "full")).toBe(true);
  });

  it("skipping spreader sterilization makes step 2 partial", () => {
    const steps = PERFECT.filter((i) => i !== "sterilize-spatula");
    const { s, log } = run(steps);
    const res = scoreDrigalskiExam(log, s, "positive");
    const s2 = res.steps.find((x) => x.id === "inoculate-1")!;
    expect(s2.status).toBe("partial");
    expect(s2.earned).toBe(15);
  });

  it("no incubation makes step 3 partial", () => {
    const steps = PERFECT.filter((i) => i !== "incubate");
    const { s, log } = run(steps);
    const res = scoreDrigalskiExam(log, s, "positive");
    expect(res.steps.find((x) => x.id === "spread-23")!.status).toBe("partial");
  });

  it("incomplete Gram stain makes step 4 partial", () => {
    const steps = PERFECT.filter((i) => i !== "apply-fuchsin");
    const { s, log } = run(steps);
    const res = scoreDrigalskiExam(log, s, "positive");
    expect(res.steps.find((x) => x.id === "pick-stain")!.status).toBe("partial");
  });

  it("missing everything scores zero per step", () => {
    const { s, log } = run(["get-dishes"]);
    const res = scoreDrigalskiExam(log, s, null);
    expect(res.steps.find((x) => x.id === "get-dishes")!.status).toBe("full");
    expect(res.steps.find((x) => x.id === "spread-23")!.status).toBe("zero");
    expect(res.steps.find((x) => x.id === "microscopy")!.status).toBe("zero");
  });
});
