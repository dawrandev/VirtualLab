import { create } from "zustand";
import { freshLabState } from "@/engine/initialState";
import { interactionRegistry } from "@/engine/interactionRegistry";
import { ScoreEngine } from "@/engine/scoring";
import { StepMachine } from "@/engine/stateMachine";
import type {
  ActionId,
  LabConfig,
  LabState,
  ToolId,
  ZoneId,
} from "@/engine/types";

interface LabStoreApi {
  state: LabState;
  configId: number | null;
  stepMachine: StepMachine | null;
  scoreEngine: ScoreEngine | null;

  /** Mount a lab config: install rubric, step machine, fresh state. */
  mountLab: (config: LabConfig) => void;
  /** Reset state for the currently-mounted lab. */
  resetLab: () => void;

  /** Pure mutation helpers. Each returns nothing; call recompute() if needed. */
  patch: (mutate: (s: LabState) => void) => void;

  /** UI/drag actions */
  startDrag: (toolId: ToolId) => void;
  endDrag: () => void;
  setHoveredZone: (zoneId: ZoneId | null) => void;

  /** Modal flow */
  openModalForStep: (stepId: number) => void;
  closeModal: () => void;

  /** Dispatch an action via the registry. */
  dispatchAction: (actionId: ActionId, payload?: unknown) => void;

  /** Push a localized error message key to the errors stack. */
  pushError: (key: string) => void;
  clearErrors: () => void;
}

/**
 * Apply a partial mutation produced by an ActionHandler.
 * Performs a shallow merge of nested state slices we know about.
 */
function applyActionPatch(state: LabState, patch: Partial<LabState>): LabState {
  if (!patch) return state;
  // Deep-ish merge for known slice fields
  const next: LabState = { ...state };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      // @ts-expect-error — dynamic slice merge
      next[k] = { ...(state[k as keyof LabState] as object), ...v };
    } else {
      // @ts-expect-error — dynamic slice merge
      next[k] = v;
    }
  }
  return next;
}

export const useLabStore = create<LabStoreApi>((set, get) => ({
  state: freshLabState(1),
  configId: null,
  stepMachine: null,
  scoreEngine: null,

  mountLab: (config) => {
    const stepMachine = new StepMachine(config.steps);
    const scoreEngine = new ScoreEngine(config.rubric);
    const fresh = freshLabState(config.id);
    fresh.score = scoreEngine.evaluate(fresh);
    fresh.currentStep = stepMachine.currentFor(fresh);
    fresh.pendingModalStep = fresh.currentStep;
    set({
      configId: config.id,
      stepMachine,
      scoreEngine,
      state: fresh,
    });
  },

  resetLab: () => {
    const { configId, stepMachine, scoreEngine } = get();
    if (!configId || !stepMachine || !scoreEngine) return;
    const fresh = freshLabState(configId);
    fresh.score = scoreEngine.evaluate(fresh);
    fresh.currentStep = stepMachine.currentFor(fresh);
    fresh.pendingModalStep = fresh.currentStep;
    set({ state: fresh });
  },

  patch: (mutate) => {
    const { state, stepMachine, scoreEngine } = get();
    const draft: LabState = structuredClone(state);
    mutate(draft);
    if (scoreEngine) {
      draft.score = scoreEngine.evaluate(draft);
    }
    if (stepMachine) {
      const newStep = stepMachine.reconcile(state, draft);
      if (newStep !== null) {
        draft.currentStep = newStep;
        // Auto-open the modal for the next step (unless lab is finished)
        const isFinished = stepMachine.isAllComplete(draft);
        draft.pendingModalStep = isFinished ? null : newStep;
        if (isFinished) {
          draft.resultSceneVisible = true;
        }
      }
    }
    set({ state: draft });
  },

  startDrag: (toolId) => {
    get().patch((s) => {
      s.draggedToolId = toolId;
    });
  },

  endDrag: () => {
    get().patch((s) => {
      s.draggedToolId = null;
    });
  },

  setHoveredZone: (zoneId) => {
    get().patch((s) => {
      s.hoveredZoneId = zoneId;
    });
  },

  openModalForStep: (stepId) => {
    get().patch((s) => {
      s.pendingModalStep = stepId;
    });
  },

  closeModal: () => {
    get().patch((s) => {
      s.pendingModalStep = null;
    });
  },

  dispatchAction: (actionId, payload) => {
    const handler = interactionRegistry.get(actionId);
    if (!handler) {
      console.warn(`[labStore] no handler registered for action ${actionId}`);
      return;
    }
    const { state, stepMachine, scoreEngine } = get();
    const result = handler(state, payload);
    if (!result) return;
    const merged = applyActionPatch(state, result);
    if (scoreEngine) merged.score = scoreEngine.evaluate(merged);
    if (stepMachine) {
      const newStep = stepMachine.reconcile(state, merged);
      if (newStep !== null) {
        merged.currentStep = newStep;
        const isFinished = stepMachine.isAllComplete(merged);
        merged.pendingModalStep = isFinished ? null : newStep;
        if (isFinished) merged.resultSceneVisible = true;
      }
    }
    set({ state: merged });
  },

  pushError: (key) => {
    get().patch((s) => {
      s.errors.push(key);
      // Keep only last 5 errors
      if (s.errors.length > 5) s.errors.shift();
    });
  },

  clearErrors: () => {
    get().patch((s) => {
      s.errors = [];
    });
  },
}));
