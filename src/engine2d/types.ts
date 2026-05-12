/**
 * 2D Lab engine — contract for stage-gated, drag-drop interactive labs.
 *
 * Reference video (Asfendiyarov University VIRTUAL LAB) uses:
 *  - explicit stages with "X — проверить" checks and "Далее" gating
 *  - cartoon hand cursor with floating tooltip + counter
 *  - per-step hint text shown on hover/drag
 *
 * Engine is independent of any 3D infra (engine/legacy) and is consumed by
 * /lab/1 (2D). The 3D lab at /lab/1-3d continues to use engine/legacy.
 */

import type { ComponentType, ReactNode } from "react";

export type LabId = number;
export type ItemId = string;
export type ZoneId = string;
export type StageId = string;
export type StepId = string;

export interface Vec2 {
  x: number;
  y: number;
}

export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StageStatus = "pending" | "active" | "checked" | "completed" | "failed";

export interface StepCheckResult {
  ok: boolean;
  reasonKey?: string;
}

export interface ScoreRule {
  id: string;
  weight: number;
  predicate: (state: Lab2DState) => boolean;
}

export interface MicroscopeResult {
  gramOutcome: "positive" | "negative" | "ambiguous";
  qualityTier: "high" | "medium" | "low";
  notes: string[];
}

export interface ErrorRecord {
  ts: number;
  stageId: StageId;
  messageKey: string;
}

/**
 * Aggregate Lab1 state. Stage progress is tracked per-stage so future labs
 * with different graphs can reuse the same machinery.
 */
export interface Lab2DState {
  currentStageId: StageId;
  stages: Record<StageId, { status: StageStatus; stepsCompleted: Record<StepId, boolean> }>;
  // Lab-specific slice (lab1):
  match: { struck: boolean; lit: boolean; burned: boolean; burnProgress: number };
  lamp: { uncapped: boolean; lit: boolean };
  loop: { heatLevel: number; sterilizePasses: number; carriesSample: boolean };
  slide: {
    onRack: boolean;
    naclApplied: boolean;
    smeared: boolean;
    smearAngle: number;
    smearRotations: number;
    dried: boolean;
    fixPasses: number;
    activeStain: StainId | null;
    stains: Record<StainId, { applied: boolean; appliedMs: number; washed: boolean }>;
  };
  trash: Record<ItemId, boolean>;
  errors: ErrorRecord[];
  score: { earned: number; outOfTen: number };
  microscopeOpen: boolean;
}

export type StainId = "cv" | "lugol" | "decolor" | "safranin";

export interface Step2D {
  id: StepId;
  hintKey: string; // shown in HandCursor tooltip
  /** Returns a fresh draft mutation; engine wraps in immer-style apply. */
  effect: (draft: Lab2DState) => void;
  /** Optional precondition; false => silently ignored (no error). */
  precondition?: (state: Lab2DState) => boolean;
  /** Auto-completes the step? Defaults true; set false if state alone is the marker. */
  markComplete?: boolean;
}

export interface Stage2D {
  id: StageId;
  titleKey: string;
  steps: Step2D[];
  /** True when every required step in this stage has been completed and the
   *  state is internally consistent for moving on. Pressed via "X — проверить". */
  check: (state: Lab2DState) => StepCheckResult;
}

export interface Lab2DConfig {
  id: LabId;
  slug: string;
  titleKey: string;
  stages: Stage2D[];
  initialState: () => Lab2DState;
  scoreRules: ScoreRule[];
  microscope: (state: Lab2DState) => MicroscopeResult;
  /** Mounts the lab scene SVG/DOM. */
  Scene: ComponentType<Record<string, never>>;
  /** Renders the final microscope modal. */
  ResultModal: ComponentType<Record<string, never>>;
}

export interface Lab2DStoreApi {
  state: Lab2DState;
  mountLab: (cfg: Lab2DConfig) => void;
  config: Lab2DConfig | null;
  dispatchStep: (stepId: StepId) => void;
  pushError: (messageKey: string) => void;
  checkStage: () => void;
  advanceStage: () => void;
  resetLab: () => void;
  setMicroscopeOpen: (open: boolean) => void;
}

export type StageBadge = {
  index: number;
  titleKey: string;
  status: StageStatus;
};

export interface InteractionContext {
  draggedItem: ItemId | null;
  hoveredZone: ZoneId | null;
  tooltipKey: string | null;
  counterValue: number | null;
}

// Re-exports for ergonomic imports
export type { ReactNode };
