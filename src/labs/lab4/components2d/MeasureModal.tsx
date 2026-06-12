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

const DISH = 350; // top-down dish diameter (px)
const PXMM = 3.0; // px per mm — zones + the reader template share this scale
const CATS: Sens[] = ["high", "medium", "low", "resistant"];
const CAT_COLOR: Record<Sens, string> = { high: "#059669", medium: "#0ea5e9", low: "#d97706", resistant: "#dc2626" };
const CAT_BG: Record<Sens, string> = { high: "#ecfdf5", medium: "#f0f9ff", low: "#fffbeb", resistant: "#fef2f2" };
const READER_MARKS = [10, 15, 20, 25, 30]; // labelled circles on the zone reader

function diskXY(fx: number, fy: number) {
  return { x: fx * DISH, y: fy * DISH };
}

/**
 * After incubation the student MEASURES each zone of inhibition with a **zone
 * reader template** (concentric mm circles, like the real HiMedia scale): drag
 * it onto a disk so the circles overlay the clear zone, read which circle the
 * zone edge meets. Then CLICK that disk to see its mm + the four sensitivity
 * options and classify it on the universal scale (>25 high, 15–25 medium, <15
 * low, no zone resistant).
 */
export function MeasureModal({ open, state, reveal, onMeasure, onClassify, onClose, onFinish, isExam }: Props) {
  const t = useTranslations();
  const dishRef = useRef<HTMLDivElement | null>(null);
  const READER_HOME = { x: DISH / 2, y: DISH + 40 };
  const [readerXY, setReaderXY] = useState(READER_HOME);
  const [dragging, setDragging] = useState(false);
  const [hoverDisk, setHoverDisk] = useState<string | null>(null);
  const [selDisk, setSelDisk] = useState<string | null>(null);

  const measuredCount = ANTIBIOTICS.filter((a) => state.measured[a.id]).length;
  const classifiedCount = ANTIBIOTICS.filter((a) => state.classified[a.id]).length;
  const allDone = ANTIBIOTICS.every((a) => state.classified[a.id] != null);
  const sel = selDisk ? ANTIBIOTICS.find((a) => a.id === selDisk) ?? null : null;

  function diskUnder(px: number, py: number): string | null {
    let best: string | null = null;
    let bestD = 30;
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

  function onReaderDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function onReaderMove(e: React.PointerEvent) {
    if (!dragging) return;
    const rect = dishRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setReaderXY({ x: px, y: py });
    setHoverDisk(diskUnder(px, py));
  }
  function onReaderUp() {
    if (dragging && hoverDisk) {
      onMeasure(hoverDisk);
      setSelDisk(hoverDisk);
    }
    setDragging(false);
    setHoverDisk(null);
    setReaderXY(READER_HOME);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <button onClick={onClose} className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="close">
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" /></svg>
          </button>

          <motion.div initial={{ y: 18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="flex max-h-[94vh] w-[min(96vw,960px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-3">
              <h2 className="text-lg font-bold text-slate-800">{t("lab4.measure.title")}</h2>
              <p className="text-[13px] text-slate-500">{t(isExam ? "lab4.measure.instructionExam" : "lab4.measure.instruction")}</p>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row">
              {/* ── Top-down dish + zone-reader template ── */}
              <div ref={dishRef} className="relative shrink-0 touch-none select-none" style={{ width: DISH, height: DISH + 70 }}>
                {/* Petri dish (agar) */}
                <div className="absolute rounded-full" style={{ left: 0, top: 0, width: DISH, height: DISH, background: "radial-gradient(circle at 42% 38%, #ecefc6, #d6da93 72%, #bcc377)", boxShadow: "inset 0 0 0 7px rgba(255,255,255,0.22), 0 0 0 5px #cfd3d8, 0 8px 22px rgba(0,0,0,0.32)" }} />
                <div className="absolute rounded-full" style={{ left: DISH * 0.04, top: DISH * 0.04, width: DISH * 0.92, height: DISH * 0.92, background: "radial-gradient(circle at 44% 40%, rgba(238,236,221,0.55), rgba(212,210,186,0.45))" }} />

                {/* zones + disks */}
                {ANTIBIOTICS.map((a) => {
                  const { x, y } = diskXY(a.fx, a.fy);
                  const zr = (a.zoneMm * PXMM) / 2;
                  const isHover = hoverDisk === a.id;
                  const isSel = selDisk === a.id;
                  const measured = state.measured[a.id];
                  return (
                    <div key={a.id} className="absolute" style={{ left: x, top: y, transform: "translate(-50%,-50%)" }}>
                      {/* realistic clear zone — a soft cleared halo fading into the lawn */}
                      {zr > 0 && (
                        <div
                          className="absolute rounded-full"
                          style={{
                            left: -zr,
                            top: -zr,
                            width: zr * 2,
                            height: zr * 2,
                            background: "radial-gradient(circle, rgba(248,247,233,0.96) 26%, rgba(235,233,205,0.72) 62%, rgba(214,212,186,0.15) 88%, rgba(214,212,186,0) 100%)",
                            filter: "blur(1.4px)",
                            boxShadow: isSel ? "0 0 0 2px rgba(14,165,160,0.7)" : "none",
                          }}
                        />
                      )}
                      {/* the antibiotic paper disk (clickable) */}
                      <button
                        onClick={() => setSelDisk(a.id)}
                        className="absolute grid place-items-center rounded-full text-[8px] font-bold"
                        style={{ left: -9, top: -9, width: 18, height: 18, background: "#fbfbf2", border: `1.5px solid ${isHover || isSel ? "#0ea5a0" : "#c9c4b3"}`, color: "#5b6770", cursor: "pointer", boxShadow: isHover ? "0 0 10px rgba(13,148,160,0.6)" : "0 1px 2px rgba(0,0,0,0.25)" }}
                      >
                        {a.code}
                      </button>
                      {measured && <div className="absolute grid h-3.5 w-3.5 place-items-center rounded-full bg-teal-500 text-[8px] text-white" style={{ left: 8, top: -12 }}>✓</div>}
                      {state.classified[a.id] && <div className="absolute h-2.5 w-2.5 rounded-full" style={{ left: -15, top: -13, background: CAT_COLOR[state.classified[a.id]!] }} />}
                    </div>
                  );
                })}

                {/* ruler parking strip */}
                <div className="absolute flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/70 text-[11px] font-semibold text-teal-600" style={{ left: 0, top: DISH + 12, width: DISH, height: 52 }}>📏 {t("lab4.measure.rulerHint")}</div>

                {/* the draggable zone-reader template */}
                <div onPointerDown={onReaderDown} onPointerMove={onReaderMove} onPointerUp={onReaderUp} className="absolute z-20 touch-none" style={{ left: readerXY.x, top: readerXY.y, transform: "translate(-50%,-50%)", cursor: dragging ? "grabbing" : "grab" }}>
                  <ZoneReader />
                </div>
              </div>

              {/* ── Selected-disk panel: mm + 4 sensitivity options ── */}
              <div className="flex flex-1 flex-col gap-3">
                <p className="text-[12px] text-slate-400">{t("lab4.measure.progress", { measured: measuredCount, classified: classifiedCount, total: ANTIBIOTICS.length })}</p>

                {sel == null ? (
                  <div className="grid flex-1 place-items-center rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-[13px] text-slate-400">{t("lab4.measure.clickDisk")}</div>
                ) : !state.measured[sel.id] ? (
                  <div className="grid flex-1 place-items-center rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center text-[13px] font-medium text-amber-700">{t("lab4.measure.measureFirst")}</div>
                ) : (
                  <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-12 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">{sel.code}</span>
                      <div>
                        <p className="text-[14px] font-bold text-slate-800">{t(`lab4.ab.${sel.id}`)}</p>
                        <p className="text-[12px] text-slate-500">{t("lab4.measure.zoneReading", { mm: sel.zoneMm })}</p>
                      </div>
                      <span className="ml-auto font-mono text-2xl font-extrabold tabular-nums text-teal-600">{sel.zoneMm} mm</span>
                    </div>
                    <p className="text-[12px] font-medium text-slate-500">{t("lab4.measure.pickSens")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CATS.map((c) => {
                        const picked = state.classified[sel.id] === c;
                        return (
                          <button key={c} onClick={() => onClassify(sel.id, c)} className="rounded-xl border-2 px-3 py-2.5 text-left text-[12px] font-semibold transition" style={{ borderColor: picked ? CAT_COLOR[c] : "#e2e8f0", background: picked ? CAT_BG[c] : "#fff", color: CAT_COLOR[c] }}>
                            {t(SENS_KEY[c])}
                            {/* Show the mm range only in LEARN mode — in the exam the
                                student must recall the scale themselves. */}
                            {!isExam && <span className="block text-[10px] font-normal text-slate-400">{t(`lab4.measure.range.${c}`)}</span>}
                          </button>
                        );
                      })}
                    </div>
                    {reveal && state.classified[sel.id] && (
                      <p className="text-[12px] font-semibold" style={{ color: state.classified[sel.id] === interpret(sel) ? "#059669" : "#dc2626" }}>
                        {state.classified[sel.id] === interpret(sel) ? t("lab4.measure.correct") : t("lab4.measure.wrong", { label: t(SENS_KEY[interpret(sel)]) })}
                      </p>
                    )}
                  </div>
                )}
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

/** Transparent antibiotic zone-reader template — concentric mm circles + a
 *  crosshair, like the real plastic scale. Centre it on a disk and read which
 *  circle the clear zone's edge reaches. */
function ZoneReader() {
  const C = 56; // svg centre
  return (
    <svg width={112} height={132} viewBox="0 0 112 132" style={{ filter: "drop-shadow(0 4px 7px rgba(0,0,0,0.4))" }}>
      <rect x="2" y="2" width="108" height="128" rx="10" fill="rgba(186,230,253,0.30)" stroke="#0ea5a0" strokeWidth="1.6" />
      {READER_MARKS.map((mm) => {
        const r = (mm * PXMM) / 2;
        return (
          <g key={mm}>
            <circle cx={C} cy={C} r={r} fill="none" stroke="#0e7490" strokeWidth={mm === 15 || mm === 25 ? 1.3 : 0.8} opacity={mm === 15 || mm === 25 ? 0.95 : 0.6} />
            <text x={C + r - 1} y={C - 1.5} fontSize="6.5" fontFamily="monospace" fill="#0e7490" textAnchor="end">{mm}</text>
          </g>
        );
      })}
      {/* crosshair */}
      <line x1={C - 50} y1={C} x2={C + 50} y2={C} stroke="#e11d48" strokeWidth="0.7" opacity="0.85" />
      <line x1={C} y1={C - 50} x2={C} y2={C + 50} stroke="#e11d48" strokeWidth="0.7" opacity="0.85" />
      <circle cx={C} cy={C} r="2" fill="#e11d48" />
      <text x={C} y="126" textAnchor="middle" fontSize="7" fontWeight="bold" fontFamily="sans-serif" fill="#0e7490">mm · zona o‘lchagich</text>
    </svg>
  );
}
