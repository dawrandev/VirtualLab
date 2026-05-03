import type { LabState, StepConfig } from "./types";

/**
 * Linear step state machine. Reconciles the current step from the lowest
 * non-complete step's id. Mirrors reference's `currentStep` derivation.
 */
export class StepMachine {
  constructor(private readonly steps: StepConfig[]) {}

  /** Return id of the first step that is not yet complete, or last+1 if all done. */
  currentFor(state: LabState): number {
    for (const step of this.steps) {
      if (!step.isComplete(state)) return step.id;
    }
    return this.steps[this.steps.length - 1].id + 1;
  }

  /** Whether all steps are complete (lab finished). */
  isAllComplete(state: LabState): boolean {
    return this.steps.every((s) => s.isComplete(state));
  }

  /** May the user advance the modal past this step? Defaults to step's canAdvance. */
  canAdvance(state: LabState, stepId: number): boolean {
    const step = this.steps.find((s) => s.id === stepId);
    return step ? step.canAdvance(state) : false;
  }

  /**
   * Detect step boundary crossings between two state snapshots.
   * Returns the new step id if it advanced, otherwise null.
   */
  reconcile(prev: LabState, next: LabState): number | null {
    const before = this.currentFor(prev);
    const after = this.currentFor(next);
    return after !== before ? after : null;
  }

  get all(): readonly StepConfig[] {
    return this.steps;
  }
}
