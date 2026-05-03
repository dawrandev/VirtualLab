import { lazy } from "react";
import { fixationScore } from "@/engine/scoring";
import type { LabConfig, ScoreCriterion, StepConfig, ToolDef } from "@/engine/types";

const lab1Steps: StepConfig[] = [
  {
    id: 0,
    titleKey: "lab1.step0Title",
    descriptionKey: "lab1.step0Desc",
    isComplete: (s) => s.lamp.lit,
    canAdvance: (s) => s.lamp.lit,
  },
  {
    id: 1,
    titleKey: "lab1.step1Title",
    descriptionKey: "lab1.step1Desc",
    isComplete: (s) => s.sterilization.isSterilized,
    canAdvance: (s) => s.sterilization.isSterilized,
  },
  {
    id: 2,
    titleKey: "lab1.step2Title",
    descriptionKey: "lab1.step2Desc",
    isComplete: (s) => s.sampling.hasSample,
    canAdvance: (s) => s.sampling.hasSample,
  },
  {
    id: 3,
    titleKey: "lab1.step3Title",
    descriptionKey: "lab1.step3Desc",
    isComplete: (s) => s.smear.completed,
    canAdvance: (s) => s.smear.completed,
  },
  {
    id: 4,
    titleKey: "lab1.step4Title",
    descriptionKey: "lab1.step4Desc",
    isComplete: (s) => s.fixation.isFixed && s.fixation.isDried,
    canAdvance: (s) => s.fixation.isFixed,
  },
  {
    id: 5,
    titleKey: "lab1.step5Title",
    descriptionKey: "lab1.step5Desc",
    isComplete: (s) => s.dye.applied && s.wash.completed,
    canAdvance: (s) => s.dye.applied && s.wash.completed,
  },
  {
    id: 6,
    titleKey: "lab1.step6Title",
    descriptionKey: "lab1.step6Desc",
    isComplete: (s) => s.microscopeOpen,
    canAdvance: () => true,
  },
];

const lab1Tools: ToolDef[] = [
  {
    id: "match",
    initialPosition: [-0.4, 0.85, 0.25],
    inventoryIcon: "/icons/match.svg",
    gripStyle: "pinch",
    draggable: true,
    actions: [
      { zoneId: "matchbox-strike", actionId: "lightMatch" },
      { zoneId: "lamp-wick", actionId: "igniteLamp" },
    ],
  },
  {
    id: "loop",
    initialPosition: [-0.7, 0.85, 0],
    inventoryIcon: "/icons/loop.svg",
    gripStyle: "pencil",
    draggable: true,
    actions: [
      { zoneId: "flame", actionId: "sterilizeLoop" },
      { zoneId: "culture-tube", actionId: "collectSample" },
      { zoneId: "slide-area", actionId: "createSmearStroke" },
    ],
  },
  {
    id: "slide",
    initialPosition: [-0.7, 0.81, 0.4],
    inventoryIcon: "/icons/slide.svg",
    gripStyle: "pinch",
    draggable: true,
    actions: [{ zoneId: "fixation-flame", actionId: "fixSmear" }],
  },
  {
    id: "dyePipette",
    initialPosition: [0.6, 0.85, 0.4],
    inventoryIcon: "/icons/dye-pipette.svg",
    gripStyle: "pencil",
    draggable: true,
    actions: [{ zoneId: "slide-dye", actionId: "dropDye" }],
  },
  {
    id: "waterPipette",
    initialPosition: [0.8, 0.85, 0.4],
    inventoryIcon: "/icons/water-pipette.svg",
    gripStyle: "pencil",
    draggable: true,
    actions: [{ zoneId: "slide-water", actionId: "dropWater" }],
  },
  {
    id: "matchbox",
    initialPosition: [-0.4, 0.81, 0.2],
    inventoryIcon: "/icons/matchbox.svg",
    gripStyle: "palm",
    draggable: false,
    actions: [],
  },
  {
    id: "spiritLamp",
    initialPosition: [0, 0.83, 0.1],
    inventoryIcon: "/icons/lamp.svg",
    gripStyle: "palm",
    draggable: false,
    actions: [],
  },
  {
    id: "cultureTube",
    initialPosition: [0.5, 0.85, 0.0],
    inventoryIcon: "/icons/tube.svg",
    gripStyle: "pinch",
    draggable: false,
    actions: [],
  },
  {
    id: "microscope",
    initialPosition: [0.9, 0.81, -0.2],
    inventoryIcon: "/icons/microscope.svg",
    gripStyle: "palm",
    draggable: false,
    actions: [{ zoneId: "microscope-stage", actionId: "viewMicroscope" }],
  },
];

const lab1Rubric: ScoreCriterion[] = [
  {
    id: "lighting",
    maxPoints: 1.0,
    evaluator: (s) => (s.lamp.lit ? 1.0 : 0),
  },
  {
    id: "sterilization",
    maxPoints: 1.0,
    evaluator: (s) =>
      s.sterilization.isSterilized ? 1.0 : s.sterilization.holdMs > 0 ? 0.5 : 0,
  },
  {
    id: "sampling",
    maxPoints: 2.0,
    evaluator: (s) => Math.min(1, s.sampling.dipCount / 3) * 2.0,
  },
  {
    id: "smear",
    maxPoints: 1.0,
    evaluator: (s) => (s.smear.completed ? 1.0 : 0),
  },
  {
    id: "slideGrip",
    maxPoints: 1.0,
    evaluator: (s) => (s.slide.gripValid ? 1.0 : 0),
  },
  {
    id: "fixation",
    maxPoints: 2.0,
    evaluator: (s) => fixationScore(s.fixation.passes),
  },
  {
    id: "dye",
    maxPoints: 1.5,
    evaluator: (s) => (s.dye.applied ? 1.5 : 0),
  },
  {
    id: "washing",
    maxPoints: 1.5,
    evaluator: (s) => (s.wash.completed ? 1.5 : 0),
  },
  {
    id: "washingAngle",
    maxPoints: 0.5,
    evaluator: (s) => s.wash.bonus,
  },
];

const Lab1Scene = lazy(() => import("./components/Lab1Scene"));
const Lab1Result = lazy(() => import("./microscopeView"));

const lab1Config: LabConfig = {
  id: 1,
  slug: "bacterial-smear",
  titleKey: "lab1.title",
  descriptionKey: "lab1.subtitle",
  estimatedMinutes: 15,
  steps: lab1Steps,
  tools: lab1Tools,
  rubric: lab1Rubric,
  audio: [
    "burner_hum_loop",
    "success_ping",
    "error_buzz",
    "liquid_drop",
    "metal_clink",
    "match_strike",
    "lamp_ignition",
    "ui_click",
    "fanfare",
    "glass_smear_loop",
    "water_flow_loop",
  ],
  scene: Lab1Scene,
  resultView: Lab1Result,
};

export default lab1Config;
