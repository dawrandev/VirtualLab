import { describe, it, expect } from "vitest";
import { freshDiskState, applyDiskStep, ANTIBIOTICS, sensitivityOf, allDisksPlaced, plateStage, type DiskIntent } from "@/labs/lab4/state";
import { scoreDiskExam, type ExamAction } from "@/labs/lab4/exam/scoring";
import { MAX_SCORE } from "@/labs/lab4/exam/protocol";

function buildDone(correct: boolean) {
  let s = freshDiskState();
  const log: ExamAction[] = [];
  let t = 0;
  const step = (i: DiskIntent, disk?: string) => {
    s = applyDiskStep(s, i, disk);
    log.push({ intent: i, ts: (t += 100) });
  };
  s = { ...s, dishPlaced: true };
  step("dip-spatula");
  step("sterilize-spatula");
  step("charge-spreader");
  step("spread-lawn");
  for (const a of ANTIBIOTICS) step("place-disk", a.id);
  step("incubate");
  // classify each
  const classified: Record<string, "high" | "low"> = {};
  for (const a of ANTIBIOTICS) {
    const right = sensitivityOf(a.zoneMm);
    classified[a.id] = correct ? right : right === "high" ? "low" : "high";
  }
  s = { ...s, classified };
  return { s, log };
}

describe("Lab 4 — disk diffusion state", () => {
  it("sensitivity breakpoint at 10 mm", () => {
    expect(sensitivityOf(6)).toBe("low");
    expect(sensitivityOf(10)).toBe("high");
    expect(sensitivityOf(22)).toBe("high");
  });
  it("plate stage progresses", () => {
    let s = freshDiskState();
    expect(plateStage(s)).toBe("empty");
    s = applyDiskStep(s, "spread-lawn");
    expect(plateStage(s)).toBe("lawn-wet");
    s = applyDiskStep(s, "incubate");
    expect(plateStage(s)).toBe("grown");
  });
  it("place-disk records each disk; allDisksPlaced when complete", () => {
    let s = freshDiskState();
    expect(allDisksPlaced(s)).toBe(false);
    for (const a of ANTIBIOTICS) s = applyDiskStep(s, "place-disk", a.id);
    expect(allDisksPlaced(s)).toBe(true);
  });
});

describe("Lab 4 — exam scoring", () => {
  it("a perfect run + correct calls scores 100", () => {
    const { s, log } = buildDone(true);
    const res = scoreDiskExam(log, s);
    expect(res.total).toBe(MAX_SCORE);
    expect(res.total).toBe(100);
    expect(res.steps.every((x) => x.status === "full")).toBe(true);
    expect(res.calls.every((c) => c.ok)).toBe(true);
  });

  it("all classifications wrong → classify step zero", () => {
    const { s, log } = buildDone(false);
    const res = scoreDiskExam(log, s);
    expect(res.steps.find((x) => x.id === "classify")!.status).toBe("zero");
    // measure (engagement) still full since all were classified
    expect(res.steps.find((x) => x.id === "measure")!.status).toBe("full");
  });

  it("no incubation → incubate + downstream not credited", () => {
    let s = freshDiskState();
    s = { ...s, dishPlaced: true, spatulaSterile: true, lawnSpread: true };
    for (const a of ANTIBIOTICS) s = applyDiskStep(s, "place-disk", a.id);
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "incubate")!.status).toBe("zero");
    expect(res.steps.find((x) => x.id === "measure")!.status).toBe("zero");
  });

  it("partial disks → disks step partial", () => {
    let s = freshDiskState();
    s = { ...s, dishPlaced: true, spatulaSterile: true, lawnSpread: true };
    s = applyDiskStep(s, "place-disk", ANTIBIOTICS[0].id);
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "disks")!.status).toBe("partial");
  });
});
