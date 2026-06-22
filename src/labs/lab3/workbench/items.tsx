"use client";

import type { ReactNode } from "react";
import type { DrigalskiState, DrigalskiIntent } from "../state";
import { dishGrowth } from "../state";

import { SpiritLamp } from "@/labs/lab1/components2d/items/SpiritLamp";
import { Match } from "@/labs/lab1/components2d/items/Match";
import { Matchbox } from "@/labs/lab1/components2d/items/Matchbox";
import { BiohazardBin } from "@/labs/lab1/components2d/items/BiohazardBin";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { PetriAgarDish } from "../components2d/items/PetriAgarDish";
import { DrigalskiSpatula } from "../components2d/items/DrigalskiSpatula";
import { Pipette } from "../components2d/items/Pipette";
import { SuspensionTube } from "../components2d/items/SuspensionTube";
import { Incubator } from "../components2d/items/Incubator";
import { AlcoholJar } from "../components2d/items/AlcoholJar";

export type Lab3ItemId =
  | "dish-1"
  | "dish-2"
  | "dish-3"
  | "matchbox"
  | "match"
  | "bin"
  | "lamp"
  | "alcohol-jar"
  | "chlorine-jar"
  | "spatula"
  | "pipette"
  | "rack"
  | "suspension"
  | "incubator";

export interface Lab3ItemDef {
  id: Lab3ItemId;
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
    state: DrigalskiState,
    opts: {
      spatulaHot?: boolean;
      incubatorRunning?: boolean;
      suspensionPlugOff?: boolean;
      binBump?: number;
    },
  ) => ReactNode;
}

function dishDef(n: 1 | 2 | 3): Lab3ItemDef {
  return {
    id: `dish-${n}` as Lab3ItemId,
    label: "lab3.items.dish",
    apparatus: true,
    target: true,
    w: 132,
    h: 140,
    preview: 0.42,
    render: (s) => (
      <PetriAgarDish
        diameter={132}
        material={n === 1 ? s.d1.material : false}
        spread={n === 1 ? s.d1.spread : n === 2 ? s.d2.spread : s.d3.spread}
        growth={dishGrowth(s, n)}
        label={String(n)}
      />
    ),
  };
}

export const LAB3_ITEMS: Lab3ItemDef[] = [
  dishDef(1),
  dishDef(2),
  dishDef(3),
  {
    id: "matchbox",
    label: "lab3.items.matchbox",
    apparatus: true,
    target: true,
    w: 110,
    h: 70,
    preview: 0.62,
    render: () => <Matchbox open={false} />,
  },
  {
    id: "match",
    label: "lab3.items.match",
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
    label: "lab3.items.bin",
    apparatus: true,
    target: true,
    w: 120,
    h: 150,
    preview: 0.46,
    render: (_s, o) => <BiohazardBin bumpKey={o.binBump ?? 0} />,
  },
  {
    id: "lamp",
    label: "lab3.items.lamp",
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
    label: "lab3.items.alcoholJar",
    apparatus: true,
    target: true,
    w: 110,
    h: 210,
    preview: 0.34,
    render: () => <AlcoholJar width={110} variant="alcohol" />,
  },
  {
    id: "chlorine-jar",
    label: "lab3.items.chlorineJar",
    apparatus: true,
    target: true,
    w: 110,
    h: 210,
    preview: 0.34,
    render: () => <AlcoholJar width={110} variant="chlorine" />,
  },
  {
    id: "spatula",
    label: "lab3.items.spatula",
    apparatus: false,
    target: false,
    w: 220,
    h: 96,
    tipX: -85, // triangular spreading head (left end)
    tipY: 24,
    preview: 0.58,
    render: (s, o) => <DrigalskiSpatula width={220} hot={o.spatulaHot} wet={s.spatulaDipped} />,
  },
  {
    id: "pipette",
    label: "lab3.items.pipette",
    apparatus: false,
    target: false,
    w: 30,
    h: 190,
    tipY: 86, // tip at the bottom
    preview: 0.5,
    render: (s) => <Pipette width={30} loaded={s.pipetteLoaded} />,
  },
  {
    id: "rack",
    label: "lab3.items.rack",
    apparatus: true,
    target: false,
    w: 340,
    h: 210,
    preview: 0.2,
    render: () => <TestTubeRack width={340} />,
  },
  {
    id: "suspension",
    label: "lab3.items.suspension",
    apparatus: true,
    target: true,
    w: 56,
    h: 180,
    preview: 0.42,
    render: (_s, o) => <SuspensionTube width={56} plugOff={o.suspensionPlugOff} />,
  },
  {
    id: "incubator",
    label: "lab3.items.incubator",
    apparatus: true,
    target: true,
    fixed: true,
    w: 264,
    h: 330,
    preview: 0.26,
    render: (_s, o) => <Incubator width={264} running={o.incubatorRunning} />,
  },
];

export const LAB3_ITEM_BY_ID: Record<Lab3ItemId, Lab3ItemDef> = Object.fromEntries(
  LAB3_ITEMS.map((i) => [i.id, i]),
) as Record<Lab3ItemId, Lab3ItemDef>;

/** The intent a (tool → target) drop performs, or null if meaningless. */
export function intentFor(tool: Lab3ItemId, target: Lab3ItemId, s: DrigalskiState): DrigalskiIntent | null {
  if (tool === "match") {
    if (target === "matchbox") return !s.match.struck ? "strike-match" : null;
    if (target === "lamp") return s.match.lit && !s.lamp.lit ? "light-lamp" : null;
    if (target === "bin") return s.lamp.lit && !s.match.discarded ? "discard-match" : null;
  }
  if (tool === "spatula") {
    if (target === "alcohol-jar") return !s.spatulaDipped && !s.spatulaSterile ? "dip-spatula" : null;
    if (target === "lamp") return s.spatulaDipped && s.lamp.lit && s.match.discarded ? "sterilize-spatula" : null;
    if (target === "dish-1") return s.d1.material && s.spatulaSterile && !s.d1.spread ? "spread-1" : null;
    if (target === "dish-2") return s.d1.spread && !s.d2.spread ? "spread-2" : null;
    if (target === "dish-3") return s.d2.spread && !s.d3.spread ? "spread-3" : null;
    if (target === "chlorine-jar") return s.d3.spread && !s.spatulaDisinfected ? "disinfect-spatula" : null;
  }
  if (tool === "pipette") {
    if (target === "suspension") return !s.pipetteLoaded ? "load-pipette" : null;
    if (target === "dish-1") return s.pipetteLoaded && !s.d1.material ? "drop-material" : null;
    // The used pipette is dropped into the 5% chlorine jar after delivering the drop.
    if (target === "chlorine-jar") return s.d1.material && !s.pipetteDisinfected ? "disinfect-pipette" : null;
  }
  return null;
}

/** Dragging any spread dish onto the incubator starts incubation. */
export function canIncubate(s: DrigalskiState): boolean {
  return s.d1.spread && s.d2.spread && s.d3.spread && s.spatulaDisinfected && s.pipetteDisinfected && !s.incubated;
}

/** Next item the student is expected to use (learn-mode highlight + hint). */
export function requiredItem(s: DrigalskiState): Lab3ItemId | null {
  if (!s.dishes) return "dish-1";
  if (!s.lamp.lit) return "match";
  if (!s.match.discarded) return "match";
  if (!s.d1.material) return "pipette";
  if (!s.pipetteDisinfected) return "pipette"; // drop the used pipette into the chlorine jar
  if (!s.spatulaSterile) return "spatula";
  if (!s.d1.spread) return "spatula";
  if (!s.d2.spread) return "spatula";
  if (!s.d3.spread) return "spatula";
  if (!s.spatulaDisinfected) return "spatula";
  if (!s.incubated) return "incubator";
  return null;
}
