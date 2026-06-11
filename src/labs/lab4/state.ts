/**
 * Lab 4 (paper-disk diffusion / Kirby-Bauer) runtime state.
 *
 * Per the assignment PDF: the culture is seeded as a confluent LAWN ("gazon")
 * with a sterile glass SPREADER (Drigalski spatula), the plate dries, antibiotic
 * paper disks are placed with flame-sterilised forceps, the plate is incubated
 * inverted at 37 °C for 18–24 h, and each zone of inhibition is MEASURED WITH A
 * RULER and interpreted on the universal zone-diameter scale:
 *   > 25 mm  = highly sensitive,
 *   15–25 mm = moderately sensitive,
 *   < 15 mm  = low sensitivity,
 *   no zone  = resistant.
 */

export type Sens = "high" | "medium" | "low" | "resistant";

export interface Antibiotic {
  id: string;
  code: string;
  /** Zone of inhibition (mm) that appears after incubation (0 = no zone). */
  zoneMm: number;
  /** Fixed position on the plate (fractions of the dish diameter, top-down). */
  fx: number;
  fy: number;
}

/** Seven antibiotic disks: one in the centre, six evenly around it, with a
 *  spread of zone sizes so all four sensitivity categories appear. */
export const ANTIBIOTICS: Antibiotic[] = [
  { id: "pen", code: "P", zoneMm: 0, fx: 0.5, fy: 0.5 }, // resistant
  { id: "amp", code: "AMP", zoneMm: 12, fx: 0.82, fy: 0.5 }, // low
  { id: "gen", code: "GEN", zoneMm: 22, fx: 0.66, fy: 0.78 }, // medium
  { id: "cip", code: "CIP", zoneMm: 30, fx: 0.34, fy: 0.78 }, // high
  { id: "tet", code: "TE", zoneMm: 18, fx: 0.18, fy: 0.5 }, // medium
  { id: "chl", code: "C", zoneMm: 27, fx: 0.34, fy: 0.22 }, // high
  { id: "ery", code: "E", zoneMm: 9, fx: 0.66, fy: 0.22 }, // low
];

/** Interpret a zone diameter on the universal 4-category scale (assignment). */
export function interpret(a: Antibiotic): Sens {
  if (a.zoneMm <= 0) return "resistant";
  if (a.zoneMm < 15) return "low";
  if (a.zoneMm <= 25) return "medium";
  return "high";
}

/** i18n keys for the four sensitivity categories. */
export const SENS_KEY: Record<Sens, string> = {
  high: "lab4.sens.high",
  medium: "lab4.sens.medium",
  low: "lab4.sens.low",
  resistant: "lab4.sens.resistant",
};

export interface DiskState {
  dishPlaced: boolean;
  /** Spirit lamp lit by hand: strike the match, touch the wick, bin the match. */
  match: { struck: boolean; lit: boolean; discarded: boolean };
  lamp: { lit: boolean };
  /** Glass spreader dipped in alcohol, then flamed sterile. */
  spreaderDipped: boolean;
  spreaderSterile: boolean;
  /** Spreader charged with culture (ready to seed the lawn). */
  spreaderCharged: boolean;
  /** Number of completed spreading passes (rotate the plate between them). */
  lawnPasses: number;
  /** Confluent lawn finished. */
  lawnSpread: boolean;
  /** Used spreader re-sterilised in the flame after seeding the lawn (hygiene). */
  spreaderResterilized: boolean;
  /** Plate dried (~30 min) so the agar absorbed the inoculum. */
  dried: boolean;
  /** Forceps dipped in alcohol, then flamed. */
  forcepsDipped: boolean;
  forcepsSterile: boolean;
  disks: Record<string, boolean>;
  /** Placed in the thermostat (inverted) and the 24 h incubation elapsed. */
  incubated: boolean;
  /** Zone measured with the ruler (per disk) — must precede classification. */
  measured: Record<string, boolean>;
  classified: Record<string, Sens | null>;
}

export const LAWN_PASSES = 3;

export function freshDiskState(): DiskState {
  return {
    dishPlaced: false,
    match: { struck: false, lit: false, discarded: false },
    lamp: { lit: false },
    spreaderDipped: false,
    spreaderSterile: false,
    spreaderCharged: false,
    lawnPasses: 0,
    lawnSpread: false,
    spreaderResterilized: false,
    dried: false,
    forcepsDipped: false,
    forcepsSterile: false,
    disks: {},
    incubated: false,
    measured: {},
    classified: {},
  };
}

export function allDisksPlaced(s: DiskState): boolean {
  return ANTIBIOTICS.every((a) => s.disks[a.id]);
}

export function allMeasured(s: DiskState): boolean {
  return ANTIBIOTICS.every((a) => s.measured[a.id]);
}

export type DiskIntent =
  | "strike-match" // match → matchbox
  | "light-lamp" // lit match → lamp
  | "discard-match" // burning match → biohazard bin
  | "dip-spreader" // spreader → alcohol jar
  | "sterilize-spreader" // spreader → flame
  | "charge-spreader" // spreader → culture
  | "spread-1" // spreader → dish (1st pass)
  | "spread-2" // spreader → dish (rotate)
  | "spread-3" // spreader → dish (rotate)
  | "dip-forceps" // forceps → alcohol jar
  | "sterilize-forceps" // forceps → flame
  | "pick-disk" // forceps → cartridge
  | "place-disk" // forceps → dish
  | "incubate"
  | "measure"; // ruler → a disk's zone

export type PlateStage = "empty" | "lawn-wet" | "lawn" | "grown";
export function plateStage(s: DiskState): PlateStage {
  if (s.incubated) return "grown";
  if (s.lawnPasses > 0) return s.dried ? "lawn" : "lawn-wet";
  return "empty";
}

export function applyDiskStep(state: DiskState, intent: DiskIntent, disk?: string): DiskState {
  const s: DiskState = { ...state, match: { ...state.match }, lamp: { ...state.lamp }, disks: { ...state.disks }, measured: { ...state.measured }, classified: { ...state.classified } };
  switch (intent) {
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
    case "dip-spreader":
      s.spreaderDipped = true;
      break;
    case "sterilize-spreader":
      // Before seeding it sterilises; after the lawn it re-sterilises the used spreader.
      if (s.lawnSpread) s.spreaderResterilized = true;
      else {
        s.spreaderSterile = true;
        s.spreaderDipped = false;
      }
      break;
    case "charge-spreader":
      s.spreaderCharged = true;
      break;
    case "spread-1":
      s.lawnPasses = Math.max(s.lawnPasses, 1);
      break;
    case "spread-2":
      s.lawnPasses = Math.max(s.lawnPasses, 2);
      break;
    case "spread-3":
      s.lawnPasses = LAWN_PASSES;
      s.lawnSpread = true;
      break;
    case "dip-forceps":
      s.forcepsDipped = true;
      break;
    case "sterilize-forceps":
      s.forcepsSterile = true;
      s.forcepsDipped = false;
      break;
    case "place-disk":
      if (disk) s.disks[disk] = true;
      break;
    case "incubate":
      s.incubated = true;
      break;
    case "measure":
      if (disk) s.measured[disk] = true;
      break;
    case "pick-disk":
      break;
  }
  return s;
}
