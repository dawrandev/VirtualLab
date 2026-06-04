"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ANTIBIOTICS, interpret, SENS_LABEL, type DiskState, type Sens } from "../state";

interface Props {
  open: boolean;
  state: DiskState;
  /** Learn mode reveals whether each call is right. */
  reveal: boolean;
  onClassify: (diskId: string, sens: Sens) => void;
  onClose: () => void;
  onFinish: () => void;
  isExam: boolean;
}

/** A small ruler-measured zone visual: disk + clear zone + ruler reading. */
function ZoneVisual({ zoneMm }: { zoneMm: number }) {
  const mm = 4.0; // px per mm in this mini view
  const zr = (zoneMm * mm) / 2;
  const cx = 70;
  const cy = 56;
  return (
    <svg width="140" height="120" viewBox="0 0 140 120">
      {/* lawn background */}
      <rect x="6" y="6" width="128" height="92" rx="8" fill="#dcdabf" />
      {/* clear inhibition zone */}
      <circle cx={cx} cy={cy} r={zr} fill="#e7e6c8" stroke="#b7bd76" strokeWidth="1" />
      {/* disk */}
      <circle cx={cx} cy={cy} r="9" fill="#fbfbf6" stroke="#cfcabd" strokeWidth="0.8" />
      {/* ruler line across the zone */}
      <line x1={cx - zr} y1={cy} x2={cx + zr} y2={cy} stroke="#0ea5a0" strokeWidth="1.6" />
      <line x1={cx - zr} y1={cy - 4} x2={cx - zr} y2={cy + 4} stroke="#0ea5a0" strokeWidth="1.6" />
      <line x1={cx + zr} y1={cy - 4} x2={cx + zr} y2={cy + 4} stroke="#0ea5a0" strokeWidth="1.6" />
      {/* mm readout */}
      <rect x={cx - 22} y={cy + zr + 4} width="44" height="16" rx="3" fill="#0f172a" />
      <text x={cx} y={cy + zr + 15} textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#fff">{zoneMm} mm</text>
    </svg>
  );
}

const CATS: Array<{ key: Sens; color: string; bg: string }> = [
  { key: "S", color: "#0f766e", bg: "#f0fdfa" },
  { key: "I", color: "#b45309", bg: "#fffbeb" },
  { key: "R", color: "#b91c1c", bg: "#fef2f2" },
];

/**
 * After incubation, the student measures the zone of inhibition around each
 * antibiotic disk (ruler reading shown) and interprets sensitivity using that
 * antibiotic's own CLSI breakpoints: ≥ S mm = Sezgir, ≤ R mm = Chidamli, between
 * = Oraliq.
 */
export function MeasureModal({ open, state, reveal, onClassify, onClose, onFinish, isExam }: Props) {
  const allDone = ANTIBIOTICS.every((a) => state.classified[a.id] != null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <button onClick={onClose} className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="close">
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" /></svg>
          </button>

          <motion.div initial={{ y: 18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="flex max-h-[92vh] w-[min(96vw,820px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">Tormozlanish zonasini o'lchang</h2>
              <p className="text-[13px] text-slate-500">Har disk atrofidagi steril zona diametrini o'lchab, har antibiotikning <b>o'z chegaralari</b> bilan baholang: Sezgir (≥ S) / Oraliq / Chidamli (≤ R).</p>
            </div>

            <div className="wb-tray grid flex-1 grid-cols-1 gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
              {ANTIBIOTICS.map((a) => {
                const picked = state.classified[a.id];
                const correct = interpret(a);
                const ok = picked === correct;
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <ZoneVisual zoneMm={a.zoneMm} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-800">{a.name}</p>
                      <p className="mb-1 text-[11px] text-slate-400">Disk: {a.code} · S ≥ {a.s} · R ≤ {a.r} mm</p>
                      <div className="flex flex-col gap-1.5">
                        {CATS.map((c) => (
                          <button
                            key={c.key}
                            onClick={() => onClassify(a.id, c.key)}
                            className="rounded-lg border-2 px-2.5 py-1.5 text-left text-[12px] font-semibold transition"
                            style={{ borderColor: picked === c.key ? c.color : "#e2e8f0", background: picked === c.key ? c.bg : "#fff", color: c.color }}
                          >
                            {SENS_LABEL[c.key]}
                            {c.key === "S" && ` (≥ ${a.s} mm)`}
                            {c.key === "R" && ` (≤ ${a.r} mm)`}
                            {c.key === "I" && ` (${a.r + 1}–${a.s - 1} mm)`}
                          </button>
                        ))}
                      </div>
                      {reveal && picked && (
                        <p className="mt-1.5 text-[11px] font-semibold" style={{ color: ok ? "#059669" : "#dc2626" }}>
                          {ok ? "✓ To'g'ri" : `✕ Noto'g'ri — to'g'risi: ${SENS_LABEL[correct]}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-3">
              <p className="pl-2 text-[12px] text-slate-400">{ANTIBIOTICS.filter((a) => state.classified[a.id]).length}/{ANTIBIOTICS.length} baholandi</p>
              <button
                onClick={onFinish}
                disabled={!allDone}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "#0ea5a0" }}
              >
                {isExam ? "Yakunlash" : "Natijani ko'rish"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
