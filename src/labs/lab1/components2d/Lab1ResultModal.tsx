"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLab2DStore } from "@/stores/labStore2d";
import { microscopeResult } from "../content/microscope";

/** Procedural drift particles representing bacterial cells in the eyepiece. */
interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  opacity: number;
  shape: "rod" | "coccus";
}

function buildParticles(count: number, sizeRange: [number, number], opacity: number): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    delay: Math.random() * 4,
    opacity: opacity + Math.random() * 0.15,
    shape: Math.random() > 0.5 ? "rod" : "coccus",
  }));
}

/**
 * Microscope final view modal — eyepiece vignette, drifting bacteria layer,
 * score badge and notes. For the simple stain every cell is methylene-blue
 * (no Gram differentiation); the result conveys morphology + preparation
 * quality.
 */
export function Lab1ResultModal({ examMode = false }: { examMode?: boolean }) {
  const t = useTranslations();
  const open = useLab2DStore((s) => s.state.microscopeOpen);
  const setOpen = useLab2DStore((s) => s.setMicroscopeOpen);
  const state = useLab2DStore((s) => s.state);
  const resetLab = useLab2DStore((s) => s.resetLab);

  const result = useMemo(() => microscopeResult(state), [state]);
  const tier = result.qualityTier;
  const particles = useMemo(() => {
    if (!result.cellsVisible) return buildParticles(6, [4, 10], 0.25);
    if (tier === "high") return buildParticles(34, [6, 16], 0.85);
    if (tier === "medium") return buildParticles(14, [5, 12], 0.5);
    return buildParticles(6, [4, 10], 0.3);
  }, [tier, result.cellsVisible]);

  const stainColor = "#2742b8"; // methylene blue

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 z-50 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
            aria-label="close"
          >
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>

          <div className="relative w-[min(86vw,720px)] aspect-square">
            <div
              className="absolute inset-0 rounded-full overflow-hidden ring-4 ring-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)]"
              style={{ background: "radial-gradient(circle, #eaf1fb 0%, #c4d4ee 60%, #6c84b4 90%, #11203a 100%)" }}
            >
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: p.opacity,
                    x: [0, 2, -3, 1, 0],
                    y: [0, -2, 3, -1, 0],
                  }}
                  transition={{ duration: 5, delay: p.delay, repeat: Infinity }}
                  style={{
                    position: "absolute",
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    width: p.size,
                    height: p.shape === "rod" ? p.size * 0.4 : p.size * 0.9,
                    borderRadius: p.shape === "rod" ? "60%" : "50%",
                    background: stainColor,
                    transform: `rotate(${p.id * 17}deg)`,
                    boxShadow: `0 0 6px ${stainColor}`,
                  }}
                />
              ))}
              {/* Objective magnification badge */}
              <div className="absolute left-4 top-4 rounded-md bg-black/40 px-2 py-1 text-[11px] font-bold tracking-wider text-white">
                100× {state.slide.oilApplied ? "· oil" : ""}
              </div>
            </div>

            <div className="absolute -bottom-44 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-[440px]">
              {/* The numeric score belongs to EXAM mode only. In learn mode the
                  student just studies the smear, so we hide the X/10 badge. */}
              {examMode && (
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-3 shadow-2xl text-center text-white">
                  <p className="text-[11px] uppercase tracking-widest opacity-80">{t("lab1.result.title")}</p>
                  <p className="text-3xl font-bold">{state.score.outOfTen.toFixed(1)} / 10</p>
                </div>
              )}
              <div className="rounded-xl bg-white/95 px-4 py-2 text-sm text-slate-800 shadow-md text-center">
                {result.notes.map((n, i) => (
                  <p key={i} className={i === 0 ? "font-semibold" : "text-xs text-slate-600"}>
                    {t(n)}
                  </p>
                ))}
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  resetLab();
                }}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 transition px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
              >
                {t("ui.restart")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
