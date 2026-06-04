"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Motility } from "../state";

interface Props {
  open: boolean;
  picked: Motility | null;
  reveal: boolean;
  correct: Motility;
  onClassify: (m: Motility) => void;
  onClose: () => void;
}

interface Rod {
  id: number;
  left: number;
  top: number;
  len: number;
  angle: number;
  dx: number[];
  dy: number[];
  rot: number[];
  dur: number;
  delay: number;
}

/** Deterministic field of drifting, swimming bacilli (no Math.random). */
function rods(): Rod[] {
  const seeds = [
    [18, 30], [40, 20], [62, 28], [78, 44], [30, 52], [52, 46], [70, 64], [24, 72],
    [46, 70], [66, 36], [34, 38], [58, 60], [82, 26], [16, 50],
  ];
  return seeds.map(([l, t], i) => {
    const s = ((i * 37) % 11) - 5; // -5..5 swing
    const s2 = ((i * 53) % 9) - 4;
    return {
      id: i,
      left: l,
      top: t,
      len: 10 + (i % 4) * 2,
      angle: (i * 47) % 180,
      dx: [0, s * 2.2, s2 * 1.6, -s * 1.8, 0],
      dy: [0, s2 * 1.8, -s * 2.0, s2 * 1.4, 0],
      rot: [0, s * 6, s2 * 8, s * 5, 0],
      dur: 3.2 + (i % 5) * 0.6,
      delay: (i % 6) * 0.25,
    };
  });
}

/**
 * Wet-mount microscope view (×40). A pale, unstained field of living rod-shaped
 * bacteria that swim and jitter — the student decides whether the organism is
 * motile. (In learn mode the answer + a Brownian-vs-true-motility note shows.)
 */
export function WetMountMicroscopeModal({ open, picked, reveal, correct, onClassify, onClose }: Props) {
  const cells = useMemo(() => rods(), []);
  const isRight = picked === correct;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <button onClick={onClose} className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="close">
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" /></svg>
          </button>

          <div className="flex flex-col items-center gap-5">
            {/* Eyepiece */}
            <div className="relative h-[min(70vw,440px)] w-[min(70vw,440px)]">
              <div className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)]" style={{ background: "radial-gradient(circle, #fcfdfa 0%, #eef2ea 55%, #c7cdbe 88%, #20251c 100%)" }}>
                {cells.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.85, x: r.dx, y: r.dy, rotate: r.rot }}
                    transition={{ duration: r.dur, delay: r.delay, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      position: "absolute",
                      left: `${r.left}%`,
                      top: `${r.top}%`,
                      width: r.len,
                      height: 4.2,
                      borderRadius: 3,
                      transform: `rotate(${r.angle}deg)`,
                      background: "rgba(70,84,60,0.85)",
                      boxShadow: "0 0 2px rgba(40,50,30,0.5)",
                    }}
                  />
                ))}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">×40 · tirik preparat</div>
              </div>
            </div>

            {/* Motility classification */}
            <div className="w-[min(90vw,460px)] rounded-2xl bg-white/95 p-4 text-center shadow-2xl">
              <p className="mb-3 text-sm font-semibold text-slate-700">Bu bakteriya harakatchanmi?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => onClassify("motile")}
                  className="flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition"
                  style={{ borderColor: picked === "motile" ? "#0d9488" : "#e2e8f0", background: picked === "motile" ? "#f0fdfa" : "#fff", color: "#0f766e" }}
                >
                  Harakatchan<br /><span className="text-[11px] font-normal text-slate-500">yo'nalishli suzadi</span>
                </button>
                <button
                  onClick={() => onClassify("nonmotile")}
                  className="flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition"
                  style={{ borderColor: picked === "nonmotile" ? "#b45309" : "#e2e8f0", background: picked === "nonmotile" ? "#fffbeb" : "#fff", color: "#b45309" }}
                >
                  Harakatsiz<br /><span className="text-[11px] font-normal text-slate-500">faqat broun tebranishi</span>
                </button>
              </div>

              {reveal && picked && (
                <div className="mt-3 rounded-lg px-3 py-2 text-[13px] font-medium" style={{ background: isRight ? "#ecfdf5" : "#fef2f2", color: isRight ? "#059669" : "#dc2626" }}>
                  {isRight ? "✓ To'g'ri! " : "✕ Noto'g'ri. "}
                  {correct === "motile"
                    ? "Bakteriya yo'nalishli, faol suzadi — bu haqiqiy harakatchanlik (xivchinlar yordamida), broun tebranishidan farq qiladi."
                    : "Bakteriya joyida turib faqat broun tebranishi qiladi — bu harakatsiz tur."}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
