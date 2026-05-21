import type { Lab2DState } from "./types";

/** Empty state shared by all 2D labs before mounting a lab config. */
export function freshLab2DState(): Lab2DState {
  return {
    currentStageId: "stage-1",
    stages: {},
    match: { struck: false, lit: false, burned: false, burnProgress: 0 },
    lamp: { uncapped: false, lit: false },
    loop: { heatLevel: 0, sterilizePasses: 0, carriesSample: false, resterilized: false },
    slide: {
      onRack: false,
      cleaned: false,
      naclApplied: false,
      smeared: false,
      airDried: false,
      fixPasses: 0,
      methyleneBlue: { applied: false, appliedMs: 0, washed: false },
      blotted: false,
      oilApplied: false,
    },
    trash: {},
    errors: [],
    score: { earned: 0, outOfTen: 0 },
    microscopeOpen: false,
  };
}
