/**
 * Lab 5 (crushed-drop / wet mount — «раздавленная капля») runtime state.
 *
 * A living, unstained preparation for observing bacterial morphology and
 * MOTILITY: the slide is degreased over the flame, a drop of sterile
 * physiological saline is placed on it, a flame-sterilised loop transfers
 * culture into the drop and mixes it to an even suspension, the drop is covered
 * with a cover slip (lowered on edge to avoid air bubbles, no overflow), excess
 * fluid is blotted with filter paper, and the prep is viewed with the ×40
 * objective.
 */

export type Motility = "motile" | "nonmotile";

/** The specimen on the slant — E. coli is actively motile (flagellated). */
export const SPECIMEN = {
  name: "Escherichia coli",
  motility: "motile" as Motility,
};

export interface WetMountState {
  slidePlaced: boolean;
  /** Spirit lamp lit by hand: strike the match, touch the wick, then drop the
   *  burning match into the biohazard bin. */
  match: { struck: boolean; lit: boolean; discarded: boolean };
  /** Spirit lamp: starts CAPPED — the student lifts the cap off by hand
   *  before lighting and puts it back on to put the flame out at the end. */
  lamp: { lit: boolean; capped: boolean };
  /** Passed through the flame to clean/degrease the glass. */
  slideDegreased: boolean;
  /** Drop of physiological saline on the slide. */
  salineApplied: boolean;
  /** Loop sterilised in the flame (and cooled). */
  loopFlamed: boolean;
  /** Loop carries culture taken from the tube. */
  loopCharged: boolean;
  /** Culture mixed into the drop to an even suspension. */
  mixed: boolean;
  /** Loop re-sterilised in the flame after smearing (kills the leftover culture). */
  loopResterilized: boolean;
  /** Cover slip lowered onto the drop. */
  coverPlaced: boolean;
  /** Excess fluid blotted with filter paper (no overflow past the cover slip). */
  blotted: boolean;
  /** Examined under the microscope (×40). */
  observed: boolean;
  /** Student's motility call. */
  motilePick: Motility | null;
}

export function freshWetMountState(): WetMountState {
  return {
    slidePlaced: false,
    match: { struck: false, lit: false, discarded: false },
    lamp: { lit: false, capped: true },
    slideDegreased: false,
    salineApplied: false,
    loopFlamed: false,
    loopCharged: false,
    mixed: false,
    loopResterilized: false,
    coverPlaced: false,
    blotted: false,
    observed: false,
    motilePick: null,
  };
}

export type WetIntent =
  | "strike-match" // match → matchbox
  | "uncap-lamp" // lift the cap off the lamp by hand (before lighting)
  | "light-lamp" // lit match → lamp
  | "discard-match" // burning match → biohazard bin
  | "degrease-slide" // slide → lamp
  | "apply-saline" // saline → slide
  | "flame-loop" // loop → lamp (sterilise before use, then re-sterilise after smear)
  | "charge-loop" // loop → culture
  | "mix-drop" // loop → slide (rub)
  | "place-cover" // cover slip → slide
  | "blot-excess" // filter paper → slide
  | "extinguish-lamp" // put the cap back on by hand (smothers the flame)
  | "observe"; // slide → microscope

/** Visual stage of the drop on the slide. */
export type DropStage = "none" | "saline" | "mixed" | "covered" | "blotted";
export function dropStage(s: WetMountState): DropStage {
  if (s.blotted) return "blotted";
  if (s.coverPlaced) return "covered";
  if (s.mixed) return "mixed";
  if (s.salineApplied) return "saline";
  return "none";
}

export function applyWetStep(state: WetMountState, intent: WetIntent): WetMountState {
  const s: WetMountState = { ...state, match: { ...state.match }, lamp: { ...state.lamp } };
  switch (intent) {
    case "strike-match":
      s.match.struck = true;
      s.match.lit = true;
      break;
    case "uncap-lamp":
      s.lamp.capped = false;
      break;
    case "light-lamp":
      if (!s.lamp.capped) s.lamp.lit = true; // a capped wick can't catch
      break;
    case "extinguish-lamp":
      s.lamp.lit = false;
      s.lamp.capped = true;
      break;
    case "discard-match":
      s.match.discarded = true;
      break;
    case "degrease-slide":
      s.slidePlaced = true;
      s.slideDegreased = true;
      break;
    case "apply-saline":
      s.salineApplied = true;
      break;
    case "flame-loop":
      // Before the smear it sterilises; afterwards it re-sterilises the used loop.
      if (s.mixed) s.loopResterilized = true;
      else s.loopFlamed = true;
      break;
    case "charge-loop":
      s.loopCharged = true;
      break;
    case "mix-drop":
      s.mixed = true;
      s.loopCharged = false;
      break;
    case "place-cover":
      s.coverPlaced = true;
      break;
    case "blot-excess":
      s.blotted = true;
      break;
    case "observe":
      s.observed = true;
      break;
  }
  return s;
}

/** Whether the prep is ready to put under the microscope. */
export function canObserve(s: WetMountState): boolean {
  return s.coverPlaced && !s.observed;
}

/** Intents performed AT the flame — the lamp must stay lit until the last one. */
export const FLAME_INTENTS: WetIntent[] = ["light-lamp", "degrease-slide", "flame-loop"];

/** All the work that needs the flame is done → the lamp may be put out. */
export function lampWorkDone(s: WetMountState): boolean {
  return s.loopResterilized;
}
