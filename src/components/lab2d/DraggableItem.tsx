"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ItemId, ZoneId } from "@/engine2d/types";
import { useInteractionContext } from "./interactionContext";
import { findZoneAt, useZoneRegistry } from "./ZoneRegistry";

interface Props {
  id: ItemId;
  /** Item-local origin (top-left within the inner stage). */
  homeX: number;
  homeY: number;
  width: number;
  height: number;
  /** Active tip relative to the item's top-left. Defaults to bbox center.
   *  Used for zone-hit detection (e.g., match head, loop wire-ring, dropper tip). */
  tipX?: number;
  tipY?: number;
  /** Disable user dragging (locked in place). */
  disabled?: boolean;
  /** Tooltip + counter while dragging. Falsy hides them. */
  tooltipKey?: string | null;
  counterValue?: number | null;
  /** Called when the pointer enters a zone while dragging. */
  onZoneHover?: (zoneId: ZoneId | null) => void;
  /** Called when the pointer is released inside a zone. Receives null if the
   *  drop was outside any zone. */
  onDrop?: (zoneId: ZoneId | null) => void;
  /** When true, animate back to home after release. Defaults true. */
  returnHome?: boolean;
  /** When false, the visual position stays at last drag location. */
  visible?: boolean;
  /** Optional click handler (fires when no drag occurred). Receives the
   *  zone currently under the tip — so an item resting on its home zone
   *  can trigger a primary action without dragging. */
  onTap?: (zoneId: ZoneId | null) => void;
  children: ReactNode;
}

/**
 * Pointer-event-driven 2D draggable. Lives inside the inner stage; uses
 * raw deltas from `pointermove` to update its `x`/`y` motion values so it
 * works seamlessly inside the scaled `<LabStage>` (where DOM offsetX is
 * compressed by the stage's transform: scale).
 */
export function DraggableItem({
  id,
  homeX,
  homeY,
  width,
  height,
  tipX,
  tipY,
  disabled,
  tooltipKey,
  counterValue,
  onZoneHover,
  onDrop,
  returnHome = true,
  visible = true,
  onTap,
  children,
}: Props) {
  const tipDx = tipX ?? width / 2;
  const tipDy = tipY ?? height / 2;
  const x = useMotionValue(homeX);
  const y = useMotionValue(homeY);
  const dragging = useRef(false);
  const startedAt = useRef<{ x: number; y: number; t: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const interaction = useInteractionContext();
  const zoneReg = useZoneRegistry();

  // Keep home position in sync when it changes externally.
  useEffect(() => {
    if (!dragging.current) {
      x.set(homeX);
      y.set(homeY);
    }
  }, [homeX, homeY, x, y]);

  function onPointerDown(e: React.PointerEvent) {
    if (disabled) return;
    // Capture on the wrapper (currentTarget) so subsequent pointer events
    // route to this element regardless of which SVG child we initially hit.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* some browsers throw on touch pointer types — safe to ignore */
    }
    dragging.current = true;
    startedAt.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    interaction.setDraggedItem(id);
    if (tooltipKey) interaction.setTooltip(tooltipKey, counterValue ?? null);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !startedAt.current) return;
    // Translate raw client deltas back to stage coords via the active scale.
    const scale = readStageScale();
    const dx = (e.clientX - startedAt.current.x) / scale;
    const dy = (e.clientY - startedAt.current.y) / scale;
    const newX = homeX + dx;
    const newY = homeY + dy;
    x.set(newX);
    y.set(newY);
    const tip = { x: newX + tipDx, y: newY + tipDy };
    const z = findZoneAt(zoneReg.zones, tip);
    onZoneHover?.(z?.id ?? null);
    interaction.setHoveredZone(z?.id ?? null);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    const startedTs = startedAt.current?.t ?? 0;
    const moved =
      startedAt.current &&
      (Math.abs(e.clientX - startedAt.current.x) > 2 ||
        Math.abs(e.clientY - startedAt.current.y) > 2);
    startedAt.current = null;
    interaction.setDraggedItem(null);
    interaction.setTooltip(null, null);
    interaction.setHoveredZone(null);

    const tip = { x: x.get() + tipDx, y: y.get() + tipDy };
    const z = findZoneAt(zoneReg.zones, tip);
    if (moved) {
      onDrop?.(z?.id ?? null);
    } else if (Date.now() - startedTs < 350) {
      onTap?.(z?.id ?? null);
    }
    if (returnHome) {
      animate(x, homeX, { type: "spring", stiffness: 480, damping: 28 });
      animate(y, homeY, { type: "spring", stiffness: 480, damping: 28 });
    }
  }

  if (!visible) return null;

  return (
    <motion.div
      style={{ position: "absolute", left: 0, top: 0, x, y, width, height, touchAction: "none" }}
      onPointerEnter={() => {
        if (!disabled) setHovered(true);
        if (!disabled && tooltipKey) interaction.setTooltip(tooltipKey, counterValue ?? null);
      }}
      onPointerLeave={() => {
        setHovered(false);
        if (!dragging.current) interaction.setTooltip(null, null);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: dragging.current ? "scale(1.04)" : hovered ? "scale(1.02)" : "scale(1)",
          filter: hovered && !disabled ? "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" : undefined,
          transition: "transform 120ms ease-out, filter 120ms ease-out",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

function readStageScale(): number {
  // Use the closest scaled wrapper. Falls back to 1 on first paint.
  const el = document.querySelector("[data-stage-root]") as HTMLElement | null;
  if (!el) return 1;
  const m = window.getComputedStyle(el).transform;
  if (!m || m === "none") return 1;
  const match = m.match(/matrix\(([^)]+)\)/);
  if (!match) return 1;
  const parts = match[1].split(",").map((s) => parseFloat(s.trim()));
  return parts[0] || 1;
}
