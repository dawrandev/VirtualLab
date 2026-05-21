"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, type ComponentType } from "react";
import type { ZoomViewId } from "./ZoomController";
import { useZoomController } from "./ZoomController";

// Lazy-load each cutscene so the ZoomLens itself is cheap and the heavy
// cutscene SVG only mounts when needed.
const Views: Record<ZoomViewId, ComponentType<ZoomViewProps>> = {
  "lamp-ignite": lazy(() => import("@/labs/lab1/components2d/zoom/LampIgniteZoom")),
  "flame-pass": lazy(() => import("@/labs/lab1/components2d/zoom/FlamePassZoom")),
  "culture-sample": lazy(() => import("@/labs/lab1/components2d/zoom/CultureSampleZoom")),
  "nacl-drop": lazy(() => import("@/labs/lab1/components2d/zoom/NaClDropZoom")),
  smear: lazy(() => import("@/labs/lab1/components2d/zoom/SmearZoom")),
  "flame-fix": lazy(() => import("@/labs/lab1/components2d/zoom/FlameFixZoom")),
  "stain-mb": lazy(() => import("@/labs/lab1/components2d/zoom/StainMbZoom")),
  wash: lazy(() => import("@/labs/lab1/components2d/zoom/WashZoom")),
};

export interface ZoomViewProps {
  /** Called by the view when its animation finishes. Triggers fade-out. */
  onDone: () => void;
}

/**
 * Fullscreen circular vignette that hosts a single cutscene at a time.
 * Mounts above the lateral scene but below the sidebar/topbar so the
 * student can still hit Заново. Enter/exit animations are short (200ms);
 * each cutscene controls its own internal timeline.
 */
export function ZoomLens() {
  const controller = useZoomController();
  const active = controller.active;
  const View = active ? Views[active.id] : null;

  return (
    <AnimatePresence>
      {active && View && (
        <motion.div
          key={active.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,22,30,0.4) 0%, rgba(14,16,22,0.85) 70%)",
          }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="pointer-events-auto relative overflow-hidden rounded-full shadow-[0_0_80px_rgba(0,0,0,0.6)] ring-[6px] ring-slate-900/70"
            style={{
              width: "min(620px, 78vmin)",
              height: "min(620px, 78vmin)",
              background: "radial-gradient(circle at 50% 45%, #fdfdfd 0%, #d8d8d8 65%, #888 100%)",
            }}
          >
            <Suspense fallback={null}>
              <View onDone={controller.done} />
            </Suspense>
            {/* Soft inner vignette to sell the eyepiece feel */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                boxShadow: "inset 0 0 90px rgba(0,0,0,0.55)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
