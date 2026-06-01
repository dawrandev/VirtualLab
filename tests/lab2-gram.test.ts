import { describe, it, expect } from "vitest";
import { freshGramState, applyGramStep, gramStage, type GramIntent } from "@/labs/lab2/state";
import { scoreGramExam, type ExamAction } from "@/labs/lab2/exam/scoring";
import { STAIN_WAIT_MS, DECOLOR_MIN_MS, MAX_SCORE } from "@/labs/lab2/exam/protocol";

/** Replay a list of [intent, timeOffsetMs] into state + log. */
function run(steps: Array<[GramIntent, number]>) {
  let state = freshGramState();
  const log: ExamAction[] = [];
  for (const [intent, ts] of steps) {
    state = applyGramStep(state, intent);
    log.push({ intent, ts });
  }
  return { state, log };
}

const W = STAIN_WAIT_MS;

/** A fully-correct Gram-positive run. */
function perfectRun(): Array<[GramIntent, number]> {
  let t = 0;
  return [
    ["place-filter", (t += 100)],
    ["apply-gv", (t += 100)],
    ["remove-filter", (t += W + 500)], // waited 1-2 min
    ["apply-lugol", (t += 100)],
    ["apply-alcohol", (t += W + 500)], // lugol held long enough
    ["wash", (t += DECOLOR_MIN_MS + 500)], // decolorized within window
    ["apply-fuchsin", (t += 300)],
    ["wash", (t += W + 500)], // fuchsin held long enough
    ["blot", (t += 200)],
    ["apply-oil", (t += 200)],
    ["to-microscope", (t += 200)],
  ];
}

describe("Lab 2 — Gram stain state", () => {
  it("progresses through colour stages", () => {
    let s = freshGramState();
    expect(gramStage(s)).toBe("fixed");
    s = applyGramStep(s, "apply-gv");
    expect(gramStage(s)).toBe("violet");
    s = applyGramStep(s, "apply-lugol");
    expect(gramStage(s)).toBe("iodine");
    s = applyGramStep(s, "apply-alcohol");
    expect(gramStage(s)).toBe("decolorized");
    s = applyGramStep(s, "apply-fuchsin");
    expect(gramStage(s)).toBe("fuchsin");
    s = applyGramStep(s, "wash");
    expect(gramStage(s)).toBe("final");
  });

  it("wash rinses the latest un-rinsed reagent", () => {
    let s = freshGramState();
    s = applyGramStep(s, "apply-alcohol");
    s = applyGramStep(s, "wash");
    expect(s.slide.alcohol.washed).toBe(true);
    s = applyGramStep(s, "apply-fuchsin");
    s = applyGramStep(s, "wash");
    expect(s.slide.fuchsin.washed).toBe(true);
  });
});

describe("Lab 2 — exam scoring", () => {
  it("a perfect run + correct classification scores 100", () => {
    const { state, log } = run(perfectRun());
    const res = scoreGramExam(log, state, "positive");
    expect(res.total).toBe(MAX_SCORE);
    expect(res.total).toBe(100);
    expect(res.steps.every((s) => s.status === "full")).toBe(true);
    expect(res.classification.isRight).toBe(true);
  });

  it("wrong classification loses step 5 (18 pts)", () => {
    const { state, log } = run(perfectRun());
    const res = scoreGramExam(log, state, "negative");
    expect(res.total).toBe(100 - 18);
    expect(res.steps.find((s) => s.id === "classify")!.status).toBe("zero");
  });

  it("skipping the filter paper makes step 1 partial", () => {
    let t = 0;
    const steps: Array<[GramIntent, number]> = [
      ["apply-gv", (t += 100)], // no filter placed first
      ["remove-filter", (t += W + 500)],
      ["apply-lugol", (t += 100)],
      ["apply-alcohol", (t += W + 500)],
      ["wash", (t += DECOLOR_MIN_MS + 500)],
      ["apply-fuchsin", (t += 300)],
      ["wash", (t += W + 500)],
      ["blot", (t += 200)],
      ["to-microscope", (t += 200)],
    ];
    const { state, log } = run(steps);
    const res = scoreGramExam(log, state, "positive");
    const s1 = res.steps.find((s) => s.id === "gentian-violet")!;
    expect(s1.status).toBe("partial");
    expect(s1.earned).toBe(5);
  });

  it("washing alcohol too early makes decolorize partial", () => {
    let t = 0;
    const steps: Array<[GramIntent, number]> = [
      ["place-filter", (t += 100)],
      ["apply-gv", (t += 100)],
      ["remove-filter", (t += W + 500)],
      ["apply-lugol", (t += 100)],
      ["apply-alcohol", (t += W + 500)],
      ["wash", (t += 500)], // too fast — under DECOLOR_MIN
      ["apply-fuchsin", (t += 300)],
      ["wash", (t += W + 500)],
      ["blot", (t += 200)],
      ["to-microscope", (t += 200)],
    ];
    const { state, log } = run(steps);
    const res = scoreGramExam(log, state, "positive");
    const d = res.steps.find((s) => s.id === "decolorize")!;
    expect(d.status).toBe("partial");
  });

  it("missing steps score zero", () => {
    const { state, log } = run([["place-filter", 0], ["apply-gv", 100]]);
    const res = scoreGramExam(log, state, null);
    expect(res.steps.find((s) => s.id === "lugol")!.status).toBe("zero");
    expect(res.steps.find((s) => s.id === "classify")!.status).toBe("zero");
  });
});
