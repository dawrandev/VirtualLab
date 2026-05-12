import { freshLab2DState } from "@/engine2d/initialState";
import type { Lab2DConfig, ScoreRule, Stage2D, StepCheckResult } from "@/engine2d/types";
import { Lab1Scene2D } from "./components2d/Lab1Scene2D";
import { Lab1ResultModal } from "./components2d/Lab1ResultModal";
import { microscopeResult } from "./content/microscope";

/** Scoring rubric — 10 weighted criteria, total = 10 points. */
const SCORE_RULES: ScoreRule[] = [
  { id: "lampLit", weight: 1, predicate: (s) => s.lamp.lit },
  { id: "loopSterilized", weight: 1, predicate: (s) => s.loop.sterilizePasses >= 3 },
  { id: "matchDiscarded", weight: 0.5, predicate: (s) => s.trash.match === true },
  { id: "slideOnRack", weight: 0.5, predicate: (s) => s.slide.onRack },
  { id: "naclApplied", weight: 1, predicate: (s) => s.slide.naclApplied },
  { id: "smeared", weight: 1, predicate: (s) => s.slide.smeared && s.slide.smearRotations >= 3 },
  { id: "dried", weight: 0.5, predicate: (s) => s.slide.dried },
  { id: "fixed", weight: 1, predicate: (s) => s.slide.fixPasses >= 3 },
  {
    id: "stainCv",
    weight: 1,
    predicate: (s) => s.slide.stains.cv.applied && s.slide.stains.cv.washed,
  },
  {
    id: "stainLugol",
    weight: 0.5,
    predicate: (s) => s.slide.stains.lugol.applied && s.slide.stains.lugol.washed,
  },
  {
    id: "stainDecolor",
    weight: 1,
    predicate: (s) => s.slide.stains.decolor.applied,
  },
  {
    id: "stainSafranin",
    weight: 1,
    predicate: (s) => s.slide.stains.safranin.applied && s.slide.stains.safranin.washed,
  },
];

/* Helper to produce a typed check result. */
const ok = (): StepCheckResult => ({ ok: true });
const fail = (reasonKey: string): StepCheckResult => ({ ok: false, reasonKey });

const STAGES: Stage2D[] = [
  {
    id: "stage-1",
    titleKey: "lab1.stage1.title",
    steps: [
      { id: "strike-match", hintKey: "lab1.hint.strikeMatch", effect: (d) => { d.match.struck = true; d.match.lit = true; } },
      { id: "open-lamp", hintKey: "lab1.hint.openLamp", effect: (d) => { d.lamp.uncapped = true; } },
      { id: "light-lamp", hintKey: "lab1.hint.lightLamp", effect: (d) => { d.lamp.lit = true; }, precondition: (s) => s.match.lit && s.lamp.uncapped },
      { id: "discard-match", hintKey: "lab1.hint.discardMatch", effect: (d) => { d.trash.match = true; d.match.lit = false; d.match.burned = true; } },
      { id: "sterilize-loop", hintKey: "lab1.hint.sterilizeLoop", effect: (d) => { d.loop.sterilizePasses = Math.min(3, d.loop.sterilizePasses + 1); d.loop.heatLevel = 1; } },
    ],
    check: (s) => {
      if (!s.lamp.uncapped) return fail("lab1.error.lampNotOpen");
      if (!s.lamp.lit) return fail("lab1.error.lampNotLit");
      if (s.loop.sterilizePasses < 3) return fail("lab1.error.loopNotSterile");
      return ok();
    },
  },
  {
    id: "stage-2",
    titleKey: "lab1.stage2.title",
    steps: [
      { id: "pick-slide", hintKey: "lab1.hint.pickSlide", effect: (d) => { d.slide.onRack = true; } },
      { id: "add-nacl", hintKey: "lab1.hint.addNacl", effect: (d) => { d.slide.naclApplied = true; }, precondition: (s) => s.slide.onRack },
      { id: "take-sample", hintKey: "lab1.hint.takeSample", effect: (d) => { d.loop.carriesSample = true; }, precondition: (s) => s.loop.sterilizePasses >= 3 },
      { id: "smear-sample", hintKey: "lab1.hint.smearSample", effect: (d) => { d.slide.smeared = true; d.slide.smearRotations = Math.min(5, d.slide.smearRotations + 1); }, precondition: (s) => s.slide.naclApplied && s.loop.carriesSample },
    ],
    check: (s) => {
      if (!s.slide.onRack) return fail("lab1.error.slideMissing");
      if (!s.slide.naclApplied) return fail("lab1.error.noNacl");
      if (!s.slide.smeared || s.slide.smearRotations < 3) return fail("lab1.error.smearWeak");
      return ok();
    },
  },
  {
    id: "stage-3",
    titleKey: "lab1.stage3.title",
    steps: [
      { id: "air-dry", hintKey: "lab1.hint.airDry", effect: (d) => { d.slide.dried = true; }, precondition: (s) => s.slide.smeared },
      { id: "flame-fix", hintKey: "lab1.hint.flameFix", effect: (d) => { d.slide.fixPasses = Math.min(3, d.slide.fixPasses + 1); }, precondition: (s) => s.slide.dried },
    ],
    check: (s) => {
      if (!s.slide.dried) return fail("lab1.error.notDried");
      if (s.slide.fixPasses < 3) return fail("lab1.error.notFixed");
      return ok();
    },
  },
  {
    id: "stage-4",
    titleKey: "lab1.stage4.title",
    steps: [
      { id: "stain-cv", hintKey: "lab1.hint.stainCv", effect: (d) => { d.slide.stains.cv.applied = true; d.slide.stains.cv.appliedMs = Date.now(); d.slide.activeStain = "cv"; } },
      { id: "wash-cv", hintKey: "lab1.hint.wash", effect: (d) => { d.slide.stains.cv.washed = true; d.slide.activeStain = null; }, precondition: (s) => s.slide.stains.cv.applied },
      { id: "stain-lugol", hintKey: "lab1.hint.stainLugol", effect: (d) => { d.slide.stains.lugol.applied = true; d.slide.stains.lugol.appliedMs = Date.now(); d.slide.activeStain = "lugol"; }, precondition: (s) => s.slide.stains.cv.washed },
      { id: "wash-lugol", hintKey: "lab1.hint.wash", effect: (d) => { d.slide.stains.lugol.washed = true; d.slide.activeStain = null; }, precondition: (s) => s.slide.stains.lugol.applied },
      { id: "stain-decolor", hintKey: "lab1.hint.stainDecolor", effect: (d) => { d.slide.stains.decolor.applied = true; d.slide.stains.decolor.appliedMs = Date.now(); d.slide.activeStain = "decolor"; d.slide.stains.cv.washed = true; }, precondition: (s) => s.slide.stains.lugol.washed },
      { id: "stain-safranin", hintKey: "lab1.hint.stainSafranin", effect: (d) => { d.slide.stains.safranin.applied = true; d.slide.stains.safranin.appliedMs = Date.now(); d.slide.activeStain = "safranin"; }, precondition: (s) => s.slide.stains.decolor.applied },
      { id: "wash-safranin", hintKey: "lab1.hint.wash", effect: (d) => { d.slide.stains.safranin.washed = true; d.slide.activeStain = null; }, precondition: (s) => s.slide.stains.safranin.applied },
      { id: "open-microscope", hintKey: "lab1.hint.microscope", effect: (d) => { d.microscopeOpen = true; }, precondition: (s) => s.slide.stains.safranin.washed },
    ],
    check: (s) => {
      const seq =
        s.slide.stains.cv.applied &&
        s.slide.stains.cv.washed &&
        s.slide.stains.lugol.applied &&
        s.slide.stains.lugol.washed &&
        s.slide.stains.decolor.applied &&
        s.slide.stains.safranin.applied &&
        s.slide.stains.safranin.washed;
      if (!seq) return fail("lab1.error.gramSequenceIncomplete");
      return ok();
    },
  },
];

const config: Lab2DConfig = {
  id: 1,
  slug: "bacterial-smear",
  titleKey: "lab1.title",
  stages: STAGES,
  initialState: () => freshLab2DState(),
  scoreRules: SCORE_RULES,
  microscope: microscopeResult,
  Scene: Lab1Scene2D,
  ResultModal: Lab1ResultModal,
};

export default config;
