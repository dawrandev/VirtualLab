import { audioEngine } from "@/engine/audio/AudioEngine";
import { washAngleBonus } from "@/engine/scoring";
import type { ActionHandler } from "@/engine/interactionRegistry";
import type { LabState } from "@/engine/types";
import { useLabStore } from "@/stores/labStore";

/**
 * Lab 1 action handlers. Each receives the current LabState and returns
 * a partial mutation (or void). The store applies the mutation, recomputes
 * score, and fires step transitions.
 */
export const lab1Interactions: Record<string, ActionHandler> = {
  /** Step 0a: ignite the match by striking on matchbox. */
  lightMatch: (state) => {
    if (state.match.burned || state.match.lit) return;
    audioEngine.play("match_strike");
    return {
      match: { ...state.match, lit: true, burnTimeLeft: 5 },
    };
  },

  /** Step 0b: drop burning match onto lamp wick. */
  igniteLamp: (state) => {
    if (state.lamp.lit || !state.match.lit) return;
    audioEngine.play("lamp_ignition");
    audioEngine.loop("burner_hum_loop");
    audioEngine.play("success_ping");
    return {
      lamp: { lit: true },
      match: {
        ...state.match,
        lit: false,
        burned: true,
        hasIgnitedLamp: true,
      },
    };
  },

  /**
   * Step 1: hold loop in flame.
   * Payload: { dt: number } in seconds — accumulator from the drag controller.
   */
  sterilizeLoop: (state, payload) => {
    if (!state.lamp.lit) return;
    const dt = (payload as { dt?: number } | undefined)?.dt ?? 0.05;
    const newHold = state.sterilization.holdMs + dt * 1000;
    const isSterilized = newHold >= 3000;
    if (!state.sterilization.isSterilized && isSterilized) {
      audioEngine.play("metal_clink");
      audioEngine.play("success_ping");
    }
    return {
      sterilization: {
        holdMs: newHold,
        isSterilized: state.sterilization.isSterilized || isSterilized,
      },
    };
  },

  /** Step 2: dip sterilized loop in culture tube. Each call counts as 1 dip. */
  collectSample: (state) => {
    if (!state.sterilization.isSterilized) return;
    if (state.sampling.dipCount >= state.sampling.targetDips) return;
    audioEngine.play("liquid_drop");
    const newDips = state.sampling.dipCount + 1;
    const hasSample = newDips >= state.sampling.targetDips;
    if (hasSample) audioEngine.play("success_ping");
    return {
      sampling: {
        ...state.sampling,
        dipCount: newDips,
        hasSample,
        liquidLevel: Math.max(0.1, state.sampling.liquidLevel - 0.06),
      },
    };
  },

  /**
   * Step 3: orbit motion over slide.
   * Payload: { strokes: number } — increment of stroke segments since last call.
   */
  createSmearStroke: (state, payload) => {
    if (!state.sampling.hasSample) return;
    if (state.smear.completed) return;
    const inc = (payload as { strokes?: number } | undefined)?.strokes ?? 1;
    const newCount = state.smear.strokeCount + inc;
    const newOrbits = state.smear.orbitTurns + inc / 9; // ~9 strokes per turn
    const completed = newCount >= 18 && newOrbits >= 2;
    if (!state.smear.completed && completed) {
      audioEngine.play("success_ping");
    }
    audioEngine.loop("glass_smear_loop");
    return {
      smear: {
        ...state.smear,
        strokeCount: newCount,
        orbitTurns: newOrbits,
        inTargetZone: true,
        completed,
      },
    };
  },

  /**
   * Step 4: pass slide through flame. Cap at 3 passes — that's the perfect
   * fixation count and overshooting actually LOWERS the rubric score
   * (4=good, 5=acceptable, 6+=fail). Capping at 3 means once the user
   * crosses the flame three times the slide is considered fixed and any
   * further accidental enter events are ignored.
   */
  fixSmear: (state) => {
    if (!state.smear.completed) return;
    if (state.fixation.passes >= 3) return;
    if (state.fixation.isDried) return;
    audioEngine.play("metal_clink");
    const passes = state.fixation.passes + 1;
    const isFixed = passes >= 1;
    if (passes === 3) audioEngine.play("success_ping");
    return {
      fixation: {
        ...state.fixation,
        passes,
        isFixed,
        isDrying: passes >= 3,
        isDried: state.fixation.isDried || passes >= 3,
        dryingTimeLeft: 0,
      },
    };
  },

  /** Step 5a: drop dye on slide. Sets a 7-second staining timer that
   * Lab1Scene ticks down; once it reaches 0, `matured` flips to true and
   * the water pipette becomes usable. */
  dropDye: (state) => {
    if (!state.fixation.isFixed) return;
    if (state.dye.applied) return;
    audioEngine.play("liquid_drop");
    audioEngine.play("success_ping");
    return {
      dye: { applied: true, matured: false, timeLeft: 7 },
    };
  },

  /**
   * Step 5b: drop water on slide (rinse).
   * Payload: { angleDeg?: number } — the slide tilt at moment of rinsing.
   */
  dropWater: (state, payload) => {
    if (!state.dye.applied) {
      useLabStore.getState().pushError("lab1.errWashBeforeDye");
      audioEngine.play("error_buzz");
      return;
    }
    if (!state.dye.matured) {
      useLabStore.getState().pushError("lab1.errWashTooEarly");
      audioEngine.play("error_buzz");
      return;
    }
    if (state.wash.completed) return;
    const angle = (payload as { angleDeg?: number } | undefined)?.angleDeg ?? 45;
    const bonus = washAngleBonus(angle);
    audioEngine.play("liquid_drop");
    audioEngine.loop("water_flow_loop");
    audioEngine.play("success_ping");
    setTimeout(() => audioEngine.stopLoop("water_flow_loop"), 1200);
    return {
      wash: {
        completed: true,
        angleCorrect: bonus > 0,
        bonus,
      },
      slide: { ...state.slide, rotation: angle },
    };
  },

  /** Step 6: open microscope view. */
  viewMicroscope: (state) => {
    if (!state.wash.completed) return;
    audioEngine.play("fanfare");
    return {
      microscopeOpen: true,
      resultSceneVisible: true,
    };
  },
};

// Mark unused imports as referenced for strict mode
void ({} as LabState);
