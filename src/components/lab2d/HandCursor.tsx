"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { CounterChip } from "@/labs/lab1/components2d/animations/CounterChip";
import { useInteractionContext } from "./interactionContext";
import { useZoomController } from "./ZoomController";

/**
 * Custom hand cursor (reference seg2_18). White-gloved pointing index
 * finger replaces the OS cursor. When an interaction supplies a counter
 * value, the cursor renders a `CounterChip` (reference's `1/3 …` pill);
 * otherwise it shows a plain hint pill with the tooltip text.
 */
export function HandCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 700, damping: 32, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 700, damping: 32, mass: 0.4 });
  const [touch, setTouch] = useState(false);
  const ctx = useInteractionContext();
  const zoom = useZoomController();

  useEffect(() => {
    function onMove(e: PointerEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      if (e.pointerType === "touch") setTouch(true);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  if (touch) return null;

  const dragging = !!ctx.draggedItem;
  // Suppress hint/counter while a zoom cutscene is playing — the cutscene
  // already explains what's happening.
  const zoomActive = zoom.active !== null;
  const showCounter =
    !zoomActive && ctx.counterValue !== null && ctx.counterValue !== undefined;

  return (
    <motion.div
      className="pointer-events-none fixed z-[60] -translate-x-1.5 -translate-y-2"
      style={{ x: sx, y: sy }}
    >
      <svg width="38" height="44" viewBox="0 0 38 44">
        {/* Index-finger up pointing hand. White glove, thick stroke. */}
        {!dragging ? (
          <path
            d="M14 4 C14 2 17 2 17 4 L17 20 L19 20 L19 8 C19 6 22 6 22 8 L22 22 L24 22 L24 12 C24 10 27 10 27 12 L27 24 L29 24 L29 16 C29 14 32 14 32 16 L32 32 C32 38 28 42 22 42 C15 42 11 38 11 32 L11 23 C11 21 14 21 14 23 L14 26 L16 26 L16 6 Z"
            fill="#ffffff"
            stroke="#1f2937"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        ) : (
          /* Closed (grabbing) hand */
          <path
            d="M11 18 C11 16 13 14 16 15 L16 6 C16 4 19 4 19 6 L19 14 L21 14 L21 8 C21 6 24 6 24 8 L24 16 L26 16 L26 12 C26 10 29 10 29 12 L29 18 C30 18 31 19 31 20.5 L31 32 C31 38 27 42 21 42 C14 42 10 37 10 31 L10 24 Z"
            fill="#ffffff"
            stroke="#1f2937"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {showCounter ? (
        <CounterChip
          current={ctx.counterValue ?? 0}
          total={3}
          label={ctx.tooltipKey ?? ""}
        />
      ) : (
        !zoomActive && ctx.tooltipKey && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-8 top-3 rounded-lg bg-white/95 shadow-md text-slate-800 text-[12px] font-medium px-2.5 py-1.5 whitespace-nowrap"
          >
            {ctx.tooltipKey}
          </motion.div>
        )
      )}
    </motion.div>
  );
}
