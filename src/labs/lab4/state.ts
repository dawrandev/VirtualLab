/**
 * Lab 4 (paper-disk diffusion / Kirby-Bauer) runtime state.
 *
 * Realistic Kirby-Bauer flow: a sterile COTTON SWAB is charged from the
 * inoculum and swabbed to a confluent lawn ("gazon"); the plate dries ~5 min;
 * antibiotic disks are placed with flame-sterilised forceps; the plate is
 * incubated INVERTED at 37 °C for 24 h; each zone of inhibition is measured and
 * interpreted with per-antibiotic breakpoints into Susceptible / Intermediate /
 * Resistant (CLSI-style).
 */

export type Sens = "S" | "I" | "R";

export interface Antibiotic {
  id: string;
  code: string;
  name: string;
  /** Zone of inhibition (mm) that appears after incubation. */
  zoneMm: number;
  /** CLSI-style breakpoints (mm): ≥ s ⇒ Susceptible, ≤ r ⇒ Resistant, else I. */
  s: number;
  r: number;
  /** Fixed position on the plate (fractions of the dish diameter). */
  fx: number;
  fy: number;
}

export const ANTIBIOTICS: Antibiotic[] = [
  { id: "amp", code: "AMP", name: "Ampitsillin", zoneMm: 7, s: 17, r: 13, fx: 0.34, fy: 0.36 },
  { id: "gen", code: "GEN", name: "Gentamitsin", zoneMm: 20, s: 15, r: 12, fx: 0.66, fy: 0.34 },
  { id: "tet", code: "TET", name: "Tetratsiklin", zoneMm: 13, s: 15, r: 11, fx: 0.36, fy: 0.66 },
  { id: "cip", code: "CIP", name: "Tsiprofloksatsin", zoneMm: 24, s: 21, r: 15, fx: 0.66, fy: 0.66 },
];

/** Interpret a zone diameter with the antibiotic's own breakpoints. */
export function interpret(a: Antibiotic): Sens {
  if (a.zoneMm >= a.s) return "S";
  if (a.zoneMm <= a.r) return "R";
  return "I";
}

export const SENS_LABEL: Record<Sens, string> = { S: "Sezgir", I: "Oraliq", R: "Chidamli" };

export interface DiskState {
  dishPlaced: boolean;
  /** Cotton swab dipped in the culture (ready to spread). */
  swabCharged: boolean;
  /** Confluent lawn swabbed over the agar. */
  lawnSpread: boolean;
  /** Plate dried (~5 min) so the agar absorbed the inoculum. */
  dried: boolean;
  /** Forceps dipped in alcohol, then flamed. */
  forcepsDipped: boolean;
  forcepsSterile: boolean;
  disks: Record<string, boolean>;
  /** Placed in the thermostat (inverted) and the 24 h incubation elapsed. */
  incubated: boolean;
  classified: Record<string, Sens | null>;
}

export function freshDiskState(): DiskState {
  return {
    dishPlaced: false,
    swabCharged: false,
    lawnSpread: false,
    dried: false,
    forcepsDipped: false,
    forcepsSterile: false,
    disks: {},
    incubated: false,
    classified: {},
  };
}

export function allDisksPlaced(s: DiskState): boolean {
  return ANTIBIOTICS.every((a) => s.disks[a.id]);
}

export type DiskIntent =
  | "charge-swab" // swab → culture
  | "spread-lawn" // swab → dish (gazon)
  | "dip-forceps" // forceps → alcohol jar
  | "sterilize-forceps" // forceps → flame
  | "pick-disk" // forceps → cartridge
  | "place-disk" // forceps → dish
  | "incubate"
  | "measure";

export type PlateStage = "empty" | "lawn-wet" | "lawn" | "grown";
export function plateStage(s: DiskState): PlateStage {
  if (s.incubated) return "grown";
  if (s.lawnSpread) return s.dried ? "lawn" : "lawn-wet";
  return "empty";
}

export function applyDiskStep(state: DiskState, intent: DiskIntent, disk?: string): DiskState {
  const s: DiskState = { ...state, disks: { ...state.disks }, classified: { ...state.classified } };
  switch (intent) {
    case "charge-swab":
      s.swabCharged = true;
      break;
    case "spread-lawn":
      s.lawnSpread = true;
      s.swabCharged = false;
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
    case "pick-disk":
    case "measure":
      break;
  }
  return s;
}
