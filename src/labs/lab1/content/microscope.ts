import type { Lab2DState, MicroscopeResult } from "@/engine2d/types";

/**
 * Map state → microscope outcome for the **methylene blue simple stain**.
 * A simple stain does not differentiate cell-wall types — every cell takes up
 * the blue dye — so the result is about whether cells are *resolvable* and how
 * *clean* the preparation is (smear, fixation, the single stain, blotting, oil).
 */
export function microscopeResult(state: Lab2DState): MicroscopeResult {
  const s = state.slide;
  const mb = s.methyleneBlue;
  const fixed = s.fixPasses >= 3;
  const stained = mb.applied && mb.washed;

  if (!s.smeared || !fixed || !stained) {
    return {
      cellsVisible: false,
      morphology: [],
      qualityTier: "low",
      notes: ["lab1.micro.incomplete1", "lab1.micro.incomplete2"],
    };
  }

  const score = state.score.outOfTen;
  const qualityTier = score >= 8 ? "high" : score >= 5 ? "medium" : "low";
  const oil = s.oilApplied;
  const notes: string[] = ["lab1.micro.note1", "lab1.micro.note2"];
  if (!oil) {
    notes.push("lab1.micro.noOil");
  } else if (qualityTier === "high") {
    notes.push("lab1.micro.high");
  } else if (qualityTier === "medium") {
    notes.push("lab1.micro.medium");
  } else {
    notes.push("lab1.micro.low");
  }

  return { cellsVisible: true, morphology: ["cocci", "rods"], qualityTier, notes };
}
