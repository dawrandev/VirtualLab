"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Props {
  onRestart: () => void;
  onClose: () => void;
}

/** Learn-mode completion for Lab 3: the work ends when the incubated plates come
 *  out of the thermostat. Explains the result — progressive dilution across the
 *  three plates yields isolated colonies (a pure culture) on plate 3. */
export function Lab3LearnResult({ onRestart, onClose }: Props) {
  const t = useTranslations();
  const plates = [
    { n: "1", k: "lab3.learn.plate1", color: "#84cc16" },
    { n: "2", k: "lab3.learn.plate2", color: "#22c55e" },
    { n: "3", k: "lab3.learn.plate3", color: "#0ea5e9", star: true },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 240, damping: 24 }} className="flex max-h-[92vh] w-[min(94vw,560px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center gap-4 px-6 py-5" style={{ background: "linear-gradient(135deg,#14b8a622,#ffffff)" }}>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-teal-500 text-3xl text-white shadow-lg">✓</div>
          <div>
            <p className="text-lg font-bold text-slate-800">{t("lab3.learn.title")}</p>
            <p className="text-[13px] text-slate-500">{t("lab3.learn.subtitle")}</p>
          </div>
        </div>

        <div className="wb-tray flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <p className="text-[13px] leading-relaxed text-slate-600">{t("lab3.learn.intro")}</p>
          {plates.map((p) => (
            <div key={p.n} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5" style={{ outline: p.star ? "2px solid #0ea5e9" : "none" }}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: p.color }}>{p.n}</span>
              <p className="text-[13px] leading-snug text-slate-700">{t(p.k)}</p>
            </div>
          ))}
          <div className="rounded-xl bg-sky-50 px-4 py-3 text-[13px] leading-relaxed text-sky-800 ring-1 ring-sky-200">
            <span className="font-semibold">🎯 {t("lab3.learn.resultLabel")}: </span>
            {t("lab3.learn.result")}
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">{t("ui.close")}</button>
          <button onClick={onRestart} className="flex-1 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-teal-400">{t("ui.restart")}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
