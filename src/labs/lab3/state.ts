/**
 * Lab 3 (Drigalski spread-plate) runtime state. Self-contained — the workbench
 * owns this in React state.
 *
 * The method: a sterile glass spreader spreads the suspension across plate 1,
 * then the SAME spreader (without re-sterilizing) is dragged across plates 2
 * and 3 — progressive depletion. After 18–24 h incubation: plate 1 = confluent
 * lawn, plate 2 = merged colonies, plate 3 = isolated colonies. An isolated
 * colony is picked, smeared, Gram-stained and read under the microscope.
 */

export interface DrigalskiState {
  /** Three agar plates obtained and set on the bench. */
  dishes: boolean;
  /** Spreader flamed/sterile before plate 1. */
  spatulaSterile: boolean;
  /** Suspension drawn into the pipette. */
  pipetteLoaded: boolean;
  d1: { material: boolean; spread: boolean };
  d2: { spread: boolean };
  d3: { spread: boolean };
  /** Placed in the thermostat and the 18–24 h incubation elapsed. */
  incubated: boolean;
  /** Phase 2 — pure-culture work-up. */
  colonyPicked: boolean;
  smeared: boolean;
  gram: { gv: boolean; lugol: boolean; alcohol: boolean; fuchsin: boolean };
  microscopeOpen: boolean;
  /** Student recorded the morphology/Gram result. */
  classification: "positive" | "negative" | null;
}

export function freshDrigalskiState(): DrigalskiState {
  return {
    dishes: false,
    spatulaSterile: false,
    pipetteLoaded: false,
    d1: { material: false, spread: false },
    d2: { spread: false },
    d3: { spread: false },
    incubated: false,
    colonyPicked: false,
    smeared: false,
    gram: { gv: false, lugol: false, alcohol: false, fuchsin: false },
    microscopeOpen: false,
    classification: null,
  };
}

export type DrigalskiIntent =
  | "get-dishes"
  | "sterilize-spatula"
  | "load-pipette"
  | "drop-material" // pipette → dish 1
  | "spread-1"
  | "spread-2"
  | "spread-3"
  | "incubate"
  | "pick-colony" // loop → dish 3
  | "make-smear" // loop → slide
  | "apply-gv"
  | "apply-lugol"
  | "apply-alcohol"
  | "apply-fuchsin"
  | "wash"
  | "to-microscope";

/** Growth pattern a plate shows after incubation. */
export type Growth = "none" | "lawn" | "merged" | "isolated";

export function dishGrowth(s: DrigalskiState, dish: 1 | 2 | 3): Growth {
  if (!s.incubated) return "none";
  if (dish === 1) return s.d1.spread ? "lawn" : "none";
  if (dish === 2) return s.d2.spread ? "merged" : "none";
  return s.d3.spread ? "isolated" : "none";
}

/** Gram colour stage of the worked-up smear (Gram-positive specimen). */
export type GramStage = "fixed" | "violet" | "iodine" | "decolorized" | "fuchsin" | "final";
export function smearStage(s: DrigalskiState): GramStage {
  if (!s.smeared) return "fixed";
  const g = s.gram;
  if (g.fuchsin) return "final";
  if (g.alcohol) return "decolorized";
  if (g.lugol) return "iodine";
  if (g.gv) return "violet";
  return "fixed";
}

export function applyDrigalskiStep(state: DrigalskiState, intent: DrigalskiIntent): DrigalskiState {
  const s: DrigalskiState = {
    ...state,
    d1: { ...state.d1 },
    d2: { ...state.d2 },
    d3: { ...state.d3 },
    gram: { ...state.gram },
  };
  switch (intent) {
    case "get-dishes":
      s.dishes = true;
      break;
    case "sterilize-spatula":
      s.spatulaSterile = true;
      break;
    case "load-pipette":
      s.pipetteLoaded = true;
      break;
    case "drop-material":
      s.d1.material = true;
      s.pipetteLoaded = false;
      break;
    case "spread-1":
      s.d1.spread = true;
      break;
    case "spread-2":
      s.d2.spread = true;
      break;
    case "spread-3":
      s.d3.spread = true;
      break;
    case "incubate":
      s.incubated = true;
      break;
    case "pick-colony":
      s.colonyPicked = true;
      break;
    case "make-smear":
      s.smeared = true;
      break;
    case "apply-gv":
      s.gram.gv = true;
      break;
    case "apply-lugol":
      s.gram.lugol = true;
      break;
    case "apply-alcohol":
      s.gram.alcohol = true;
      break;
    case "apply-fuchsin":
      s.gram.fuchsin = true;
      break;
    case "wash":
      // Rinsing — visual only (pours dye into the tray); no scored state change.
      break;
    case "to-microscope":
      s.microscopeOpen = true;
      break;
  }
  return s;
}
