import type { ComponentType, LazyExoticComponent } from "react";

// ============== Identifiers ==============

export type LabId = number;

export type ToolId =
  | "loop"
  | "slide"
  | "dyePipette"
  | "waterPipette"
  | "match"
  | "matchbox"
  | "spiritLamp"
  | "cultureTube"
  | "microscope";

export type ZoneId =
  | "matchbox-strike"
  | "lamp-wick"
  | "flame"
  | "culture-tube"
  | "slide-area"
  | "fixation-flame"
  | "slide-dye"
  | "slide-water"
  | "microscope-stage";

export type ActionId =
  | "lightMatch"
  | "igniteLamp"
  | "sterilizeLoop"
  | "collectSample"
  | "createSmearStroke"
  | "fixSmear"
  | "dropDye"
  | "dropWater"
  | "viewMicroscope";

export type AudioId =
  | "burner_hum_loop"
  | "success_ping"
  | "error_buzz"
  | "liquid_drop"
  | "metal_clink"
  | "match_strike"
  | "lamp_ignition"
  | "ui_click"
  | "fanfare"
  | "glass_smear_loop"
  | "water_flow_loop";

// ============== Geometry ==============

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

// ============== Lab state (Lab 1 specifics inline; future labs extend) ==============

export interface InventorySlot {
  inInventory: boolean;
  placed: boolean;
  position: Vec3;
  rotation: Quat;
}

export interface MatchState {
  lit: boolean;
  burned: boolean;
  burnTimeLeft: number; // seconds, max 5
  hasIgnitedLamp: boolean;
  /** Total back-and-forth lateral travel of the match over the strike strip
   * (metres). Once it crosses 0.10, the match ignites. Reset to 0 if the
   * match leaves the strike zone before lighting. */
  frictionDistance: number;
  /** 0..1, ramps from 0 to 1 over `burnTimeLeft` seconds while lit && !burned.
   * Drives the visual stick shrink and head char-color animation. */
  burnProgress: number;
}

export interface LampState {
  lit: boolean;
}

export interface SterilizationState {
  holdMs: number;
  isSterilized: boolean;
}

export interface SamplingState {
  dipCount: number;
  targetDips: number;
  hasSample: boolean;
  liquidLevel: number; // 0..1
}

export interface SmearState {
  strokeCount: number;
  orbitTurns: number;
  inTargetZone: boolean;
  completed: boolean;
}

export interface FixationState {
  passes: number;
  isFixed: boolean;
  isDrying: boolean;
  isDried: boolean;
  dryingTimeLeft: number; // seconds, max 4
}

export interface DyeState {
  applied: boolean;
  matured: boolean;
  timeLeft: number; // seconds, max 7
}

export interface WashState {
  completed: boolean;
  angleCorrect: boolean;
  bonus: number; // 0, 0.3, or 0.5
}

export interface SlideState {
  gripValid: boolean;
  rotation: number; // degrees, 0..180
}

export interface ScoreState {
  byCriterion: Record<string, number>;
  total: number;
  outOfTen: number;
}

export interface AudioRuntimeState {
  initialized: boolean;
  muted: boolean;
  volume: number;
}

export interface LabState {
  // Identity
  labId: LabId;
  currentStep: number; // 0..N
  pendingModalStep: number | null;

  // Tools
  inventory: Record<ToolId, InventorySlot>;
  draggedToolId: ToolId | null;
  hoveredZoneId: ZoneId | null;

  // Lab 1 specifics
  match: MatchState;
  lamp: LampState;
  sterilization: SterilizationState;
  sampling: SamplingState;
  smear: SmearState;
  fixation: FixationState;
  dye: DyeState;
  wash: WashState;
  slide: SlideState;

  // Runtime
  score: ScoreState;
  errors: string[];
  audio: AudioRuntimeState;
  microscopeOpen: boolean;
  resultSceneVisible: boolean;
}

// ============== Lab definition ==============

export interface StepConfig {
  id: number;
  titleKey: string;
  descriptionKey: string;
  animationKey?: string;
  /** Predicate over lab state — has the user finished this step? */
  isComplete: (s: LabState) => boolean;
  /** Predicate over lab state — may the user advance past this step's modal? */
  canAdvance: (s: LabState) => boolean;
}

export interface ActionBinding {
  zoneId: ZoneId;
  actionId: ActionId;
  guard?: (s: LabState) => boolean;
  errorKeyOnGuardFail?: string;
}

export interface ToolDef {
  id: ToolId;
  modelPath?: string;
  initialPosition: Vec3;
  inventoryIcon: string;
  gripStyle: "pencil" | "pinch" | "palm";
  draggable: boolean;
  actions: ActionBinding[];
}

export interface ScoreCriterion {
  id: string;
  maxPoints: number;
  evaluator: (s: LabState) => number;
}

export interface LabConfig {
  id: LabId;
  slug: string;
  titleKey: string;
  descriptionKey: string;
  estimatedMinutes: number;
  steps: StepConfig[];
  tools: ToolDef[];
  rubric: ScoreCriterion[];
  audio: AudioId[];
  /** Lazy R3F scene component */
  scene: LazyExoticComponent<ComponentType>;
  /** Lazy result-view component (microscope etc.) */
  resultView: LazyExoticComponent<ComponentType>;
}
