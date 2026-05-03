"use client";

import { useTranslations } from "next-intl";
import { useLabStore } from "@/stores/labStore";
import type { LabConfig } from "@/engine/types";

interface Props {
  config: LabConfig;
}

export function StepModal({ config }: Props) {
  const t = useTranslations();
  const pending = useLabStore((s) => s.state.pendingModalStep);
  const closeModal = useLabStore((s) => s.closeModal);

  if (pending === null) return null;
  const step = config.steps.find((s) => s.id === pending);
  if (!step) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.currentTarget === e.target) closeModal();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-400/30">
            Bosqich {step.id + 1} / {config.steps.length}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          {t(step.titleKey as never)}
        </h2>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t(step.descriptionKey as never)}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/30 transition"
          >
            {t("common.understand")}
          </button>
        </div>
      </div>
    </div>
  );
}
