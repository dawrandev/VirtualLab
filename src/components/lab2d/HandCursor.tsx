"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useInteractionContext } from "./interactionContext";

/**
 * Custom cartoon hand cursor (reference frame 46-47) replacing the OS cursor.
 *  - Follows pointer with a tiny spring lag for a "carrying" feel.
 *  - Renders a floating tooltip + counter when an interaction is in progress.
 *  - Switches between "open hand" (idle hover) and "grip" (dragging).
 */
export function HandCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 600, damping: 30, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 600, damping: 30, mass: 0.4 });
  const [touch, setTouch] = useState(false);
  const ctx = useInteractionContext();

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

  return (
    <motion.div
      className="pointer-events-none fixed z-[60] -translate-x-2 -translate-y-2"
      style={{ x: sx, y: sy }}
    >
      <svg width="36" height="38" viewBox="0 0 36 38">
        {!dragging ? (
          <g>
            <path
              d="M14 4 C14 2.5 16 2.5 16 4 L16 18 L18 18 L18 6 C18 4.5 20 4.5 20 6 L20 19 L22 19 L22 9 C22 7.5 24 7.5 24 9 L24 22 L26 22 L26 13 C26 11.5 28 11.5 28 13 L28 26 C28 31 25 34 19 34 C13 34 10 30 10 25 L10 18 C10 16.5 12 16.5 12 18 L12 22 L14 22 Z"
              fill="#ffffff"
              stroke="#1f2937"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>
        ) : (
          <g>
            <path
              d="M12 12 C12 10 14 9 16 10 L16 4 C16 2.5 18 2.5 18 4 L18 12 L20 12 L20 6 C20 4.5 22 4.5 22 6 L22 14 L24 14 C25.6 14 27 15 27 16.5 L27 28 C27 32 24 34 20 34 C15 34 11 30 11 25 L11 20 Z"
              fill="#ffffff"
              stroke="#1f2937"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>

      {ctx.tooltipKey && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-[26px] top-[18px] flex items-center gap-2 rounded-lg bg-white/95 shadow-md text-slate-800 text-[12px] font-medium pl-2 pr-3 py-1 whitespace-nowrap"
        >
          {ctx.counterValue !== null && (
            <motion.span
              key={ctx.counterValue}
              initial={{ scale: 0.6, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              className="grid place-items-center w-6 h-6 rounded-md bg-amber-300 text-slate-900 text-xs font-bold shadow-sm"
            >
              {ctx.counterValue}
            </motion.span>
          )}
          <span>{ctx.tooltipKey}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
