"use client";

import type { ReactNode } from "react";
import type { Lab2DState, StepId } from "@/engine2d/types";

import { Match } from "../components2d/items/Match";
import { Matchbox } from "../components2d/items/Matchbox";
import { SpiritLamp } from "../components2d/items/SpiritLamp";
import { GlassSlide } from "../components2d/items/GlassSlide";
import { AlcoholPad } from "../components2d/items/AlcoholPad";
import { NaClBottle } from "../components2d/items/NaClBottle";
import { BacterialLoop } from "../components2d/items/BacterialLoop";
import { CultureTube } from "../components2d/items/CultureTube";
import { PetriDish } from "../components2d/items/PetriDish";
import { MethyleneBlueBottle } from "../components2d/items/MethyleneBlueBottle";
import { WashBottle } from "../components2d/items/WashBottle";
import { FilterPaper } from "../components2d/items/FilterPaper";
import { ImmersionOilBottle } from "../components2d/items/ImmersionOilBottle";
import { MicroscopeIcon } from "../components2d/items/MicroscopeIcon";
import { BiohazardBin } from "../components2d/items/BiohazardBin";
import { LoopStand } from "../components2d/items/LoopStand";
import { TestTubeRack } from "../components2d/items/TestTubeRack";
import { KidneyTray } from "../components2d/items/KidneyTray";
import { StainingBridge } from "../components2d/items/StainingBridge";

export type ItemId =
  | "match"
  | "matchbox"
  | "lamp"
  | "tray"
  | "bridge"
  | "slide"
  | "alcohol-pad"
  | "nacl"
  | "loop"
  | "loop-stand"
  | "tube-rack"
  | "culture"
  | "petri"
  | "mb"
  | "wash"
  | "filter"
  | "oil"
  | "bin"
  | "microscope";

export interface ItemDef {
  id: ItemId;
  label: string;
  /** Apparatus = a fixed station you drop tools onto (not a hand tool). */
  apparatus: boolean;
  /** Can other tools be dropped onto this one? (apparatus + the slide) */
  target: boolean;
  /** Intrinsic render size (px) — used for sidebar preview + bench hit-boxes. */
  w: number;
  h: number;
  /** Active-point offset from the rendered centre (px). Hit-testing uses the
   *  tool's working end (e.g. the loop's wire ring), not its middle. */
  tipX?: number;
  tipY?: number;
  /** Scale used only in the sidebar card preview. */
  preview: number;
  /** Optional TIGHT hit-zone (px, centred at the item ± hitDX/hitDY) used
   *  instead of the full w×h + drop-padding. E.g. the lamp only reacts at its
   *  flame, not over the whole glass body. */
  hitW?: number;
  hitH?: number;
  hitDX?: number;
  hitDY?: number;
  render: (
    state: Lab2DState,
    opts: { binBump: number; tubePlugOff?: boolean; petriLidOff?: boolean; trayStained?: boolean },
  ) => ReactNode;
}

export const ITEMS: ItemDef[] = [
  {
    id: "match",
    label: "Gugurt",
    apparatus: false,
    target: false,
    w: 100,
    h: 32,
    tipX: -32, // burning head (left end)
    preview: 1,
    render: (s) => <Match burnProgress={s.match.burnProgress} lit={s.match.lit} burned={s.match.burned} />,
  },
  {
    id: "matchbox",
    label: "Gugurt qutisi",
    apparatus: true,
    target: true,
    w: 110,
    h: 70,
    preview: 0.72,
    render: (s) => <Matchbox open={s.currentStageId === "stage-1" && !s.lamp.lit} />,
  },
  {
    id: "lamp",
    label: "Spirt lampasi",
    apparatus: true,
    target: true,
    w: 160,
    h: 200,
    // Only the flame at the top is active (≈ viewBox 80,40 → 60px above centre),
    // so tools must be brought to the FLAME, not anywhere on the lamp.
    hitW: 56,
    hitH: 78,
    hitDY: -58,
    preview: 0.42,
    render: (s) => <SpiritLamp uncapped={s.lamp.uncapped} lit={s.lamp.lit} />,
  },
  {
    id: "tray",
    label: "Buyraksimon lotok",
    apparatus: true,
    target: false,
    w: 440,
    h: 308,
    preview: 0.15,
    render: (_s, o) => <KidneyTray width={440} stained={o.trayStained} />,
  },
  {
    id: "bridge",
    label: "Bo'yash ko'prigi",
    apparatus: true,
    target: false,
    w: 150,
    h: 240,
    preview: 0.26,
    render: () => <StainingBridge width={150} />,
  },
  {
    id: "slide",
    label: "Buyum oynasi",
    apparatus: false,
    target: true,
    w: 96,
    h: 31,
    preview: 1.05,
    render: (s) => (
      <GlassSlide
        width={96}
        height={31}
        naclApplied={s.slide.naclApplied}
        smeared={s.slide.smeared}
        dried={s.slide.airDried}
        fixPasses={s.slide.fixPasses}
        mb={{ applied: s.slide.methyleneBlue.applied, washed: s.slide.methyleneBlue.washed }}
        oilApplied={s.slide.oilApplied}
      />
    ),
  },
  {
    id: "alcohol-pad",
    label: "Spirtli salfetka",
    apparatus: false,
    target: false,
    w: 74,
    h: 92,
    preview: 0.7,
    render: () => <AlcoholPad />,
  },
  {
    id: "nacl",
    label: "NaCl 0.9%",
    apparatus: false,
    target: false,
    w: 54,
    h: 104,
    preview: 0.66,
    render: () => <NaClBottle />,
  },
  {
    // Drawn BEFORE the loop so the stand (back) sits behind a seated loop; the
    // workbench paints <LoopStand front /> on top to frost the handle.
    id: "loop-stand",
    label: "Halqa shtativi",
    apparatus: true,
    target: false,
    w: 200,
    h: 164,
    preview: 0.34,
    render: () => <LoopStand width={200} />,
  },
  {
    id: "loop",
    label: "Bakteriologik halqa",
    apparatus: false,
    target: false,
    w: 220,
    h: 22,
    tipX: -100, // wire ring (left end) is the working point
    preview: 0.62,
    render: (s) => <BacterialLoop heatLevel={s.loop.heatLevel} />,
  },
  {
    id: "tube-rack",
    label: "Probirka shtativi",
    apparatus: true,
    target: false,
    w: 340,
    h: 210,
    preview: 0.2,
    render: () => <TestTubeRack width={340} />,
  },
  {
    id: "culture",
    label: "Kultura probirkasi",
    apparatus: true,
    target: true,
    w: 70,
    h: 231,
    preview: 0.34,
    render: (s, o) => <CultureTube sampled={s.loop.carriesSample || s.slide.smeared} plugOff={o.tubePlugOff} />,
  },
  {
    id: "petri",
    label: "Petri kosachasi",
    apparatus: true,
    target: true,
    w: 210,
    h: 128,
    preview: 0.3,
    render: (s, o) => <PetriDish sampled={s.loop.carriesSample || s.slide.smeared} lidOff={o.petriLidOff} width={210} />,
  },
  {
    id: "mb",
    label: "Metilen ko'ki",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.58,
    render: () => <MethyleneBlueBottle />,
  },
  {
    id: "wash",
    label: "Distillangan suv",
    apparatus: false,
    target: false,
    w: 56,
    h: 100,
    preview: 0.7,
    render: () => <WashBottle />,
  },
  {
    id: "filter",
    label: "Filtr qog'oz",
    apparatus: false,
    target: false,
    w: 60,
    h: 71,
    preview: 0.9,
    render: () => <FilterPaper width={60} />,
  },
  {
    id: "oil",
    label: "Immersion moyi",
    apparatus: false,
    target: false,
    w: 50,
    h: 96,
    preview: 0.72,
    render: () => <ImmersionOilBottle />,
  },
  {
    id: "bin",
    label: "Biohazard idishi",
    apparatus: true,
    target: true,
    w: 120,
    h: 150,
    preview: 0.46,
    render: (_s, { binBump }) => <BiohazardBin bumpKey={binBump} />,
  },
  {
    id: "microscope",
    label: "Mikroskop",
    apparatus: true,
    target: true,
    w: 204,
    h: 289,
    preview: 0.3,
    render: (s) => <MicroscopeIcon enabled={s.slide.oilApplied} scale={1.7} />,
  },
];

export const ITEM_BY_ID: Record<ItemId, ItemDef> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
) as Record<ItemId, ItemDef>;

/**
 * The single step a (tool → target) drop performs in the current phase, or
 * null when the combination is meaningless. Timing/sequence is still enforced
 * by the engine step preconditions + active-stage gating.
 */
export function intentFor(tool: ItemId, target: ItemId, s: Lab2DState): StepId | null {
  switch (tool) {
    case "match":
      if (target === "matchbox") return s.match.struck ? null : "strike-match";
      if (target === "lamp") return s.match.lit && !s.lamp.lit ? "light-lamp" : null;
      if (target === "bin") return "discard-match";
      return null;
    case "alcohol-pad":
      return target === "slide" ? "clean-slide" : null;
    case "nacl":
      return target === "slide" ? "add-nacl" : null;
    case "loop":
      if (target === "lamp") return s.slide.smeared && !s.loop.resterilized ? "resterilize-loop" : "sterilize-loop";
      if (target === "culture" || target === "petri") return "take-sample";
      if (target === "slide") return "smear-sample";
      return null;
    case "slide":
      if (target === "lamp") return "flame-fix";
      if (target === "microscope") return "open-microscope";
      return null;
    case "mb":
      return target === "slide" ? "apply-mb" : null;
    case "wash":
      return target === "slide" ? "wash-mb" : null;
    case "filter":
      return target === "slide" ? "blot-filter" : null;
    case "oil":
      return target === "slide" ? "apply-oil" : null;
    default:
      return null;
  }
}

/** The item the student is expected to use next (gets a highlight in the tray). */
export function requiredItem(s: Lab2DState): ItemId | null {
  switch (s.currentStageId) {
    case "stage-1":
      return "match";
    case "stage-2":
      if (s.loop.sterilizePasses < 3) return "loop";
      if (!s.loop.carriesSample) return "loop";
      if (!s.slide.onRack) return "slide";
      if (!s.slide.cleaned) return "alcohol-pad";
      if (!s.slide.naclApplied) return "nacl";
      if (!s.slide.smeared) return "loop";
      if (!s.loop.resterilized) return "loop";
      return null;
    case "stage-3":
      return "slide";
    case "stage-4":
      if (!s.slide.methyleneBlue.applied) return "mb";
      if (!s.slide.methyleneBlue.washed) return "wash";
      if (!s.slide.blotted) return "filter";
      if (!s.slide.oilApplied) return "oil";
      return "slide";
    default:
      return null;
  }
}
