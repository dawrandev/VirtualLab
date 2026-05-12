import type { AABB, ZoneId } from "@/engine2d/types";

/**
 * Interaction zones in the inner-stage coordinate system (1184 × 664),
 * reference-aligned (frame seg2_06/11). Zones are generous so the player
 * doesn't have to land items pixel-perfectly.
 */
export const ZONES: Record<ZoneId, AABB> = {
  // Stage 1 — bottom-left workspace
  matchbox: { x: 340, y: 460, w: 170, h: 100 },
  "matchbox-strike": { x: 340, y: 460, w: 170, h: 100 },
  "lamp-body": { x: 180, y: 200, w: 220, h: 240 },
  "lamp-cap": { x: 220, y: 200, w: 140, h: 140 },
  "lamp-wick": { x: 220, y: 200, w: 140, h: 160 },
  "lamp-flame": { x: 180, y: 160, w: 220, h: 200 },
  bin: { x: 40, y: 520, w: 130, h: 130 },

  // Stage 2 — center/left workspace
  "culture-dish": { x: 50, y: 320, w: 320, h: 180 },
  "slide-stack": { x: 590, y: 460, w: 180, h: 110 },

  // Drying rack (two tiers) — geometry mirrors `DryingRack.tsx`.
  // Top tier (loop rest) is the top open rectangle.
  "rack-loop": { x: 620, y: 80, w: 270, h: 100 },
  // Bottom tier (slide rest) is the horizontal frame underneath.
  "rack-slide": { x: 620, y: 175, w: 270, h: 70 },
  // Slide on rack — exact resting spot (sub-zone of rack-slide).
  "slide-on-rack": { x: 690, y: 188, w: 140, h: 40 },

  // NaCl + dye reagents
  "nacl-bottle": { x: 920, y: 70, w: 80, h: 120 },
  "dye-cv": { x: 30, y: 90, w: 60, h: 110 },
  "dye-lugol": { x: 30, y: 210, w: 60, h: 110 },
  "dye-decolor": { x: 30, y: 330, w: 60, h: 110 },
  "dye-safranin": { x: 30, y: 450, w: 60, h: 110 },
  "wash-bottle": { x: 920, y: 200, w: 70, h: 110 },
  "filter-paper": { x: 800, y: 480, w: 120, h: 100 },

  // Stage 4 — microscope
  microscope: { x: 950, y: 240, w: 110, h: 140 },
};

export type LabZoneId = keyof typeof ZONES;
