"use client";

import type { StainId } from "@/engine2d/types";
import { useLab2DStore } from "@/stores/labStore2d";
import { RealisticSlide } from "../items/RealisticSlide";

interface Props {
  /** Optionally override stains so a stain-zoom can preview the *next*
   *  color flooding the slide independent of the live store state. */
  overrideActiveStain?: StainId;
  width?: number;
}

/**
 * Wraps `RealisticSlide` and reads the current slide state from the store.
 * Used by every slide-related zoom cutscene so they all stay visually
 * consistent with the lateral scene.
 */
export function TopDownSlide({ overrideActiveStain, width = 520 }: Props) {
  const state = useLab2DStore((s) => s.state.slide);
  const stains = overrideActiveStain
    ? {
        ...state.stains,
        [overrideActiveStain]: { ...state.stains[overrideActiveStain], applied: true, washed: false },
      }
    : state.stains;
  return (
    <RealisticSlide
      variant="topdown"
      width={width}
      naclApplied={state.naclApplied}
      smeared={state.smeared}
      fixPasses={state.fixPasses}
      stains={stains}
    />
  );
}
