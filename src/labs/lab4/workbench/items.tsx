"use client";

import type { ReactNode } from "react";
import { plateStage, allDisksPlaced, type DiskState, type DiskIntent } from "../state";

import { SpiritLamp } from "@/labs/lab1/components2d/items/SpiritLamp";
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
    opts: { forcepsHot?: boolean; incubatorRunning?: boolean; carrying?: string | null; highlight?: string | null; tubePlugOff?: boolean },
  ) => ReactNode;
}

export const LAB4_ITEMS: Lab4ItemDef[] = [
  {
    id: "dish",
    label: "Petri idishi (agar)",
    apparatus: true,
    target: true,
    w: 230,
    h: 180,
    preview: 0.3,
    render: (s, o) => <PetriLawnDish diameter={230} stage={plateStage(s)} lawnPasses={s.lawnPasses} placedDisks={s.disks} classified={s.classified} highlight={o.highlight} />,
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
    id: "alcohol-jar",
    label: "Spirt bankasi",
    apparatus: true,
    target: true,
    w: 110,
    h: 210,
    preview: 0.34,
    render: () => <AlcoholJar width={110} />,
  },
  {
    id: "swab",
    label: "Steril paxta tampon",
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
    label: "E. coli kulturasi",
    apparatus: true,
    target: true,
    w: 70,
    h: 231,
    preview: 0.34,
    render: (s, o) => <CultureTube sampled={s.swabCharged || s.lawnPasses > 0} plugOff={o.tubePlugOff} />,
  },
  {
    id: "cartridge",
    label: "Antibiotik disklar",
    apparatus: true,
    target: true,
    w: 150,
    h: 110,
    preview: 0.5,
    render: (s, o) => <DiskCartridge width={150} state={s} carrying={o.carrying} />,
  },
  {
    id: "forceps",
    label: "Pinset",
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
    label: "Termostat",
    apparatus: true,
    target: true,
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
    if (target === "lamp") return s.forcepsDipped ? "sterilize-forceps" : null;
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
  if (!s.forcepsSterile) return "forceps";
  if (!allDisksPlaced(s)) return "forceps";
  if (!s.incubated) return "incubator";
  return "dish";
}
