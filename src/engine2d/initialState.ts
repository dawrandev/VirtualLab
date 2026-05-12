import type { Lab2DState } from "./types";

/** Empty state shared by all 2D labs before mounting a lab config. */
export function freshLab2DState(): Lab2DState {
  return {
    currentStageId: "stage-1",
    stages: {},
    match: { struck: false, lit: false, burned: false, burnProgress: 0 },
    lamp: { uncapped: false, lit: false },
    loop: { heatLevel: 0, sterilizePasses: 0, carriesSample: false },
    slide: {
      onRack: false,
      naclApplied: false,
      smeared: false,
      smearAngle: 0,
      smearRotations: 0,
      dried: false,
      fixPasses: 0,
      activeStain: null,
      stains: {
        cv: { applied: false, appliedMs: 0, washed: false },
        lugol: { applied: false, appliedMs: 0, washed: false },
        decolor: { applied: false, appliedMs: 0, washed: false },
        safranin: { applied: false, appliedMs: 0, washed: false },
      },
    },
    trash: {},
    errors: [],
    score: { earned: 0, outOfTen: 0 },
    microscopeOpen: false,
  };
}
