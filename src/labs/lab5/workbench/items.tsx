"use client";

import type { ReactNode } from "react";
import { dropStage, canObserve, type WetMountState, type WetIntent } from "../state";

import { SpiritLamp } from "@/labs/lab1/components2d/items/SpiritLamp";
import { Match } from "@/labs/lab1/components2d/items/Match";
import { Matchbox } from "@/labs/lab1/components2d/items/Matchbox";
import { BiohazardBin } from "@/labs/lab1/components2d/items/BiohazardBin";
import { BacterialLoop } from "@/labs/lab1/components2d/items/BacterialLoop";
import { MicroscopeIcon } from "@/labs/lab1/components2d/items/MicroscopeIcon";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { LoopStand } from "@/labs/lab1/components2d/items/LoopStand";
import { StainingBridge } from "@/labs/lab1/components2d/items/StainingBridge";
import { KidneyTray } from "@/labs/lab1/components2d/items/KidneyTray";
import { NaClBottle } from "@/labs/lab1/components2d/items/NaClBottle";
import { CultureTube } from "@/labs/lab1/components2d/items/CultureTube";
import { FilterPaper } from "@/labs/lab1/components2d/items/FilterPaper";
import { WetMountSlide } from "../components2d/items/WetMountSlide";
import { CoverSlip } from "../components2d/items/CoverSlip";

export type Lab5ItemId =
  | "slide"
  | "coverslip"
  | "matchbox"
  | "match"
  | "bin"
  | "lamp"
  | "saline"
  | "loop"
  | "loop-stand"
  | "culture"
  | "rack"
  | "filter"
  | "bridge"
  | "tray"
  | "microscope";

export interface Lab5ItemDef {
  id: Lab5ItemId;
  label: string;
  apparatus: boolean;
  target: boolean;
  w: number;
  h: number;
  tipX?: number;
  tipY?: number;
  preview: number;
  hitW?: number;
  hitH?: number;
  hitDX?: number;
  hitDY?: number;
  render: (
    state: WetMountState,
    opts: { loopHeat?: number; slideWarming?: boolean; tubePlugOff?: boolean; filterWet?: boolean; binBump?: number },
  ) => ReactNode;
}

export const LAB5_ITEMS: Lab5ItemDef[] = [
  {
    id: "slide",
    label: "lab5.items.slide",
    apparatus: false,
    target: true,
    w: 120,
    h: 38,
    preview: 0.92,
    render: (s, o) => <WetMountSlide stage={dropStage(s)} degreased={s.slideDegreased} warming={o.slideWarming} width={120} height={38} />,
  },
  {
    id: "coverslip",
    label: "lab5.items.coverslip",
    apparatus: false,
    target: false,
    w: 72,
    h: 62,
    preview: 0.7,
    render: () => <CoverSlip width={72} />,
  },
  {
    id: "matchbox",
    label: "lab5.items.matchbox",
    apparatus: true,
    target: true,
    w: 110,
    h: 70,
    preview: 0.62,
    render: () => <Matchbox open={false} />,
  },
  {
    id: "match",
    label: "lab5.items.match",
    apparatus: false,
    target: false,
    w: 100,
    h: 32,
    tipX: -32, // burning head (left end) — must match Lab 1 so the flame hits
    preview: 0.7,
    render: (s) => <Match lit={s.match.lit} burnProgress={s.match.lit ? 0.2 : 0} burned={false} />,
  },
  {
    id: "bin",
    label: "lab5.items.bin",
    apparatus: true,
    target: true,
    w: 120,
    h: 150,
    preview: 0.46,
    render: (_s, o) => <BiohazardBin bumpKey={o.binBump ?? 0} />,
  },
  {
    id: "lamp",
    label: "lab5.items.lamp",
    apparatus: true,
    target: true,
    w: 160,
    h: 200,
    hitW: 56,
    hitH: 78,
    hitDY: -58,
    preview: 0.42,
    render: (s) => <SpiritLamp uncapped lit={s.lamp.lit} />,
  },
  {
    id: "saline",
    label: "lab5.items.saline",
    apparatus: false,
    target: false,
    w: 54,
    h: 104,
    tipY: 46,
    preview: 0.7,
    render: () => <NaClBottle />,
  },
  {
    id: "loop",
    label: "lab5.items.loop",
    apparatus: false,
    target: false,
    w: 220,
    h: 22,
    tipX: -100,
    preview: 0.62,
    render: (_s, o) => <BacterialLoop heatLevel={o.loopHeat ?? 0} />,
  },
  {
    id: "loop-stand",
    label: "lab5.items.loopStand",
    apparatus: true,
    target: false,
    w: 200,
    h: 164,
    preview: 0.34,
    render: () => <LoopStand width={200} />,
  },
  {
    id: "culture",
    label: "lab5.items.culture",
    apparatus: true,
    target: true,
    w: 70,
    h: 231,
    preview: 0.34,
    render: (s, o) => <CultureTube sampled={s.loopCharged || s.mixed} plugOff={o.tubePlugOff} />,
  },
  {
    id: "rack",
    label: "lab5.items.rack",
    apparatus: true,
    target: false,
    w: 340,
    h: 210,
    preview: 0.2,
    render: () => <TestTubeRack width={340} />,
  },
  {
    id: "filter",
    label: "lab5.items.filter",
    apparatus: false,
    target: false,
    w: 84,
    h: 100,
    tipY: 40,
    preview: 0.6,
    render: (_s, o) => <FilterPaper width={84} wet={o.filterWet} />,
  },
  {
    id: "bridge",
    label: "lab5.items.bridge",
    apparatus: true,
    target: false,
    w: 150,
    h: 240,
    preview: 0.26,
    render: () => <StainingBridge width={150} />,
  },
  {
    id: "tray",
    label: "lab5.items.tray",
    apparatus: true,
    target: false,
    w: 440,
    h: 308,
    preview: 0.15,
    render: () => <KidneyTray width={440} />,
  },
  {
    id: "microscope",
    label: "lab5.items.microscope",
    apparatus: true,
    target: true,
    w: 204,
    h: 289,
    preview: 0.3,
    render: (s) => <MicroscopeIcon enabled={s.coverPlaced} scale={1.7} />,
  },
];

export const LAB5_ITEM_BY_ID: Record<Lab5ItemId, Lab5ItemDef> = Object.fromEntries(
  LAB5_ITEMS.map((i) => [i.id, i]),
) as Record<Lab5ItemId, Lab5ItemDef>;

/** The intent a (tool → target) drop performs, or null if meaningless. */
export function intentFor(tool: Lab5ItemId, target: Lab5ItemId, s: WetMountState): WetIntent | null {
  if (tool === "match") {
    if (target === "matchbox") return !s.match.struck ? "strike-match" : null;
    if (target === "lamp") return s.match.lit && !s.lamp.lit ? "light-lamp" : null;
    if (target === "bin") return s.lamp.lit && !s.match.discarded ? "discard-match" : null;
  }
  if (tool === "slide") {
    if (target === "lamp") return !s.slideDegreased && s.lamp.lit && s.match.discarded ? "degrease-slide" : null;
    if (target === "microscope") return canObserve(s) ? "observe" : null;
  }
  if (tool === "saline" && target === "slide") return s.slideDegreased && !s.salineApplied && !s.coverPlaced ? "apply-saline" : null;
  if (tool === "loop") {
    // Flame to sterilise before use; flame again to re-sterilise the used loop after the smear.
    if (target === "lamp") return s.lamp.lit && ((!s.loopCharged && !s.mixed) || (s.mixed && !s.loopResterilized)) ? "flame-loop" : null;
    if (target === "culture") return s.loopFlamed && !s.loopCharged && !s.mixed ? "charge-loop" : null;
    if (target === "slide") return s.loopCharged && s.salineApplied && !s.mixed ? "mix-drop" : null;
  }
  if (tool === "coverslip" && target === "slide") return s.mixed && s.loopResterilized && !s.coverPlaced ? "place-cover" : null;
  if (tool === "filter" && target === "slide") return s.coverPlaced && !s.blotted ? "blot-excess" : null;
  return null;
}

/** Next item the student is expected to use (learn-mode highlight + hint). */
export function requiredItem(s: WetMountState): Lab5ItemId | null {
  if (!s.lamp.lit) return "match";
  if (!s.match.discarded) return "match";
  if (!s.slidePlaced) return "slide";
  if (!s.slideDegreased) return "slide";
  if (!s.salineApplied) return "saline";
  if (!s.loopFlamed && !s.loopCharged) return "loop";
  if (!s.loopCharged && !s.mixed) return "loop";
  if (!s.mixed) return "loop";
  if (!s.loopResterilized) return "loop";
  if (!s.coverPlaced) return "coverslip";
  if (!s.blotted) return "filter";
  if (!s.observed) return "slide";
  return "microscope";
}
