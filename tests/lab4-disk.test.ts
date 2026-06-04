import { describe, it, expect } from "vitest";
import { freshDiskState, applyDiskStep, ANTIBIOTICS, interpret, allDisksPlaced, plateStage, type DiskIntent, type Sens, type Antibiotic } from "@/labs/lab4/state";
import { scoreDiskExam, type ExamAction } from "@/labs/lab4/exam/scoring";
import { MAX_SCORE } from "@/labs/lab4/exam/protocol";

const other = (s: Sens): Sens => (s === "S" ? "R" : "S");

function buildDone(correct: boolean) {
  let s = freshDiskState();
  const log: ExamAction[] = [];
  let t = 0;
  const step = (i: DiskIntent, disk?: string) => {
    s = applyDiskStep(s, i, disk);
    log.push({ intent: i, ts: (t += 100) });
  };
  s = { ...s, dishPlaced: true };
  step("charge-swab");
  step("spread-lawn");
  s = { ...s, dried: true };
  step("dip-forceps");
  step("sterilize-forceps");
  for (const a of ANTIBIOTICS) step("place-disk", a.id);
  step("incubate");
  // classify each
  const classified: Record<string, Sens> = {};
  for (const a of ANTIBIOTICS) {
    const right = interpret(a);
    classified[a.id] = correct ? right : other(right);
  }
  s = { ...s, classified };
  return { s, log };
}

describe("Lab 4 — disk diffusion state", () => {
  it("interprets zones with per-antibiotic breakpoints (S/I/R)", () => {
    const mk = (zoneMm: number, sv: number, rv: number): Antibiotic => ({ id: "x", code: "X", name: "x", zoneMm, s: sv, r: rv, fx: 0.5, fy: 0.5 });
    expect(interpret(mk(20, 15, 12))).toBe("S");
    expect(interpret(mk(13, 15, 11))).toBe("I");
    expect(interpret(mk(7, 17, 13))).toBe("R");
  });
  it("plate stage progresses: empty → lawn-wet → lawn → grown", () => {
    let s = freshDiskState();
    expect(plateStage(s)).toBe("empty");
    s = applyDiskStep(s, "spread-lawn");
    expect(plateStage(s)).toBe("lawn-wet");
    s = { ...s, dried: true };
    expect(plateStage(s)).toBe("lawn");
    s = applyDiskStep(s, "incubate");
    expect(plateStage(s)).toBe("grown");
  });
  it("place-disk records each disk; allDisksPlaced when complete", () => {
    let s = freshDiskState();
    expect(allDisksPlaced(s)).toBe(false);
    for (const a of ANTIBIOTICS) s = applyDiskStep(s, "place-disk", a.id);
    expect(allDisksPlaced(s)).toBe(true);
  });
  it("sterilize-forceps clears the dipped flag", () => {
    let s = applyDiskStep(freshDiskState(), "dip-forceps");
    expect(s.forcepsDipped).toBe(true);
    s = applyDiskStep(s, "sterilize-forceps");
    expect(s.forcepsSterile).toBe(true);
    expect(s.forcepsDipped).toBe(false);
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

  it("lawn without drying → lawn step partial", () => {
    let s = freshDiskState();
    s = { ...s, dishPlaced: true, lawnSpread: true };
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "lawn")!.status).toBe("partial");
  });

  it("no incubation → incubate + downstream not credited", () => {
    let s = freshDiskState();
    s = { ...s, dishPlaced: true, lawnSpread: true, dried: true, forcepsSterile: true };
    for (const a of ANTIBIOTICS) s = applyDiskStep(s, "place-disk", a.id);
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "incubate")!.status).toBe("zero");
    expect(res.steps.find((x) => x.id === "measure")!.status).toBe("zero");
  });

  it("disks placed without sterile forceps → disks step partial", () => {
    let s = freshDiskState();
    s = { ...s, dishPlaced: true, lawnSpread: true, dried: true };
    for (const a of ANTIBIOTICS) s = applyDiskStep(s, "place-disk", a.id);
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "disks")!.status).toBe("partial");
  });
});
