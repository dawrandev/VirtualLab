import type { AABB, ZoneId } from "@/engine2d/types";

/**
 * Interaction zones in the inner-stage coordinate system (1184 × 664).
 * The same zones serve multiple interactions; the `Lab1Scene2D` component
 * dispatches based on the dragged item and current stage.
 */
export const ZONES: Record<ZoneId, AABB> = {
  // Stage 1 — bottom-left workspace.
  // Strike + matchbox zones are wide so dragging the match anywhere over the
  // box triggers the strike; the visible strip is in the middle of the box.
  matchbox: { x: 340, y: 460, w: 170, h: 100 },
  "matchbox-strike": { x: 340, y: 460, w: 170, h: 100 },
  // Lamp zones are generous so the match head only needs to land *near*
  // the wick to ignite it.
  "lamp-body": { x: 180, y: 200, w: 220, h: 240 },
  "lamp-cap": { x: 220, y: 200, w: 140, h: 140 },
  "lamp-wick": { x: 220, y: 200, w: 140, h: 160 },
  "lamp-flame": { x: 180, y: 160, w: 220, h: 200 },
  bin: { x: 40, y: 400, w: 160, h: 170 },

  // Stage 2 — center
  "loop-holder": { x: 870, y: 360, w: 80, h: 130 },
  "petri-source": { x: 530, y: 200, w: 160, h: 160 },
  "slide-stack": { x: 610, y: 460, w: 190, h: 110 },
  "slide-on-rack": { x: 690, y: 90, w: 130, h: 80 },

  // Stage 2/3 — drying rack zones (split: top tier for smear, bottom for drying)
  "rack-top": { x: 640, y: 80, w: 230, h: 70 },
  "rack-bottom": { x: 640, y: 140, w: 230, h: 70 },

  // Stage 2 — pipette / wash
  "nacl-bottle": { x: 910, y: 70, w: 70, h: 110 },

  // Stage 4 — dye bottle pads
  "dye-cv": { x: 30, y: 90, w: 60, h: 110 },
  "dye-lugol": { x: 30, y: 210, w: 60, h: 110 },
  "dye-decolor": { x: 30, y: 330, w: 60, h: 110 },
  "dye-safranin": { x: 30, y: 450, w: 60, h: 110 },
  "wash-bottle": { x: 920, y: 200, w: 70, h: 110 },
  "filter-paper": { x: 800, y: 470, w: 120, h: 100 },

  // Stage 4 — microscope
  microscope: { x: 950, y: 240, w: 110, h: 140 },
};

export type LabZoneId = keyof typeof ZONES;
