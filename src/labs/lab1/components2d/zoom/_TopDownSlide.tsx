"use client";

import type { StainId } from "@/engine2d/types";
import { useLab2DStore } from "@/stores/labStore2d";
import { RealisticSlide } from "../items/RealisticSlide";

interface Props {
  /** When provided, masks any of these fields as the BEFORE state — so a
   *  cutscene can render the slide pre-action even after the store has
   *  already advanced past it. */
  override?: Partial<{
    naclApplied: boolean;
    smeared: boolean;
    fixPasses: number;
    stainApplied: { id: StainId; applied: boolean; washed?: boolean };
  }>;
  width?: number;
}

/**
 * Big top-down slide used inside zoom cutscenes. By default mirrors the
 * live store state. Pass `override` to force a "before-the-action" render
 * (e.g., no NaCl drop while the falling-drop animation plays).
 */
export function TopDownSlide({ override, width = 520 }: Props) {
  const live = useLab2DStore((s) => s.state.slide);
  const naclApplied = override?.naclApplied ?? live.naclApplied;
  const smeared = override?.smeared ?? live.smeared;
  const fixPasses = override?.fixPasses ?? live.fixPasses;
  let stains = live.stains;
  if (override?.stainApplied) {
    const o = override.stainApplied;
    stains = {
      ...stains,
      [o.id]: {
        ...stains[o.id],
        applied: o.applied,
        washed: o.washed ?? stains[o.id].washed,
      },
    };
  }
  return (
    <RealisticSlide
      variant="topdown"
      width={width}
      naclApplied={naclApplied}
      smeared={smeared}
      fixPasses={fixPasses}
      stains={stains}
    />
  );
}
