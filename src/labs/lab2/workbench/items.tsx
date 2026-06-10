"use client";

import type { ReactNode } from "react";
import type { GramState, GramIntent } from "../state";
import { gramStage } from "../state";

import { StainingBridge } from "@/labs/lab1/components2d/items/StainingBridge";
import { KidneyTray } from "@/labs/lab1/components2d/items/KidneyTray";
import { WashBottle } from "@/labs/lab1/components2d/items/WashBottle";
import { FilterPaper } from "@/labs/lab1/components2d/items/FilterPaper";
import { ImmersionOilBottle } from "@/labs/lab1/components2d/items/ImmersionOilBottle";
import { MicroscopeIcon } from "@/labs/lab1/components2d/items/MicroscopeIcon";
import { GramSlide } from "../components2d/items/GramSlide";
import { Forceps } from "../components2d/items/Forceps";
import { GentianVioletBottle, LugolBottle, EthanolBottle, FuchsinBottle } from "../components2d/items/DyeBottle";

export type Lab2ItemId =
  | "tray"
  | "bridge"
  | "slide"
  | "gv"
  | "lugol"
  | "ethanol"
  | "fuchsin"
  | "wash"
  | "filter"
  | "forceps"
  | "oil"
  | "microscope";

export interface Lab2ItemDef {
  id: Lab2ItemId;
  label: string;
  apparatus: boolean;
  target: boolean;
  w: number;
  h: number;
  tipX?: number;
  tipY?: number;
  preview: number;
  /** Tight hit-zone override (px). */
  hitW?: number;
  hitH?: number;
  hitDX?: number;
  hitDY?: number;
  render: (
    state: GramState,
    opts: { trayStained?: boolean; develop?: number; trayColors?: [string, string, string, string]; specimenPositive?: boolean },
  ) => ReactNode;
}

export const LAB2_ITEMS: Lab2ItemDef[] = [
  {
    id: "tray",
    label: "lab2.items.tray",
    apparatus: true,
    target: false,
    w: 440,
    h: 308,
    preview: 0.15,
    render: (_s, o) => <KidneyTray width={440} stained={o.trayStained} stainColors={o.trayColors} />,
  },
  {
    id: "bridge",
    label: "lab2.items.bridge",
    apparatus: true,
    target: false,
    w: 150,
    h: 240,
    preview: 0.26,
    render: () => <StainingBridge width={150} />,
  },
  {
    id: "slide",
    label: "lab2.items.slide",
    apparatus: false,
    target: true,
    w: 132,
    h: 42,
    preview: 0.78,
    render: (s, o) => (
      <GramSlide stage={gramStage(s)} filterOn={s.slide.filterOn} oilApplied={s.slide.oilApplied} gramPositive={o.specimenPositive ?? true} develop={o.develop ?? 1} width={132} height={42} />
    ),
  },
  {
    id: "gv",
    label: "lab2.items.gv",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.58,
    render: () => <GentianVioletBottle />,
  },
  {
    id: "lugol",
    label: "lab2.items.lugol",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.58,
    render: () => <LugolBottle />,
  },
  {
    id: "ethanol",
    label: "lab2.items.ethanol",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.58,
    render: () => <EthanolBottle />,
  },
  {
    id: "fuchsin",
    label: "lab2.items.fuchsin",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.58,
    render: () => <FuchsinBottle />,
  },
  {
    id: "wash",
    label: "lab2.items.wash",
    apparatus: false,
    target: false,
    w: 56,
    h: 100,
    preview: 0.7,
    render: () => <WashBottle />,
  },
  {
    id: "filter",
    label: "lab2.items.filter",
    apparatus: false,
    target: false,
    w: 60,
    h: 71,
    preview: 0.9,
    render: () => <FilterPaper width={60} />,
  },
  {
    id: "forceps",
    label: "lab2.items.forceps",
    apparatus: false,
    target: false,
    w: 40,
    h: 150,
    tipY: 66, // tips at the bottom
    preview: 0.5,
    render: () => <Forceps width={40} />,
  },
  {
    id: "oil",
    label: "lab2.items.oil",
    apparatus: false,
    target: false,
    w: 50,
    h: 96,
    preview: 0.72,
    render: () => <ImmersionOilBottle />,
  },
  {
    id: "microscope",
    label: "lab2.items.microscope",
    apparatus: true,
    target: true,
    w: 204,
    h: 289,
    preview: 0.3,
    render: (s) => <MicroscopeIcon enabled={s.slide.oilApplied} scale={1.7} />,
  },
];

export const LAB2_ITEM_BY_ID: Record<Lab2ItemId, Lab2ItemDef> = Object.fromEntries(
  LAB2_ITEMS.map((i) => [i.id, i]),
) as Record<Lab2ItemId, Lab2ItemDef>;

/** The single intent a (tool → target) drop performs, or null if meaningless. */
export function intentFor(tool: Lab2ItemId, target: Lab2ItemId, s: GramState): GramIntent | null {
  if (target === "slide") {
    switch (tool) {
      case "gv":
        return "apply-gv";
      case "lugol":
        return "apply-lugol";
      case "ethanol":
        return "apply-alcohol";
      case "fuchsin":
        return "apply-fuchsin";
      case "wash":
        return "wash";
      case "oil":
        return "apply-oil";
      case "forceps":
        return s.slide.filterOn ? "remove-filter" : null;
      case "filter":
        // Before staining → lay paper over the smear; after the final wash →
        // blot dry. (Both are valid uses of filter paper in the protocol.)
        if (!s.slide.gv.applied) return "place-filter";
        if (s.slide.fuchsin.applied && s.slide.fuchsin.washed) return "blot";
        return "place-filter";
      default:
        return null;
    }
  }
  if (tool === "slide" && target === "microscope") return "to-microscope";
  return null;
}

/** Next item the student is expected to use (learn-mode highlight + hint). */
export function requiredItem(s: GramState): Lab2ItemId | null {
  const sl = s.slide;
  if (!sl.onBridge) return "slide";
  if (!sl.gv.applied) return sl.filterOn ? "gv" : "filter";
  if (!sl.gv.removed) return "forceps";
  if (!sl.lugol.applied) return "lugol";
  if (!sl.alcohol.applied) return "ethanol";
  if (!sl.alcohol.washed) return "wash";
  if (!sl.fuchsin.applied) return "fuchsin";
  if (!sl.fuchsin.washed) return "wash";
  if (!sl.fuchsin.blotted) return "filter";
  if (!sl.oilApplied) return "oil";
  return "slide";
}
