import type { Lab2DConfig, Lab2DState, StageStatus, StageId, StepId } from "./types";

/** Initializes per-stage tracking when a lab is first mounted. */
export function bootstrapStages(cfg: Lab2DConfig, state: Lab2DState): Lab2DState {
  const stages: Lab2DState["stages"] = {};
  for (let i = 0; i < cfg.stages.length; i++) {
    const stg = cfg.stages[i];
    stages[stg.id] = {
      status: i === 0 ? "active" : "pending",
      stepsCompleted: {},
    };
  }
  return { ...state, currentStageId: cfg.stages[0].id, stages };
}

/** Returns the index of the active stage in cfg.stages. */
export function currentStageIndex(cfg: Lab2DConfig, state: Lab2DState): number {
  return cfg.stages.findIndex((s) => s.id === state.currentStageId);
}

/** Looks up step by id only in the active stage. Cross-stage steps must reuse
 *  the same id; the engine matches against the current stage's step list. */
export function findStep(
  cfg: Lab2DConfig,
  state: Lab2DState,
  stepId: StepId,
) {
  const stg = cfg.stages.find((s) => s.id === state.currentStageId);
  if (!stg) return null;
  return stg.steps.find((s) => s.id === stepId) ?? null;
}

/** Marks the given stage with a new status. */
export function setStageStatus(state: Lab2DState, stageId: StageId, status: StageStatus): Lab2DState {
  if (!state.stages[stageId]) return state;
  return {
    ...state,
    stages: {
      ...state.stages,
      [stageId]: { ...state.stages[stageId], status },
    },
  };
}

/** Marks a step completed in the active stage. Returns updated state. */
export function markStepCompleted(state: Lab2DState, stepId: StepId): Lab2DState {
  const stageId = state.currentStageId;
  if (!state.stages[stageId]) return state;
  return {
    ...state,
    stages: {
      ...state.stages,
      [stageId]: {
        ...state.stages[stageId],
        stepsCompleted: { ...state.stages[stageId].stepsCompleted, [stepId]: true },
      },
    },
  };
}
