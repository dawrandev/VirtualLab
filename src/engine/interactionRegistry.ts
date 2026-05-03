import type { ActionId, LabState } from "./types";

export type ActionHandler = (
  state: LabState,
  payload?: unknown,
) => Partial<LabState> | void;

/**
 * Per-lab interaction registry. Each lab registers handlers for its action ids
 * during scene mount; the labStore's `dispatchAction(actionId, payload)`
 * looks them up here.
 */
class InteractionRegistry {
  private handlers = new Map<ActionId, ActionHandler>();

  register(id: ActionId, handler: ActionHandler): () => void {
    this.handlers.set(id, handler);
    return () => this.handlers.delete(id);
  }

  registerMany(map: Partial<Record<ActionId, ActionHandler>>): () => void {
    const ids: ActionId[] = [];
    for (const [id, handler] of Object.entries(map)) {
      if (!handler) continue;
      ids.push(id as ActionId);
      this.handlers.set(id as ActionId, handler);
    }
    return () => {
      for (const id of ids) this.handlers.delete(id);
    };
  }

  get(id: ActionId): ActionHandler | undefined {
    return this.handlers.get(id);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const interactionRegistry = new InteractionRegistry();
