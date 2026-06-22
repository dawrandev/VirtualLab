/**
 * Lab 3 (Drigalski spread-plate) runtime state. Self-contained — the workbench
 * owns this in React state.
 *
 * The method: the glass spreader is dipped in alcohol and flamed sterile over a
 * hand-lit spirit lamp, then the suspension is dropped on plate 1 and spread;
 * the SAME spreader (without re-sterilizing) is dragged across plates 2 and 3 —
 * progressive depletion. The used, contaminated spreader is then dropped into a
 * 5% chlorine disinfectant jar. The three plates incubate 18–24 h at 37 °C:
 * plate 1 = confluent lawn, plate 2 = merged colonies, plate 3 = isolated
 * colonies. The work ends once the grown plates come out of the thermostat.
 */

export interface DrigalskiState {
  /** Three agar plates obtained and set on the bench. */
  dishes: boolean;
  /** Spirit lamp lit by hand: match struck on the box, touched to the wick,
   *  then the burning match dropped into the biohazard bin. */
  match: { struck: boolean; lit: boolean; discarded: boolean };
  /** Spirit lamp: lit by hand; `capped` = put out by re-capping it at the end. */
  lamp: { lit: boolean; capped: boolean };
  /** Working end dipped in alcohol (before flaming). */
  spatulaDipped: boolean;
  /** Spreader flamed/sterile before plate 1. */
  spatulaSterile: boolean;
  /** Used spreader decontaminated in the 5% chlorine jar after spreading. */
  spatulaDisinfected: boolean;
  /** Suspension drawn into the pipette. */
  pipetteLoaded: boolean;
  /** Used pipette dropped into the 5% chlorine jar after delivering the drop. */
  pipetteDisinfected: boolean;
  d1: { material: boolean; spread: boolean };
  d2: { spread: boolean };
  d3: { spread: boolean };
  /** Placed in the thermostat and the 18–24 h incubation elapsed. */
  incubated: boolean;
}

export function freshDrigalskiState(): DrigalskiState {
  return {
    dishes: false,
    match: { struck: false, lit: false, discarded: false },
    lamp: { lit: false, capped: false },
    spatulaDipped: false,
    spatulaSterile: false,
    spatulaDisinfected: false,
    pipetteLoaded: false,
    pipetteDisinfected: false,
    d1: { material: false, spread: false },
    d2: { spread: false },
    d3: { spread: false },
    incubated: false,
  };
}

export type DrigalskiIntent =
  | "get-dishes"
  | "strike-match" // match → matchbox
  | "light-lamp" // lit match → lamp
  | "discard-match" // burning match → biohazard bin
  | "dip-spatula"
  | "sterilize-spatula"
  | "load-pipette"
  | "drop-material" // pipette → dish 1
  | "spread-1"
  | "spread-2"
  | "spread-3"
  | "disinfect-spatula" // used spreader → 5% chlorine jar
  | "disinfect-pipette" // used pipette → 5% chlorine jar
  | "extinguish-lamp" // re-cap the spirit lamp by hand to put it out
  | "incubate";

/** Growth pattern a plate shows after incubation. */
export type Growth = "none" | "lawn" | "merged" | "isolated";

export function dishGrowth(s: DrigalskiState, dish: 1 | 2 | 3): Growth {
  if (!s.incubated) return "none";
  if (dish === 1) return s.d1.spread ? "lawn" : "none";
  if (dish === 2) return s.d2.spread ? "merged" : "none";
  return s.d3.spread ? "isolated" : "none";
}

export function applyDrigalskiStep(state: DrigalskiState, intent: DrigalskiIntent): DrigalskiState {
  const s: DrigalskiState = {
    ...state,
    match: { ...state.match },
    lamp: { ...state.lamp },
    d1: { ...state.d1 },
    d2: { ...state.d2 },
    d3: { ...state.d3 },
  };
  switch (intent) {
    case "get-dishes":
      s.dishes = true;
      break;
    case "strike-match":
      s.match.struck = true;
      s.match.lit = true;
      break;
    case "light-lamp":
      s.lamp.lit = true;
      break;
    case "discard-match":
      s.match.discarded = true;
      break;
    case "dip-spatula":
      s.spatulaDipped = true;
      break;
    case "sterilize-spatula":
      // Flame burns off the alcohol → sterile (and briefly red-hot).
      s.spatulaSterile = true;
      s.spatulaDipped = false;
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
    case "disinfect-spatula":
      s.spatulaDisinfected = true;
      break;
    case "disinfect-pipette":
      s.pipetteDisinfected = true;
      break;
    case "extinguish-lamp":
      s.lamp.lit = false;
      s.lamp.capped = true;
      break;
    case "incubate":
      s.incubated = true;
      break;
  }
  return s;
}
