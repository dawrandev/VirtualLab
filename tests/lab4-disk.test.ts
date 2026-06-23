import { describe, it, expect } from "vitest";
import { freshDiskState, applyDiskStep, ANTIBIOTICS, interpret, allDisksPlaced, plateStage, type DiskIntent, type Sens, type Antibiotic } from "@/labs/lab4/state";
import { scoreDiskExam, type ExamAction } from "@/labs/lab4/exam/scoring";
import { MAX_SCORE } from "@/labs/lab4/exam/protocol";
import { intentFor } from "@/labs/lab4/workbench/items";

const other = (s: Sens): Sens => ({ high: "resistant", medium: "low", low: "medium", resistant: "high" } as const)[s];

function buildDone(correct: boolean) {
  let s = freshDiskState();
  const log: ExamAction[] = [];
  let t = 0;
  const step = (i: DiskIntent, disk?: string) => {
    s = applyDiskStep(s, i, disk);
    log.push({ intent: i, ts: (t += 100) });
  };
  s = { ...s, dishPlaced: true };
  step("load-pipette");
  step("drip-lawn");
  step("dip-spreader");
  step("sterilize-spreader");
  step("spread-1");
  step("spread-2");
  step("spread-3");
  step("disinfect-spreader");
  s = { ...s, dried: true };
  step("dip-forceps");
  // Re-sterilise the forceps before each disk.
  for (const a of ANTIBIOTICS) {
    step("sterilize-forceps");
    step("place-disk", a.id);
  }
  step("incubate");
  // measure + classify each
  const classified: Record<string, Sens> = {};
  for (const a of ANTIBIOTICS) {
    step("measure", a.id);
    const right = interpret(a);
    classified[a.id] = correct ? right : other(right);
  }
  s = { ...s, classified };
  return { s, log };
}

describe("Lab 4 — disk diffusion state", () => {
  it("interprets zones on the universal 4-category scale", () => {
    const mk = (zoneMm: number): Antibiotic => ({ id: "x", code: "X", zoneMm, fx: 0.5, fy: 0.5 });
    expect(interpret(mk(30))).toBe("high"); // > 25
    expect(interpret(mk(20))).toBe("medium"); // 15–25
    expect(interpret(mk(12))).toBe("low"); // < 15
    expect(interpret(mk(0))).toBe("resistant"); // no zone
  });
  it("plate stage progresses: empty → lawn-wet → lawn → grown", () => {
    let s = freshDiskState();
    expect(plateStage(s)).toBe("empty");
    s = applyDiskStep(s, "spread-1");
    expect(plateStage(s)).toBe("lawn-wet");
    s = { ...s, dried: true };
    expect(plateStage(s)).toBe("lawn");
    s = applyDiskStep(s, "incubate");
    expect(plateStage(s)).toBe("grown");
  });

  it("three streak passes complete the lawn", () => {
    let s = freshDiskState();
    s = applyDiskStep(s, "spread-1");
    expect(s.lawnPasses).toBe(1);
    expect(s.lawnSpread).toBe(false);
    s = applyDiskStep(s, "spread-2");
    s = applyDiskStep(s, "spread-3");
    expect(s.lawnPasses).toBe(3);
    expect(s.lawnSpread).toBe(true);
  });
  it("place-disk records each disk; allDisksPlaced when complete", () => {
    let s = freshDiskState();
    expect(allDisksPlaced(s)).toBe(false);
    for (const a of ANTIBIOTICS) s = applyDiskStep(s, "place-disk", a.id);
    expect(allDisksPlaced(s)).toBe(true);
  });
  it("sterilize-forceps clears the dipped flag and primes the forceps", () => {
    let s = applyDiskStep(freshDiskState(), "dip-forceps");
    expect(s.forcepsDipped).toBe(true);
    s = applyDiskStep(s, "sterilize-forceps");
    expect(s.forcepsSterile).toBe(true);
    expect(s.forcepsDipped).toBe(false);
    expect(s.forcepsPrimed).toBe(true);
  });
  it("forceps: dip in alcohol → flame → pick disk is reachable via intentFor", () => {
    // A bench state that is ready for the disk-placement phase.
    let s = {
      ...freshDiskState(),
      dishPlaced: true,
      lamp: { lit: true },
      match: { struck: true, lit: true, discarded: true },
      dripped: true,
      spreaderSterile: true,
      lawnSpread: true,
      spreaderDisinfected: true,
      dried: true,
    };
    // First the forceps are dipped in the alcohol jar…
    expect(intentFor("forceps", "alcohol-jar", s, null)).toBe("dip-forceps");
    expect(intentFor("forceps", "lamp", s, null)).toBeNull(); // can't flame before dipping
    s = applyDiskStep(s, "dip-forceps");
    // …then flame-sterilised over the lit lamp…
    expect(intentFor("forceps", "lamp", s, null)).toBe("sterilize-forceps");
    s = applyDiskStep(s, "sterilize-forceps");
    // …then they can pick up a disk; and the alcohol dip is no longer offered.
    expect(intentFor("forceps", "cartridge", s, null)).toBe("pick-disk");
    expect(intentFor("forceps", "alcohol-jar", s, null)).toBeNull();
    // After placing, the forceps must be re-flamed before the next disk.
    s = applyDiskStep(s, "place-disk", ANTIBIOTICS[0].id);
    expect(intentFor("forceps", "lamp", s, null)).toBe("sterilize-forceps"); // re-flame (no re-dip)
    expect(intentFor("forceps", "cartridge", s, null)).toBeNull(); // not sterile yet
  });
  it("placing a disk clears forcepsSterile (must re-flame before the next)", () => {
    let s = applyDiskStep(freshDiskState(), "sterilize-forceps");
    expect(s.forcepsSterile).toBe(true);
    s = applyDiskStep(s, "place-disk", ANTIBIOTICS[0].id);
    expect(s.disks[ANTIBIOTICS[0].id]).toBe(true);
    expect(s.forcepsSterile).toBe(false);
    expect(s.forcepsPrimed).toBe(true);
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
    s = { ...s, dishPlaced: true, lawnPasses: 3, lawnSpread: true };
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "lawn")!.status).toBe("partial");
  });

  it("incomplete streaking (1/3) → lawn step partial", () => {
    let s = freshDiskState();
    s = { ...s, dishPlaced: true, lawnPasses: 1, dried: true };
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "lawn")!.status).toBe("partial");
  });

  it("no incubation → incubate + downstream not credited", () => {
    let s = freshDiskState();
    s = { ...s, dishPlaced: true, lawnPasses: 3, lawnSpread: true, dried: true, forcepsSterile: true };
    for (const a of ANTIBIOTICS) s = applyDiskStep(s, "place-disk", a.id);
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "incubate")!.status).toBe("zero");
    expect(res.steps.find((x) => x.id === "measure")!.status).toBe("zero");
  });

  it("disks placed without sterile forceps → disks step partial", () => {
    let s = freshDiskState();
    s = { ...s, dishPlaced: true, lawnPasses: 3, lawnSpread: true, dried: true };
    for (const a of ANTIBIOTICS) s = applyDiskStep(s, "place-disk", a.id);
    const res = scoreDiskExam([], s);
    expect(res.steps.find((x) => x.id === "disks")!.status).toBe("partial");
  });
});
