"use client";

import { useLab2DStore } from "@/stores/labStore2d";
import { RealisticSlide } from "../items/RealisticSlide";

interface Props {
  /** Force a "before-the-action" render even after the store advanced past it. */
  override?: Partial<{
    naclApplied: boolean;
    smeared: boolean;
    fixPasses: number;
    mbApplied: boolean;
    mbWashed: boolean;
  }>;
  width?: number;
}

/**
 * Big top-down slide used inside zoom cutscenes. Mirrors the live store state
 * by default; pass `override` to force a pre-action render.
 */
export function TopDownSlide({ override, width = 520 }: Props) {
  const live = useLab2DStore((s) => s.state.slide);
  const naclApplied = override?.naclApplied ?? live.naclApplied;
  const smeared = override?.smeared ?? live.smeared;
  const fixPasses = override?.fixPasses ?? live.fixPasses;
  const mbApplied = override?.mbApplied ?? live.methyleneBlue.applied;
  const mbWashed = override?.mbWashed ?? live.methyleneBlue.washed;
  return (
    <RealisticSlide
      variant="topdown"
      width={width}
      naclApplied={naclApplied}
      smeared={smeared}
      fixPasses={fixPasses}
      dried={live.airDried}
      mb={{ applied: mbApplied, washed: mbWashed }}
      oilApplied={live.oilApplied}
    />
  );
}
