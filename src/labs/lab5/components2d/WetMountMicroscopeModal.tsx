"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Kind = "brownian" | "swimmer" | "riser";
interface Cell {
  id: number;
  left: number;
  top: number;
  w: number;
  h: number;
  round: boolean;
  angle: number;
  kind: Kind;
  x: number[];
  y: number[];
  rot: number[];
  opacity: number | number[];
  dur: number;
  delay: number;
  times?: number[];
}

/** Deterministic pseudo-random (no Math.random → stable SSR + no hydration mismatch). */
function rnd(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * A dense wet-mount field of LIVING E. coli — most cells jiggle in place
 * (Brownian motion), a good fraction swim across in run-and-tumble paths, and a
 * few stream upward. Built once, deterministically.
 */
function field(motile: boolean): Cell[] {
  const cells: Cell[] = [];
  // Brownian crowd — the bulk of the field: small dark cells vibrating in place.
  // A non-motile specimen is ALL of this (no swimming) — only Brownian jiggle.
  const brownianN = motile ? 80 : 108;
  for (let i = 0; i < brownianN; i++) {
    const j = 1.4 + rnd(i + 3) * 1.6;
    const rod = i % 3 === 0;
    cells.push({
      id: i,
      left: rnd(i + 1) * 95 + 2.5,
      top: rnd(i + 7) * 92 + 4,
      w: rod ? 6 + (i % 3) : 3 + (i % 2),
      h: rod ? 3 : 3 + (i % 2),
      round: !rod,
      angle: rnd(i + 5) * 180,
      kind: "brownian",
      x: [0, j, -j * 0.7, j * 0.5, 0],
      y: [0, -j * 0.6, j, -j * 0.4, 0],
      rot: [0, 0, 0, 0, 0],
      opacity: 0.7 + rnd(i + 11) * 0.2,
      dur: 1.4 + rnd(i + 2) * 1.1,
      delay: rnd(i + 9) * 1.6,
    });
  }
  // Swimmers + risers only when the specimen is MOTILE.
  if (!motile) return cells;
  // Swimmers — run a straight-ish path then tumble (change direction). Motile.
  for (let i = 0; i < 16; i++) {
    const k = 100 + i;
    const dir = rnd(k + 2) * Math.PI * 2;
    const run = 20 + rnd(k + 3) * 16;
    const cx = Math.cos(dir) * run;
    const cy = Math.sin(dir) * run;
    const dir2 = dir + (rnd(k + 5) - 0.5) * 2.6;
    cells.push({
      id: k,
      left: rnd(k + 1) * 82 + 9,
      top: rnd(k + 4) * 74 + 13,
      w: 8 + (i % 3),
      h: 3.4,
      round: false,
      angle: (dir * 180) / Math.PI,
      kind: "swimmer",
      x: [0, cx * 0.5, cx, cx + Math.cos(dir2) * run * 0.7, cx * 0.4, 0],
      y: [0, cy * 0.5, cy, cy + Math.sin(dir2) * run * 0.7, cy * 0.4, 0],
      rot: [0, 10, -8, 12, -5, 0],
      opacity: 0.82,
      dur: 4 + rnd(k + 7) * 2.5,
      delay: rnd(k + 8) * 2,
    });
  }
  // Risers — a few cells streaming UPWARD across the field, fading in and out.
  for (let i = 0; i < 9; i++) {
    const k = 200 + i;
    cells.push({
      id: k,
      left: rnd(k + 1) * 90 + 5,
      top: 88,
      w: 4 + (i % 2) * 3,
      h: 4,
      round: i % 2 === 0,
      angle: 90,
      kind: "riser",
      x: [0, rnd(k + 2) * 14 - 7, rnd(k + 3) * 14 - 7],
      y: [0, -120, -240],
      rot: [0, 20, -10],
      opacity: [0, 0.9, 0],
      times: [0, 0.5, 1],
      dur: 3.6 + rnd(k + 4) * 2.4,
      delay: rnd(k + 5) * 3.5,
    });
  }
  return cells;
}

const CELL_BG = "rgba(38,66,54,0.82)";

/**
 * Wet-mount microscope view (×40). A teal, unstained field of LIVING, motile
 * rod-shaped bacteria: most jiggle in place (Brownian), many swim across in
 * run-and-tumble paths and a few stream upward — a purely observational view of
 * true motility (no classification step).
 */
export function WetMountMicroscopeModal({ open, onClose }: Props) {
  const cells = useMemo(() => field(true), []);
  const t = useTranslations();

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <button onClick={onClose} className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="close">
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" /></svg>
          </button>

          <div className="flex flex-col items-center gap-5">
            {/* Eyepiece — a teal living field */}
            <div className="relative h-[min(70vw,440px)] w-[min(70vw,440px)]">
              <div className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)]" style={{ background: "radial-gradient(circle, #c9e7d9 0%, #abd8c6 52%, #84b8a4 84%, #243a32 100%)" }}>
                {cells.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: c.opacity, x: c.x, y: c.y, rotate: c.rot }}
                    transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: c.kind === "brownian" ? "easeInOut" : "linear", times: c.times }}
                    style={{
                      position: "absolute",
                      left: `${c.left}%`,
                      top: `${c.top}%`,
                      width: c.w,
                      height: c.h,
                      borderRadius: c.round ? "50%" : 3,
                      transform: `rotate(${c.angle}deg)`,
                      background: CELL_BG,
                      boxShadow: "0 0 1.5px rgba(20,35,28,0.5)",
                    }}
                  />
                ))}
                {/* soft out-of-focus haze + the central bright disc */}
                <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.18), transparent 55%)" }} />
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">{t("lab5.micro.field")}</div>
              </div>
            </div>

            {/* Observation caption — living, motile bacteria (no classification) */}
            <div className="text-center">
              <p className="text-[15px] font-bold text-teal-300">{t("lab5.micro.motile")}</p>
              <p className="mt-1 max-w-[420px] text-[13px] leading-snug text-slate-300">{t("lab5.micro.motileSub")}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
