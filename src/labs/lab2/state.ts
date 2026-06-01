/**
 * Lab 2 (Gram stain) runtime state. Self-contained — the workbench owns this in
 * React state rather than the shared zustand engine, since the Gram procedure
 * differs entirely from Lab 1's. Every staining action is a pure reducer step.
 */

export interface GramSlide {
  /** Slide resting on the staining bridge over the tray. */
  onBridge: boolean;
  /** Filter paper currently laid on the smear (for the gentian-violet step). */
  filterOn: boolean;
  gv: { applied: boolean; filterUsed: boolean; removed: boolean };
  lugol: { applied: boolean };
  alcohol: { applied: boolean; washed: boolean };
  fuchsin: { applied: boolean; washed: boolean; blotted: boolean };
  oilApplied: boolean;
}

export interface GramState {
  slide: GramSlide;
  microscopeOpen: boolean;
  classification: "positive" | "negative" | null;
}

export function freshGramState(): GramState {
  return {
    slide: {
      onBridge: false,
      filterOn: false,
      gv: { applied: false, filterUsed: false, removed: false },
      lugol: { applied: false },
      alcohol: { applied: false, washed: false },
      fuchsin: { applied: false, washed: false, blotted: false },
      oilApplied: false,
    },
    microscopeOpen: false,
    classification: null,
  };
}

export type GramIntent =
  | "place-filter"
  | "apply-gv"
  | "remove-filter"
  | "apply-lugol"
  | "apply-alcohol"
  | "wash"
  | "apply-fuchsin"
  | "blot"
  | "apply-oil"
  | "to-microscope";

/** The staining "colour stage" the slide should render, derived from state. */
export type GramStage =
  | "fixed" // pale fixed smear, nothing applied yet
  | "violet" // gentian violet flooded
  | "iodine" // Lugol darkened the violet
  | "decolorized" // alcohol removed surface dye
  | "fuchsin" // pink counterstain applied
  | "final"; // washed + blotted, ready to read

export function gramStage(s: GramState): GramStage {
  const sl = s.slide;
  if (sl.fuchsin.applied) return sl.fuchsin.washed || sl.fuchsin.blotted ? "final" : "fuchsin";
  if (sl.alcohol.applied) return "decolorized";
  if (sl.lugol.applied) return "iodine";
  if (sl.gv.applied) return "violet";
  return "fixed";
}

/** Apply one staining action. Pure: returns a new state (or the same when the
 *  action is a no-op). Exam mode allows every action regardless of order; the
 *  end-of-run scoring judges correctness. */
export function applyGramStep(state: GramState, intent: GramIntent): GramState {
  const s: GramState = {
    ...state,
    slide: {
      ...state.slide,
      gv: { ...state.slide.gv },
      lugol: { ...state.slide.lugol },
      alcohol: { ...state.slide.alcohol },
      fuchsin: { ...state.slide.fuchsin },
    },
  };
  const sl = s.slide;
  switch (intent) {
    case "place-filter":
      sl.filterOn = true;
      break;
    case "apply-gv":
      sl.gv.applied = true;
      if (sl.filterOn) sl.gv.filterUsed = true;
      break;
    case "remove-filter":
      sl.filterOn = false;
      sl.gv.removed = true;
      break;
    case "apply-lugol":
      sl.lugol.applied = true;
      break;
    case "apply-alcohol":
      sl.alcohol.applied = true;
      break;
    case "wash":
      // Rinse the most recent un-rinsed reagent: fuchsin first (latest), then
      // the alcohol decolorization.
      if (sl.fuchsin.applied && !sl.fuchsin.washed) sl.fuchsin.washed = true;
      else if (sl.alcohol.applied && !sl.alcohol.washed) sl.alcohol.washed = true;
      break;
    case "apply-fuchsin":
      sl.fuchsin.applied = true;
      break;
    case "blot":
      if (sl.fuchsin.applied) sl.fuchsin.blotted = true;
      break;
    case "apply-oil":
      sl.oilApplied = true;
      break;
    case "to-microscope":
      s.microscopeOpen = true;
      break;
  }
  return s;
}
