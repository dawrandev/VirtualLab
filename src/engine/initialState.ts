import type { InventorySlot, LabState, ToolId, Vec3 } from "./types";

const idleSlot: InventorySlot = {
  inInventory: true,
  placed: false,
  position: [0, 0, 0] as Vec3,
  rotation: [0, 0, 0, 1],
};

export function freshInventory(): Record<ToolId, InventorySlot> {
  return {
    loop: { ...idleSlot },
    slide: { ...idleSlot },
    dyePipette: { ...idleSlot },
    waterPipette: { ...idleSlot },
    match: { ...idleSlot },
    matchbox: {
      inInventory: false,
      placed: true,
      position: [-0.4, 0.81, 0.2],
      rotation: [0, 0, 0, 1],
    },
    spiritLamp: {
      inInventory: false,
      placed: true,
      position: [0, 0.83, 0.1],
      rotation: [0, 0, 0, 1],
    },
    cultureTube: {
      inInventory: false,
      placed: true,
      position: [0.5, 0.85, 0.0],
      rotation: [0, 0, 0, 1],
    },
    microscope: {
      inInventory: false,
      placed: true,
      position: [0.9, 0.81, -0.2],
      rotation: [0, 0, 0, 1],
    },
  };
}

export function freshLabState(labId = 1): LabState {
  return {
    labId,
    currentStep: 0,
    pendingModalStep: 0,

    inventory: freshInventory(),
    draggedToolId: null,
    hoveredZoneId: null,

    match: {
      lit: false,
      burned: false,
      burnTimeLeft: 5,
      hasIgnitedLamp: false,
      frictionDistance: 0,
      burnProgress: 0,
    },
    lamp: { lit: false },
    sterilization: { holdMs: 0, isSterilized: false },
    sampling: {
      dipCount: 0,
      targetDips: 3,
      hasSample: false,
      liquidLevel: 0.6,
    },
    smear: {
      strokeCount: 0,
      orbitTurns: 0,
      inTargetZone: false,
      completed: false,
    },
    fixation: {
      passes: 0,
      isFixed: false,
      isDrying: false,
      isDried: false,
      dryingTimeLeft: 4,
    },
    dye: { applied: false, matured: false, timeLeft: 7 },
    wash: { completed: false, angleCorrect: false, bonus: 0 },
    slide: { gripValid: true, rotation: 0 },

    score: { byCriterion: {}, total: 0, outOfTen: 0 },
    errors: [],
    audio: { initialized: false, muted: false, volume: 0.6 },
    microscopeOpen: false,
    resultSceneVisible: false,
  };
}
