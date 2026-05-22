"use client";

import { create } from "zustand";
import { freshLab2DState } from "@/engine2d/initialState";
import { computeScore } from "@/engine2d/scoring";
import {
  bootstrapStages,
  findStep,
  markStepCompleted,
  setStageStatus,
} from "@/engine2d/stateMachine";
import type { Lab2DConfig, Lab2DState, StepId } from "@/engine2d/types";

interface Lab2DStore {
  config: Lab2DConfig | null;
  state: Lab2DState;
  mountLab: (cfg: Lab2DConfig) => void;
  dispatchStep: (stepId: StepId) => void;
  /** Exam mode: apply a step's effect from ANY stage, ignoring preconditions
   *  and stage gating (every action is allowed; ordering is graded at the end). */
  applyStepRaw: (stepId: StepId) => void;
  patchState: (mutator: (draft: Lab2DState) => void) => void;
  pushError: (messageKey: string) => void;
  checkStage: () => void;
  advanceStage: () => void;
  resetLab: () => void;
  setMicroscopeOpen: (open: boolean) => void;
}

/** Cheap structural clone for the patch path. State trees stay small. */
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export const useLab2DStore = create<Lab2DStore>((set, get) => ({
  config: null,
  state: freshLab2DState(),

  mountLab(cfg) {
    const initial = cfg.initialState();
    const seeded = bootstrapStages(cfg, initial);
    set({ config: cfg, state: seeded });
  },

  patchState(mutator) {
    const next = clone(get().state);
    mutator(next);
    const cfg = get().config;
    if (cfg) {
      const score = computeScore(next, cfg.scoreRules);
      next.score = { earned: score.earned, outOfTen: score.outOfTen };
    }
    set({ state: next });
  },

  dispatchStep(stepId) {
    const cfg = get().config;
    const state = get().state;
    if (!cfg) return;
    const step = findStep(cfg, state, stepId);
    if (!step) return;
    if (step.precondition && !step.precondition(state)) return;
    const next = clone(state);
    step.effect(next);
    if (step.markComplete !== false) {
      const withStep = markStepCompleted(next, stepId);
      const score = computeScore(withStep, cfg.scoreRules);
      withStep.score = { earned: score.earned, outOfTen: score.outOfTen };
      set({ state: withStep });
    } else {
      const score = computeScore(next, cfg.scoreRules);
      next.score = { earned: score.earned, outOfTen: score.outOfTen };
      set({ state: next });
    }
  },

  applyStepRaw(stepId) {
    const cfg = get().config;
    const state = get().state;
    if (!cfg) return;
    let step = null;
    for (const stg of cfg.stages) {
      const s = stg.steps.find((x) => x.id === stepId);
      if (s) {
        step = s;
        break;
      }
    }
    if (!step) return;
    const next = clone(state);
    step.effect(next);
    const score = computeScore(next, cfg.scoreRules);
    next.score = { earned: score.earned, outOfTen: score.outOfTen };
    set({ state: next });
  },

  pushError(messageKey) {
    const next = clone(get().state);
    next.errors.push({ ts: Date.now(), stageId: next.currentStageId, messageKey });
    set({ state: next });
  },

  checkStage() {
    const cfg = get().config;
    const state = get().state;
    if (!cfg) return;
    const stg = cfg.stages.find((s) => s.id === state.currentStageId);
    if (!stg) return;
    const result = stg.check(state);
    if (result.ok) {
      set({ state: setStageStatus(state, stg.id, "checked") });
    } else {
      const next = clone(state);
      next.errors.push({
        ts: Date.now(),
        stageId: stg.id,
        messageKey: result.reasonKey ?? "lab2d.error.stageIncomplete",
      });
      set({ state: setStageStatus(next, stg.id, "failed") });
    }
  },

  advanceStage() {
    const cfg = get().config;
    const state = get().state;
    if (!cfg) return;
    const idx = cfg.stages.findIndex((s) => s.id === state.currentStageId);
    if (idx < 0) return;
    let next = setStageStatus(state, state.currentStageId, "completed");
    const nextStage = cfg.stages[idx + 1];
    if (nextStage) {
      next = setStageStatus(next, nextStage.id, "active");
      next = { ...next, currentStageId: nextStage.id };
    }
    set({ state: next });
  },

  resetLab() {
    const cfg = get().config;
    if (!cfg) return;
    const initial = cfg.initialState();
    const seeded = bootstrapStages(cfg, initial);
    set({ state: seeded });
  },

  setMicroscopeOpen(open) {
    const next = clone(get().state);
    next.microscopeOpen = open;
    set({ state: next });
  },
}));
