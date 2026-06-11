"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ANTIBIOTICS, interpret, SENS_KEY, type DiskState, type Sens } from "../state";

interface Props {
  open: boolean;
  state: DiskState;
  /** Learn mode reveals whether each call is right. */
  reveal: boolean;
  onMeasure: (diskId: string) => void;
  onClassify: (diskId: string, sens: Sens) => void;
  onClose: () => void;
  onFinish: () => void;
  isExam: boolean;
}

const DISH = 340; // top-down dish diameter (px)
const PXMM = 3.0; // px per mm for the zones + ruler
const CATS: Sens[] = ["high", "medium", "low", "resistant"];
const CAT_COLOR: Record<Sens, string> = { high: "#059669", medium: "#0ea5e9", low: "#d97706", resistant: "#dc2626" };
const CAT_BG: Record<Sens, string> = { high: "#ecfdf5", medium: "#f0f9ff", low: "#fffbeb", resistant: "#fef2f2" };

/** Disk centre (px) inside the dish square. */
function diskXY(fx: number, fy: number) {
  return { x: fx * DISH, y: fy * DISH };
}

/**
 * After incubation the student MEASURES each inhibition zone with a ruler, then
 * classifies the antibiotic's sensitivity on the universal scale (>25 mm high,
 * 15–25 medium, <15 low, no zone resistant). Drag the ruler onto a disk to
 * measure it; once measured, pick its category.
 */
export function MeasureModal({ open, state, reveal, onMeasure, onClassify, onClose, onFinish, isExam }: Props) {
  const t = useTranslations();
  const dishRef = useRef<HTMLDivElement | null>(null);
  const [rulerXY, setRulerXY] = useState({ x: DISH / 2, y: -34 }); // starts above the dish
  const [dragging, setDragging] = useState(false);
  const [hoverDisk, setHoverDisk] = useState<string | null>(null);
  const [selDisk, setSelDisk] = useState<string | null>(null);

  const measuredCount = ANTIBIOTICS.filter((a) => state.measured[a.id]).length;
  const classifiedCount = ANTIBIOTICS.filter((a) => state.classified[a.id]).length;
  const allDone = ANTIBIOTICS.every((a) => state.classified[a.id] != null);

  /** Which disk the ruler centre is currently over (within its zone/disk). */
  function diskUnder(px: number, py: number): string | null {
    let best: string | null = null;
    let bestD = 26; // px tolerance
    for (const a of ANTIBIOTICS) {
      const { x, y } = diskXY(a.fx, a.fy);
      const d = Math.hypot(px - x, py - y);
      if (d < bestD) {
        bestD = d;
        best = a.id;
      }
    }
    return best;
  }

  function onRulerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function onRulerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const rect = dishRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setRulerXY({ x: px, y: py });
    setHoverDisk(diskUnder(px, py));
  }
  function onRulerUp() {
    if (dragging && hoverDisk) {
      onMeasure(hoverDisk);
      setSelDisk(hoverDisk);
    }
    setDragging(false);
    setHoverDisk(null);
    setRulerXY({ x: DISH / 2, y: -34 });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <button onClick={onClose} className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="close">
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" /></svg>
          </button>

          <motion.div initial={{ y: 18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="flex max-h-[94vh] w-[min(96vw,940px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-3.5">
              <h2 className="text-lg font-bold text-slate-800">{t("lab4.measure.title")}</h2>
              <p className="text-[13px] text-slate-500">{t("lab4.measure.instruction")}</p>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row">
              {/* ── Top-down dish with the 7 disks + zones + draggable ruler ── */}
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div ref={dishRef} className="relative touch-none select-none" style={{ width: DISH, height: DISH }}>
                  {/* Petri dish (agar) */}
                  <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 42% 38%, #e9ecbf, #d2d68f 70%, #b9c074)", boxShadow: "inset 0 0 0 6px rgba(255,255,255,0.25), 0 0 0 5px #cfd3d8, 0 8px 20px rgba(0,0,0,0.3)" }} />
                  {/* confluent lawn tint */}
                  <div className="absolute inset-[5%] rounded-full" style={{ background: "radial-gradient(circle at 44% 40%, rgba(236,234,217,0.7), rgba(214,212,189,0.55))" }} />

                  {/* zones + disks */}
                  {ANTIBIOTICS.map((a) => {
                    const { x, y } = diskXY(a.fx, a.fy);
                    const zr = (a.zoneMm * PXMM) / 2;
                    const isMeasured = state.measured[a.id];
                    const isHover = hoverDisk === a.id;
                    const isSel = selDisk === a.id;
                    return (
                      <div key={a.id} className="absolute" style={{ left: x, top: y, transform: "translate(-50%,-50%)" }}>
                        {/* clear inhibition zone */}
                        {zr > 0 && (
                          <div
                            className="absolute rounded-full"
                            style={{ left: -zr, top: -zr, width: zr * 2, height: zr * 2, background: "radial-gradient(circle, #edeccb, #e4e3bf)", border: `1.5px ${isSel ? "solid" : "dashed"} ${isSel ? "#0ea5a0" : "#b7bd76"}` }}
                          />
                        )}
                        {/* disk */}
                        <button
                          onClick={() => isMeasured && setSelDisk(a.id)}
                          className="absolute grid place-items-center rounded-full text-[8px] font-bold"
                          style={{ left: -9, top: -9, width: 18, height: 18, background: "#fbfbf6", border: `1.5px solid ${isHover ? "#0ea5a0" : isSel ? "#0ea5a0" : "#cfcabd"}`, color: "#5b6770", cursor: isMeasured ? "pointer" : "default", boxShadow: isHover ? "0 0 10px rgba(13,148,160,0.6)" : "none" }}
                        >
                          {a.code}
                        </button>
                        {/* measured reading */}
                        {isMeasured && (
                          <div className="absolute whitespace-nowrap rounded bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ left: 12, top: -8 }}>{a.zoneMm} mm</div>
                        )}
                        {/* ✓ once classified */}
                        {state.classified[a.id] && <div className="absolute grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[9px] text-white" style={{ left: -16, top: -14 }}>✓</div>}
                      </div>
                    );
                  })}

                  {/* measuring line across the hovered zone */}
                  {dragging && hoverDisk && (() => {
                    const a = ANTIBIOTICS.find((x) => x.id === hoverDisk)!;
                    const { x, y } = diskXY(a.fx, a.fy);
                    const zr = Math.max(9, (a.zoneMm * PXMM) / 2);
                    return <div className="pointer-events-none absolute" style={{ left: x - zr, top: y, width: zr * 2, height: 0, borderTop: "2px solid #0ea5a0" }} />;
                  })()}

                  {/* The draggable ruler */}
                  <div
                    onPointerDown={onRulerDown}
                    onPointerMove={onRulerMove}
                    onPointerUp={onRulerUp}
                    className="absolute z-20 touch-none"
                    style={{ left: rulerXY.x, top: rulerXY.y, transform: "translate(-50%,-50%)", cursor: dragging ? "grabbing" : "grab" }}
                  >
                    <Ruler />
                  </div>
                </div>
                <p className="max-w-[340px] text-center text-[12px] text-slate-500">{t("lab4.measure.rulerHint")}</p>
              </div>

              {/* ── Per-disk classification list ── */}
              <div className="wb-tray flex-1 space-y-2 overflow-y-auto pr-1">
                {ANTIBIOTICS.map((a) => {
                  const measured = state.measured[a.id];
                  const picked = state.classified[a.id];
                  const correct = interpret(a);
                  const ok = picked === correct;
                  return (
                    <div key={a.id} className="rounded-xl border border-slate-200 p-2.5" style={{ outline: selDisk === a.id ? "2px solid #0ea5a0" : "none" }}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="grid h-6 w-9 place-items-center rounded bg-slate-100 text-[11px] font-bold text-slate-600">{a.code}</span>
                        <span className="text-[12px] font-semibold text-slate-700">{t(`lab4.ab.${a.id}`)}</span>
                        <span className="ml-auto text-[11px] font-bold tabular-nums" style={{ color: measured ? "#0f766e" : "#cbd5e1" }}>
                          {measured ? t("lab4.measure.zoneMm", { mm: a.zoneMm }) : t("lab4.measure.notMeasured")}
                        </span>
                      </div>
                      {measured ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {CATS.map((c) => (
                            <button
                              key={c}
                              onClick={() => onClassify(a.id, c)}
                              className="rounded-lg border-2 px-2 py-1.5 text-[11px] font-semibold transition"
                              style={{ borderColor: picked === c ? CAT_COLOR[c] : "#e2e8f0", background: picked === c ? CAT_BG[c] : "#fff", color: CAT_COLOR[c] }}
                            >
                              {t(SENS_KEY[c])}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-slate-400">{t("lab4.measure.measureFirst")}</p>
                      )}
                      {reveal && picked && (
                        <p className="mt-1 text-[11px] font-semibold" style={{ color: ok ? "#059669" : "#dc2626" }}>
                          {ok ? t("lab4.measure.correct") : t("lab4.measure.wrong", { label: t(SENS_KEY[correct]) })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-3">
              <p className="pl-2 text-[12px] text-slate-400">{t("lab4.measure.progress", { measured: measuredCount, classified: classifiedCount, total: ANTIBIOTICS.length })}</p>
              <button onClick={onFinish} disabled={!allDone} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-40" style={{ background: "#0ea5a0" }}>
                {isExam ? t("lab4.measure.finish") : t("lab4.measure.viewResult")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A small transparent measuring ruler with mm ticks. */
function Ruler() {
  return (
    <svg width="150" height="34" viewBox="0 0 150 34" style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.35))" }}>
      <rect x="2" y="9" width="146" height="16" rx="2" fill="rgba(224,242,254,0.9)" stroke="#0ea5a0" strokeWidth="1.4" />
      {Array.from({ length: 29 }).map((_, i) => (
        <line key={i} x1={6 + i * 5} y1="9" x2={6 + i * 5} y2={i % 5 === 0 ? 18 : 14} stroke="#0e7490" strokeWidth={i % 5 === 0 ? 1 : 0.6} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <text key={n} x={6 + n * 25} y="31" textAnchor="middle" fontSize="6" fill="#0e7490" fontFamily="monospace">{n * 10}</text>
      ))}
    </svg>
  );
}
