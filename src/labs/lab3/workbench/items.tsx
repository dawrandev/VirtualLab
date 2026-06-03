"use client";

import type { ReactNode } from "react";
import type { DrigalskiState, DrigalskiIntent } from "../state";
import { dishGrowth, smearStage } from "../state";

import { SpiritLamp } from "@/labs/lab1/components2d/items/SpiritLamp";
import { BacterialLoop } from "@/labs/lab1/components2d/items/BacterialLoop";
import { MicroscopeIcon } from "@/labs/lab1/components2d/items/MicroscopeIcon";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { LoopStand } from "@/labs/lab1/components2d/items/LoopStand";
import { StainingBridge } from "@/labs/lab1/components2d/items/StainingBridge";
import { KidneyTray } from "@/labs/lab1/components2d/items/KidneyTray";
import { WashBottle } from "@/labs/lab1/components2d/items/WashBottle";
import { GramSlide } from "@/labs/lab2/components2d/items/GramSlide";
import { GentianVioletBottle, LugolBottle, EthanolBottle, FuchsinBottle } from "@/labs/lab2/components2d/items/DyeBottle";
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
  | "lamp"
  | "alcohol-jar"
  | "spatula"
  | "pipette"
  | "rack"
  | "suspension"
  | "incubator"
  | "loop-stand"
  | "loop"
  | "bridge"
  | "tray"
  | "slide"
  | "wash"
  | "gv"
  | "lugol"
  | "ethanol"
  | "fuchsin"
  | "microscope";

export interface Lab3ItemDef {
  id: Lab3ItemId;
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
    state: DrigalskiState,
    opts: {
      spatulaHot?: boolean;
      incubatorRunning?: boolean;
      develop?: number;
      smearProg?: number;
      trayStained?: boolean;
      trayColors?: [string, string, string, string];
      suspensionPlugOff?: boolean;
    },
  ) => ReactNode;
}

function dishDef(n: 1 | 2 | 3): Lab3ItemDef {
  return {
    id: `dish-${n}` as Lab3ItemId,
    label: `Oziqa muhitli idish ${n}`,
    apparatus: true,
    target: true,
    w: 132,
    h: 140,
    preview: 0.42,
    render: (s) => {
      const d = n === 1 ? s.d1 : n === 2 ? { material: false, spread: s.d2.spread } : { material: false, spread: s.d3.spread };
      return (
        <PetriAgarDish
          diameter={132}
          material={n === 1 ? s.d1.material : false}
          spread={d.spread}
          growth={dishGrowth(s, n)}
          label={String(n)}
          pickTarget={n === 3 && s.incubated && !s.colonyPicked}
        />
      );
    },
  };
}

export const LAB3_ITEMS: Lab3ItemDef[] = [
  dishDef(1),
  dishDef(2),
  dishDef(3),
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
    id: "spatula",
    label: "Drigalski shpateli",
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
    label: "Pipetka",
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
    label: "Probirka shtativi",
    apparatus: true,
    target: false,
    w: 340,
    h: 210,
    preview: 0.2,
    render: () => <TestTubeRack width={340} />,
  },
  {
    id: "suspension",
    label: "Bakteriya suspenziyasi",
    apparatus: true,
    target: true,
    w: 56,
    h: 180,
    preview: 0.42,
    render: (_s, o) => <SuspensionTube width={56} plugOff={o.suspensionPlugOff} />,
  },
  {
    id: "incubator",
    label: "Termostat",
    apparatus: true,
    target: true,
    w: 264,
    h: 330,
    preview: 0.26,
    render: (_s, o) => <Incubator width={264} running={o.incubatorRunning} />,
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
    id: "loop",
    label: "Bakteriologik halqa",
    apparatus: false,
    target: false,
    w: 220,
    h: 22,
    tipX: -100,
    preview: 0.62,
    render: () => <BacterialLoop heatLevel={0} />,
  },
  {
    id: "tray",
    label: "Buyraksimon lotok",
    apparatus: true,
    target: false,
    w: 440,
    h: 308,
    preview: 0.15,
    render: (_s, o) => <KidneyTray width={440} stained={o.trayStained} stainColors={o.trayColors} />,
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
    w: 132,
    h: 42,
    preview: 0.78,
    render: (s, o) => <GramSlide stage={smearStage(s)} blank={!s.smeared} develop={o.develop ?? 1} gramPositive width={132} height={42} />,
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
    id: "gv",
    label: "Gensianviolet",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.5,
    render: () => <GentianVioletBottle />,
  },
  {
    id: "lugol",
    label: "Lyugol eritmasi",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.5,
    render: () => <LugolBottle />,
  },
  {
    id: "ethanol",
    label: "Etil spirti",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.5,
    render: () => <EthanolBottle />,
  },
  {
    id: "fuchsin",
    label: "Fuksin",
    apparatus: false,
    target: false,
    w: 58,
    h: 132,
    preview: 0.5,
    render: () => <FuchsinBottle />,
  },
  {
    id: "microscope",
    label: "Mikroskop",
    apparatus: true,
    target: true,
    w: 204,
    h: 289,
    preview: 0.3,
    render: (s) => <MicroscopeIcon enabled={s.gram.fuchsin} scale={1.7} />,
  },
];

export const LAB3_ITEM_BY_ID: Record<Lab3ItemId, Lab3ItemDef> = Object.fromEntries(
  LAB3_ITEMS.map((i) => [i.id, i]),
) as Record<Lab3ItemId, Lab3ItemDef>;

/** The intent a (tool → target) drop performs, or null if meaningless. */
export function intentFor(tool: Lab3ItemId, target: Lab3ItemId, s: DrigalskiState): DrigalskiIntent | null {
  if (tool === "spatula") {
    if (target === "alcohol-jar") return !s.spatulaDipped && !s.spatulaSterile ? "dip-spatula" : null;
    if (target === "lamp") return s.spatulaDipped ? "sterilize-spatula" : null;
    if (target === "dish-1") return s.d1.material ? "spread-1" : null;
    if (target === "dish-2") return s.d1.spread ? "spread-2" : null;
    if (target === "dish-3") return s.d2.spread ? "spread-3" : null;
  }
  if (tool === "pipette") {
    if (target === "suspension") return !s.pipetteLoaded ? "load-pipette" : null;
    if (target === "dish-1") return s.pipetteLoaded ? "drop-material" : null;
  }
  if (tool === "loop") {
    if (target === "dish-3") return s.incubated && !s.colonyPicked ? "pick-colony" : null;
    if (target === "slide") return s.colonyPicked && !s.smeared ? "make-smear" : null;
  }
  if (target === "slide" && s.smeared) {
    if (tool === "gv") return "apply-gv";
    if (tool === "lugol") return "apply-lugol";
    if (tool === "ethanol") return "apply-alcohol";
    if (tool === "fuchsin") return "apply-fuchsin";
    if (tool === "wash") return "wash";
  }
  if (tool === "slide" && target === "microscope") return "to-microscope";
  return null;
}

/** Dragging any spread dish onto the incubator starts incubation. */
export function canIncubate(s: DrigalskiState): boolean {
  return s.d1.spread && s.d2.spread && s.d3.spread && !s.incubated;
}

/** Next item the student is expected to use (learn-mode highlight + hint). */
export function requiredItem(s: DrigalskiState): Lab3ItemId | null {
  if (!s.dishes) return "dish-1";
  if (!s.pipetteLoaded && !s.d1.material) return "pipette";
  if (!s.d1.material) return "pipette";
  if (!s.spatulaSterile) return "spatula";
  if (!s.d1.spread) return "spatula";
  if (!s.d2.spread) return "spatula";
  if (!s.d3.spread) return "spatula";
  if (!s.incubated) return "incubator";
  if (!s.colonyPicked) return "loop";
  if (!s.smeared) return "loop";
  if (!s.gram.gv) return "gv";
  if (!s.gram.lugol) return "lugol";
  if (!s.gram.alcohol) return "ethanol";
  if (!s.gram.fuchsin) return "fuchsin";
  return "slide";
}
