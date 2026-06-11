"use client";

import type { ReactNode } from "react";
import { plateStage, allDisksPlaced, type DiskState, type DiskIntent } from "../state";

import { SpiritLamp } from "@/labs/lab1/components2d/items/SpiritLamp";
import { Match } from "@/labs/lab1/components2d/items/Match";
import { Matchbox } from "@/labs/lab1/components2d/items/Matchbox";
import { BiohazardBin } from "@/labs/lab1/components2d/items/BiohazardBin";
import { CultureTube } from "@/labs/lab1/components2d/items/CultureTube";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { Incubator } from "@/labs/lab3/components2d/items/Incubator";
import { AlcoholJar } from "@/labs/lab3/components2d/items/AlcoholJar";
import { Forceps } from "@/labs/lab2/components2d/items/Forceps";
import { PetriLawnDish } from "../components2d/items/PetriLawnDish";
import { DiskCartridge } from "../components2d/items/DiskCartridge";
import { CottonSwab } from "../components2d/items/CottonSwab";

export type Lab4ItemId =
  | "dish"
  | "matchbox"
  | "match"
  | "bin"
  | "lamp"
  | "alcohol-jar"
  | "swab"
  | "rack"
  | "culture"
  | "cartridge"
  | "forceps"
  | "incubator";

export interface Lab4ItemDef {
  id: Lab4ItemId;
  label: string;
  apparatus: boolean;
  target: boolean;
  /** Permanent bench fixture — auto-placed, not shown in the sidebar, can't move. */
  fixed?: boolean;
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
    state: DiskState,
    opts: { forcepsHot?: boolean; incubatorRunning?: boolean; carrying?: string | null; highlight?: string | null; tubePlugOff?: boolean; binBump?: number },
  ) => ReactNode;
}

export const LAB4_ITEMS: Lab4ItemDef[] = [
  {
    id: "dish",
    label: "lab4.items.dish",
    apparatus: true,
    target: true,
    w: 230,
    h: 180,
    preview: 0.3,
    render: (s, o) => <PetriLawnDish diameter={230} stage={plateStage(s)} lawnPasses={s.lawnPasses} placedDisks={s.disks} classified={s.classified} highlight={o.highlight} />,
  },
  {
    id: "matchbox",
    label: "lab4.items.matchbox",
    apparatus: true,
    target: true,
    w: 110,
    h: 70,
    preview: 0.62,
    render: () => <Matchbox open={false} />,
  },
  {
    id: "match",
    label: "lab4.items.match",
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
    label: "lab4.items.bin",
    apparatus: true,
    target: true,
    w: 120,
    h: 150,
    preview: 0.46,
    render: (_s, o) => <BiohazardBin bumpKey={o.binBump ?? 0} />,
  },
  {
    id: "lamp",
    label: "lab4.items.lamp",
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
    id: "alcohol-jar",
    label: "lab4.items.alcoholJar",
    apparatus: true,
    target: true,
    w: 110,
    h: 210,
    preview: 0.34,
    render: () => <AlcoholJar width={110} />,
  },
  {
    id: "swab",
    label: "lab4.items.swab",
    apparatus: false,
    target: false,
    w: 200,
    h: 44,
    tipX: -80, // cotton head (left end)
    preview: 0.62,
    render: (s) => <CottonSwab width={200} charged={s.swabCharged} />,
  },
  {
    id: "rack",
    label: "lab4.items.rack",
    apparatus: true,
    target: false,
    w: 340,
    h: 210,
    preview: 0.2,
    render: () => <TestTubeRack width={340} />,
  },
  {
    id: "culture",
    label: "lab4.items.culture",
    apparatus: true,
    target: true,
    w: 70,
    h: 231,
    preview: 0.34,
    render: (s, o) => <CultureTube sampled={s.swabCharged || s.lawnPasses > 0} plugOff={o.tubePlugOff} />,
  },
  {
    id: "cartridge",
    label: "lab4.items.cartridge",
    apparatus: true,
    target: true,
    w: 150,
    h: 110,
    preview: 0.5,
    render: (s, o) => <DiskCartridge width={150} state={s} carrying={o.carrying} />,
  },
  {
    id: "forceps",
    label: "lab4.items.forceps",
    apparatus: false,
    target: false,
    w: 40,
    h: 150,
    tipY: 66,
    preview: 0.5,
    render: (_s, o) => <Forceps width={40} hot={o.forcepsHot} />,
  },
  {
    id: "incubator",
    label: "lab4.items.incubator",
    apparatus: true,
    target: true,
    fixed: true,
    w: 264,
    h: 330,
    preview: 0.26,
    render: (_s, o) => <Incubator width={264} running={o.incubatorRunning} plates={1} />,
  },
];

export const LAB4_ITEM_BY_ID: Record<Lab4ItemId, Lab4ItemDef> = Object.fromEntries(
  LAB4_ITEMS.map((i) => [i.id, i]),
) as Record<Lab4ItemId, Lab4ItemDef>;

/** The intent a (tool → target) drop performs, or null if meaningless.
 *  `carrying` is the antibiotic id currently held in the forceps. */
export function intentFor(tool: Lab4ItemId, target: Lab4ItemId, s: DiskState, carrying: string | null): DiskIntent | null {
  if (tool === "match") {
    if (target === "matchbox") return !s.match.struck ? "strike-match" : null;
    if (target === "lamp") return s.match.lit && !s.lamp.lit ? "light-lamp" : null;
    if (target === "bin") return s.lamp.lit && !s.match.discarded ? "discard-match" : null;
  }
  if (tool === "swab") {
    if (target === "culture") return !s.swabCharged && s.lawnPasses === 0 ? "charge-swab" : null;
    if (target === "dish" && s.swabCharged && !s.lawnSpread) {
      if (s.lawnPasses === 0) return "spread-1";
      if (s.lawnPasses === 1) return "spread-2";
      if (s.lawnPasses === 2) return "spread-3";
    }
  }
  if (tool === "forceps") {
    if (target === "alcohol-jar") return !s.forcepsDipped && !s.forcepsSterile ? "dip-forceps" : null;
    if (target === "lamp") return s.forcepsDipped && s.lamp.lit && s.match.discarded ? "sterilize-forceps" : null;
    if (target === "cartridge") return s.forcepsSterile && !carrying && !allDisksPlaced(s) ? "pick-disk" : null;
    if (target === "dish") return carrying && s.dried ? "place-disk" : null;
  }
  return null;
}

export type { DiskIntent };

/** Next item the student should use (learn-mode highlight + hint). */
export function requiredItem(s: DiskState, carrying: string | null): Lab4ItemId | null {
  if (!s.dishPlaced) return "dish";
  if (!s.swabCharged && s.lawnPasses === 0) return "swab";
  if (!s.lawnSpread) return "swab";
  if (!s.lamp.lit) return "match";
  if (!s.match.discarded) return "match";
  if (!s.forcepsSterile) return "forceps";
  if (!allDisksPlaced(s)) return "forceps";
  if (!s.incubated) return "incubator";
  return "dish";
}
