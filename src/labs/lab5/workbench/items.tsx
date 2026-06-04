"use client";

import type { ReactNode } from "react";
import { dropStage, canObserve, type WetMountState, type WetIntent } from "../state";

import { SpiritLamp } from "@/labs/lab1/components2d/items/SpiritLamp";
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
    opts: { loopHeat?: number; slideWarming?: boolean; tubePlugOff?: boolean; filterWet?: boolean },
  ) => ReactNode;
}

export const LAB5_ITEMS: Lab5ItemDef[] = [
  {
    id: "slide",
    label: "Buyum oynasi",
    apparatus: false,
    target: true,
    w: 120,
    h: 38,
    preview: 0.92,
    render: (s, o) => <WetMountSlide stage={dropStage(s)} degreased={s.slideDegreased} warming={o.slideWarming} width={120} height={38} />,
  },
  {
    id: "coverslip",
    label: "Qoplag'ich oyna",
    apparatus: false,
    target: false,
    w: 72,
    h: 62,
    preview: 0.7,
    render: () => <CoverSlip width={72} />,
  },
  {
    id: "lamp",
    label: "Spirt lampasi",
    apparatus: true,
    target: true,
    w: 160,
    h: 200,
    hitW: 56,
    hitH: 78,
    hitDY: -58,
    preview: 0.42,
    render: () => <SpiritLamp uncapped lit />,
  },
  {
    id: "saline",
    label: "Fiziologik eritma (NaCl)",
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
    label: "Bakteriologik halqa",
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
    label: "Halqa shtativi",
    apparatus: true,
    target: false,
    w: 200,
    h: 164,
    preview: 0.34,
    render: () => <LoopStand width={200} />,
  },
  {
    id: "culture",
    label: "E. coli kulturasi",
    apparatus: true,
    target: true,
    w: 70,
    h: 231,
    preview: 0.34,
    render: (s, o) => <CultureTube sampled={s.loopCharged || s.mixed} plugOff={o.tubePlugOff} />,
  },
  {
    id: "rack",
    label: "Probirka shtativi",
    apparatus: true,
    target: false,
    w: 340,
    h: 210,
    preview: 0.2,
    render: () => <TestTubeRack width={340} />,
  },
  {
    id: "filter",
    label: "Filtr qog'oz",
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
    label: "Shisha ko'prik",
    apparatus: true,
    target: false,
    w: 150,
    h: 240,
    preview: 0.26,
    render: () => <StainingBridge width={150} />,
  },
  {
    id: "tray",
    label: "Lotok",
    apparatus: true,
    target: false,
    w: 440,
    h: 308,
    preview: 0.15,
    render: () => <KidneyTray width={440} />,
  },
  {
    id: "microscope",
    label: "Mikroskop",
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
  if (tool === "slide") {
    if (target === "lamp") return !s.slideDegreased ? "degrease-slide" : null;
    if (target === "microscope") return canObserve(s) ? "observe" : null;
  }
  if (tool === "saline" && target === "slide") return s.slideDegreased && !s.salineApplied && !s.coverPlaced ? "apply-saline" : null;
  if (tool === "loop") {
    if (target === "lamp") return !s.loopCharged && !s.mixed ? "flame-loop" : null;
    if (target === "culture") return s.loopFlamed && !s.loopCharged && !s.mixed ? "charge-loop" : null;
    if (target === "slide") return s.loopCharged && s.salineApplied && !s.mixed ? "mix-drop" : null;
  }
  if (tool === "coverslip" && target === "slide") return s.mixed && !s.coverPlaced ? "place-cover" : null;
  if (tool === "filter" && target === "slide") return s.coverPlaced && !s.blotted ? "blot-excess" : null;
  return null;
}

/** Next item the student is expected to use (learn-mode highlight + hint). */
export function requiredItem(s: WetMountState): Lab5ItemId | null {
  if (!s.slidePlaced) return "slide";
  if (!s.slideDegreased) return "slide";
  if (!s.salineApplied) return "saline";
  if (!s.loopFlamed && !s.loopCharged) return "loop";
  if (!s.loopCharged && !s.mixed) return "loop";
  if (!s.mixed) return "loop";
  if (!s.coverPlaced) return "coverslip";
  if (!s.blotted) return "filter";
  if (!s.observed) return "slide";
  return "microscope";
}
