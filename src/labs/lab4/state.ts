/**
 * Lab 4 (paper-disk diffusion / Kirby-Bauer) runtime state. The student spreads
 * a confluent lawn ("gazon") of the test culture, places antibiotic-impregnated
 * paper disks on the agar, incubates, then reads the zone of inhibition around
 * each disk and classifies sensitivity (zone ≥ 10 mm = sensitive).
 */

/** Antibiotics on the plate, each with the zone of inhibition it will grow. */
export interface Antibiotic {
  id: string;
  /** Short code printed on the disk. */
  code: string;
  name: string;
  /** Inhibition-zone diameter (mm) that appears after incubation. */
  zoneMm: number;
  /** Fixed position on the plate (fractions of the dish diameter). */
  fx: number;
  fy: number;
}

/** ≥ this zone diameter (mm) ⇒ high sensitivity; below ⇒ low. */
export const BREAKPOINT_MM = 10;

export const ANTIBIOTICS: Antibiotic[] = [
  { id: "pen", code: "P", name: "Penitsillin", zoneMm: 6, fx: 0.34, fy: 0.36 },
  { id: "gen", code: "GEN", name: "Gentamitsin", zoneMm: 22, fx: 0.66, fy: 0.34 },
  { id: "tet", code: "TET", name: "Tetratsiklin", zoneMm: 14, fx: 0.36, fy: 0.66 },
  { id: "amp", code: "AMP", name: "Ampitsillin", zoneMm: 7, fx: 0.66, fy: 0.66 },
];

export function sensitivityOf(zoneMm: number): "high" | "low" {
  return zoneMm >= BREAKPOINT_MM ? "high" : "low";
}

export interface DiskState {
  /** Petri dish (with agar) on the bench. */
  dishPlaced: boolean;
  /** Spreader dipped in alcohol, then flamed. */
  spatulaDipped: boolean;
  spatulaSterile: boolean;
  /** Loaded with culture (ready to spread). */
  spreaderCharged: boolean;
  /** Confluent lawn spread over the agar. */
  lawnSpread: boolean;
  /** Which antibiotic disks have been placed. */
  disks: Record<string, boolean>;
  /** Placed in the thermostat and the 24 h incubation elapsed. */
  incubated: boolean;
  /** Student's sensitivity call per antibiotic. */
  classified: Record<string, "high" | "low" | null>;
}

export function freshDiskState(): DiskState {
  return {
    dishPlaced: false,
    spatulaDipped: false,
    spatulaSterile: false,
    spreaderCharged: false,
    lawnSpread: false,
    disks: {},
    incubated: false,
    classified: {},
  };
}

export function allDisksPlaced(s: DiskState): boolean {
  return ANTIBIOTICS.every((a) => s.disks[a.id]);
}

export type DiskIntent =
  | "dip-spatula"
  | "sterilize-spatula"
  | "charge-spreader" // spreader → culture tube
  | "spread-lawn" // spreader → dish (gazon)
  | "pick-disk" // forceps → cartridge
  | "place-disk" // forceps → dish
  | "incubate"
  | "measure";

/** Colour/growth stage of the plate. */
export type PlateStage = "empty" | "lawn-wet" | "lawn" | "grown";
export function plateStage(s: DiskState): PlateStage {
  if (s.incubated) return "grown";
  if (s.lawnSpread) return "lawn-wet";
  return "empty";
}

export function applyDiskStep(state: DiskState, intent: DiskIntent, disk?: string): DiskState {
  const s: DiskState = { ...state, disks: { ...state.disks }, classified: { ...state.classified } };
  switch (intent) {
    case "dip-spatula":
      s.spatulaDipped = true;
      break;
    case "sterilize-spatula":
      s.spatulaSterile = true;
      s.spatulaDipped = false;
      break;
    case "charge-spreader":
      s.spreaderCharged = true;
      break;
    case "spread-lawn":
      s.lawnSpread = true;
      s.spreaderCharged = false;
      break;
    case "place-disk":
      if (disk) s.disks[disk] = true;
      break;
    case "incubate":
      s.incubated = true;
      break;
    case "measure":
      break;
  }
  return s;
}
