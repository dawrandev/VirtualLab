"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { InteractionContext as Ctx, ItemId, ZoneId } from "@/engine2d/types";

interface InteractionCtxState extends Ctx {
  setDraggedItem: (id: ItemId | null) => void;
  setHoveredZone: (id: ZoneId | null) => void;
  setTooltip: (text: string | null, counter?: number | null) => void;
}

const defaultCtx: InteractionCtxState = {
  draggedItem: null,
  hoveredZone: null,
  tooltipKey: null,
  counterValue: null,
  setDraggedItem: () => {},
  setHoveredZone: () => {},
  setTooltip: () => {},
};

const InteractionCtx = createContext<InteractionCtxState>(defaultCtx);

export function InteractionProvider({ children }: { children: ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<ItemId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const [counterValue, setCounterValue] = useState<number | null>(null);

  const value = useMemo<InteractionCtxState>(
    () => ({
      draggedItem,
      hoveredZone,
      tooltipKey,
      counterValue,
      setDraggedItem,
      setHoveredZone,
      setTooltip: (t, c = null) => {
        setTooltipKey(t);
        setCounterValue(c);
      },
    }),
    [draggedItem, hoveredZone, tooltipKey, counterValue],
  );

  return <InteractionCtx.Provider value={value}>{children}</InteractionCtx.Provider>;
}

export function useInteractionContext() {
  return useContext(InteractionCtx);
}
