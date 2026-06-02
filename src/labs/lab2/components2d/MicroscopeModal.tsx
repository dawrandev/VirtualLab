"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  /** "violet" = Gram-positive cells retained the stain; "pink" = decolorized. */
  cellColor: "violet" | "pink";
  /** The student's current pick (null until they choose). */
  picked: "positive" | "negative" | null;
  /** In learn mode the correct answer + feedback is revealed after picking. */
  reveal: boolean;
  correct: "positive" | "negative";
  onClassify: (type: "positive" | "negative") => void;
  onClose: () => void;
}

interface P {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
}

function clusters(): P[] {
  // Deterministic grape-like cocci clusters (no Math.random for stability).
  const pts: P[] = [];
  const centers = [
    [32, 34], [60, 26], [45, 54], [70, 62], [24, 66], [54, 76], [78, 42], [38, 74], [66, 40],
  ];
  let id = 0;
  for (const [cxp, cyp] of centers) {
    const offs = [[-3.6, -2.8], [-0.6, -3.6], [2.4, -2.6], [-3, 0.4], [0, 0], [3, 1], [-1.2, 3], [2, 3.2], [-3.4, 3.4]];
    for (const [dx, dy] of offs) {
      pts.push({ id: id++, left: cxp + dx, top: cyp + dy, size: 13, delay: (id % 7) * 0.4 });
    }
  }
  return pts;
}

/** Microscope eyepiece view for the Gram result — a vignetted field of stained
 *  cocci. The student classifies the Gram type; in learn mode the answer is
 *  revealed with feedback. */
export function MicroscopeModal({ open, cellColor, picked, reveal, correct, onClassify, onClose }: Props) {
  const cells = useMemo(() => clusters(), []);
  const fill = cellColor === "violet" ? "#3b0a6b" : "#a8194f";
  const isRight = picked === correct;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
        >
          <button onClick={onClose} className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="close">
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" /></svg>
          </button>

          <div className="flex flex-col items-center gap-5">
            {/* Eyepiece */}
            <div className="relative h-[min(70vw,440px)] w-[min(70vw,440px)]">
              <div
                className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)]"
                style={{ background: "radial-gradient(circle, #fdf4f8 0%, #f7e6ee 60%, #d4abc1 90%, #2a1622 100%)" }}
              >
                {cells.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.92, x: [0, 1.5, -2, 0], y: [0, -1.5, 2, 0] }}
                    transition={{ duration: 5, delay: p.delay, repeat: Infinity }}
                    style={{
                      position: "absolute",
                      left: `${p.left}%`,
                      top: `${p.top}%`,
                      width: p.size,
                      height: p.size,
                      borderRadius: "50%",
                      background: fill,
                      boxShadow: `0 0 4px ${fill}, inset 0 0 2px rgba(255,255,255,0.4)`,
                    }}
                  />
                ))}
                {/* Centred at the bottom so the circular mask never clips it. */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">100× · immersion</div>
              </div>
            </div>

            {/* Classification */}
            <div className="w-[min(90vw,460px)] rounded-2xl bg-white/95 p-4 text-center shadow-2xl">
              <p className="mb-3 text-sm font-semibold text-slate-700">Bu bakteriya qaysi guruhga kiradi?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => onClassify("positive")}
                  className="flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition"
                  style={{
                    borderColor: picked === "positive" ? "#6d28d9" : "#e2e8f0",
                    background: picked === "positive" ? "#f5f3ff" : "#fff",
                    color: "#5b21b6",
                  }}
                >
                  Gram-musbat (+)<br /><span className="text-[11px] font-normal text-slate-500">binafsha</span>
                </button>
                <button
                  onClick={() => onClassify("negative")}
                  className="flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition"
                  style={{
                    borderColor: picked === "negative" ? "#be185d" : "#e2e8f0",
                    background: picked === "negative" ? "#fdf2f8" : "#fff",
                    color: "#9d174d",
                  }}
                >
                  Gram-manfiy (−)<br /><span className="text-[11px] font-normal text-slate-500">qizil</span>
                </button>
              </div>

              {reveal && picked && (
                <div
                  className="mt-3 rounded-lg px-3 py-2 text-[13px] font-medium"
                  style={{ background: isRight ? "#ecfdf5" : "#fef2f2", color: isRight ? "#059669" : "#dc2626" }}
                >
                  {isRight ? "✓ To'g'ri! " : "✕ Noto'g'ri. "}
                  {correct === "positive"
                    ? "Bu Gram-musbat bakteriya — gentsianviolet-yod kompleksini saqlab qoladi, binafsha rangda."
                    : "Bu Gram-manfiy bakteriya — spirtda rangsizlanadi, fuksin bilan qizil rangga bo'yaladi."}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
