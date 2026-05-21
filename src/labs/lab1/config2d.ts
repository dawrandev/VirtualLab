import { freshLab2DState } from "@/engine2d/initialState";
import type { Lab2DConfig, ScoreRule, Stage2D, StepCheckResult } from "@/engine2d/types";
import { Lab1Scene2D } from "./components2d/Lab1Scene2D";
import { Lab1ResultModal } from "./components2d/Lab1ResultModal";
import { microscopeResult } from "./content/microscope";

/**
 * Lab 1 — **Methylene Blue Simple Staining** (изучение морфологии бактериальной
 * клетки). Same coarse 4-stage structure as before, but the staining stage now
 * uses a single methylene-blue dropper instead of the Gram chain, and the
 * missing protocol steps are present: slide cleaning, loop re-sterilization,
 * air-drying, filter-paper blotting and immersion oil.
 *
 * Re-sterilizing the loop happens AFTER the smear (to burn off residual
 * microbes) — the microbiologically correct order from the official assignment.
 */
const SCORE_RULES: ScoreRule[] = [
  { id: "lampLit", weight: 0.5, predicate: (s) => s.lamp.lit },
  { id: "matchDiscarded", weight: 0.5, predicate: (s) => s.trash.match === true },
  { id: "slideCleaned", weight: 1, predicate: (s) => s.slide.cleaned },
  { id: "loopSterilized", weight: 1, predicate: (s) => s.loop.sterilizePasses >= 3 },
  { id: "sampleTaken", weight: 0.5, predicate: (s) => s.loop.carriesSample || s.slide.smeared },
  { id: "naclApplied", weight: 1, predicate: (s) => s.slide.naclApplied },
  { id: "smeared", weight: 1, predicate: (s) => s.slide.smeared },
  { id: "resterilized", weight: 0.5, predicate: (s) => s.loop.resterilized },
  { id: "airDried", weight: 1, predicate: (s) => s.slide.airDried },
  { id: "fixed", weight: 1, predicate: (s) => s.slide.fixPasses >= 3 },
  {
    id: "mbStained",
    weight: 1,
    predicate: (s) => s.slide.methyleneBlue.applied && s.slide.methyleneBlue.washed,
  },
  { id: "blotted", weight: 0.5, predicate: (s) => s.slide.blotted },
  { id: "oilApplied", weight: 0.5, predicate: (s) => s.slide.oilApplied },
  // Total = 10.0
];

const ok = (): StepCheckResult => ({ ok: true });
const fail = (reasonKey: string): StepCheckResult => ({ ok: false, reasonKey });

const STAGES: Stage2D[] = [
  {
    id: "stage-1",
    titleKey: "lab1.stage1.title",
    steps: [
      {
        id: "strike-match",
        hintKey: "lab1.hint.strikeMatch",
        effect: (d) => {
          d.match.struck = true;
          d.match.lit = true;
        },
      },
      {
        id: "light-lamp",
        hintKey: "lab1.hint.lightLamp",
        effect: (d) => {
          d.lamp.uncapped = true;
          d.lamp.lit = true;
        },
        precondition: (s) => s.match.lit,
      },
      {
        id: "discard-match",
        hintKey: "lab1.hint.discardMatch",
        effect: (d) => {
          d.trash.match = true;
          d.match.lit = false;
          d.match.burned = true;
        },
      },
    ],
    check: (s) => {
      if (!s.lamp.lit) return fail("lab1.error.lampNotLit");
      if (!s.trash.match) return fail("lab1.error.matchNotDiscarded");
      return ok();
    },
  },
  {
    id: "stage-2",
    titleKey: "lab1.stage2.title",
    steps: [
      {
        // Completed by HOLDING the loop in the flame until it glows
        // (the workbench drives a hold timer; one completion sterilizes it).
        id: "sterilize-loop",
        hintKey: "lab1.hint.sterilizeLoop",
        effect: (d) => {
          d.loop.sterilizePasses = 3;
          d.loop.heatLevel = 1;
        },
      },
      {
        id: "take-sample",
        hintKey: "lab1.hint.takeSample",
        effect: (d) => {
          d.loop.carriesSample = true;
        },
        precondition: (s) => s.loop.sterilizePasses >= 3,
      },
      {
        id: "pick-slide",
        hintKey: "lab1.hint.pickSlide",
        effect: (d) => {
          d.slide.onRack = true;
        },
      },
      {
        id: "clean-slide",
        hintKey: "lab1.hint.cleanSlide",
        effect: (d) => {
          d.slide.cleaned = true;
        },
        precondition: (s) => s.slide.onRack && s.lamp.lit,
      },
      {
        id: "add-nacl",
        hintKey: "lab1.hint.addNacl",
        effect: (d) => {
          d.slide.naclApplied = true;
        },
        precondition: (s) => s.slide.onRack && s.slide.cleaned,
      },
      {
        id: "smear-sample",
        hintKey: "lab1.hint.smearSample",
        effect: (d) => {
          d.slide.smeared = true;
        },
        precondition: (s) => s.slide.naclApplied && s.loop.carriesSample,
      },
      {
        id: "resterilize-loop",
        hintKey: "lab1.hint.resterilizeLoop",
        effect: (d) => {
          d.loop.resterilized = true;
          d.loop.carriesSample = false;
          d.loop.heatLevel = 1;
        },
        precondition: (s) => s.slide.smeared,
      },
    ],
    check: (s) => {
      if (s.loop.sterilizePasses < 3) return fail("lab1.error.loopNotSterile");
      if (!s.slide.onRack) return fail("lab1.error.slideMissing");
      if (!s.slide.cleaned) return fail("lab1.error.slideNotClean");
      if (!s.slide.naclApplied) return fail("lab1.error.noNacl");
      if (!s.slide.smeared) return fail("lab1.error.smearWeak");
      if (!s.loop.resterilized) return fail("lab1.error.loopNotResterile");
      return ok();
    },
  },
  {
    id: "stage-3",
    titleKey: "lab1.stage3.title",
    steps: [
      {
        id: "air-dry",
        hintKey: "lab1.hint.airDry",
        effect: (d) => {
          d.slide.airDried = true;
        },
        precondition: (s) => s.slide.smeared,
      },
      {
        // Completed by HOLDING the slide over the flame (hold timer in the
        // workbench); one completion fixes the smear.
        id: "flame-fix",
        hintKey: "lab1.hint.flameFix",
        effect: (d) => {
          d.slide.fixPasses = 3;
        },
        precondition: (s) => s.slide.airDried,
      },
    ],
    check: (s) => {
      if (!s.slide.airDried) return fail("lab1.error.notDried");
      if (s.slide.fixPasses < 3) return fail("lab1.error.notFixed");
      return ok();
    },
  },
  {
    id: "stage-4",
    titleKey: "lab1.stage4.title",
    steps: [
      {
        id: "apply-mb",
        hintKey: "lab1.hint.applyMb",
        effect: (d) => {
          d.slide.methyleneBlue.applied = true;
          d.slide.methyleneBlue.appliedMs = Date.now();
        },
        precondition: (s) => s.slide.fixPasses >= 3,
      },
      {
        id: "wash-mb",
        hintKey: "lab1.hint.wash",
        effect: (d) => {
          d.slide.methyleneBlue.washed = true;
        },
        precondition: (s) => s.slide.methyleneBlue.applied,
      },
      {
        id: "blot-filter",
        hintKey: "lab1.hint.blotFilter",
        effect: (d) => {
          d.slide.blotted = true;
        },
        precondition: (s) => s.slide.methyleneBlue.washed,
      },
      {
        id: "apply-oil",
        hintKey: "lab1.hint.applyOil",
        effect: (d) => {
          d.slide.oilApplied = true;
        },
        precondition: (s) => s.slide.blotted,
      },
      {
        id: "open-microscope",
        hintKey: "lab1.hint.microscope",
        effect: (d) => {
          d.microscopeOpen = true;
        },
        precondition: (s) => s.slide.oilApplied,
      },
    ],
    check: (s) => {
      if (!s.slide.methyleneBlue.applied || !s.slide.methyleneBlue.washed)
        return fail("lab1.error.notStained");
      if (!s.slide.blotted) return fail("lab1.error.notBlotted");
      if (!s.slide.oilApplied) return fail("lab1.error.noOil");
      return ok();
    },
  },
];

const config: Lab2DConfig = {
  id: 1,
  slug: "methylene-blue-smear",
  titleKey: "lab1.title",
  stages: STAGES,
  initialState: () => freshLab2DState(),
  scoreRules: SCORE_RULES,
  microscope: microscopeResult,
  Scene: Lab1Scene2D,
  ResultModal: Lab1ResultModal,
};

export default config;
