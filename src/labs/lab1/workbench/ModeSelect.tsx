"use client";

import { motion } from "framer-motion";
import type { LabMode } from "../exam/protocol";

interface Props {
  onPick: (mode: LabMode) => void;
}

/**
 * Entry overlay: the student chooses how to enter the lab.
 *  - Learn: full guidance (hints, ✓, next-tool highlight) — no grade.
 *  - Exam: plan the order first, then perform with no help — graded.
 */
export function ModeSelect({ onPick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 18, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="w-[min(92vw,720px)] rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-1 text-center">
          <h2 className="text-xl font-bold text-slate-800">Bakterial hujayra morfologiyasi</h2>
          <p className="text-sm text-slate-500">Oddiy bo'yash — metilen ko'ki · Lab 1</p>
        </div>
        <p className="mb-5 mt-3 text-center text-sm text-slate-600">Rejimni tanlang</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Learn */}
          <button
            onClick={() => onPick("learn")}
            className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50/60 hover:shadow-lg"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-2xl">🎓</span>
            <span className="text-base font-bold text-slate-800">O'rganish rejimi</span>
            <span className="text-[13px] leading-snug text-slate-500">
              Har qadamda yo'l-yo'riq, ✓ belgilar va keyingi asbob ko'rsatiladi. Ball qo'yilmaydi — bemalol o'rganasiz.
            </span>
            <span className="mt-1 text-xs font-semibold text-emerald-600 opacity-0 transition group-hover:opacity-100">Boshlash →</span>
          </button>

          {/* Exam */}
          <button
            onClick={() => onPick("exam")}
            className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-left transition hover:border-violet-400 hover:bg-violet-50/60 hover:shadow-lg"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-violet-100 text-2xl">📝</span>
            <span className="text-base font-bold text-slate-800">Imtihon rejimi</span>
            <span className="text-[13px] leading-snug text-slate-500">
              Avval ish tartibini o'zingiz tuzasiz, so'ng hech qanday yordamsiz bajarasiz. Xatolar ballni pasaytiradi — natija oxirida.
            </span>
            <span className="mt-1 text-xs font-semibold text-violet-600 opacity-0 transition group-hover:opacity-100">Boshlash →</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
