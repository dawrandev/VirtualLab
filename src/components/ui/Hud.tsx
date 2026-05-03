"use client";

import { useTranslations } from "next-intl";
import { useLabStore } from "@/stores/labStore";
import type { LabConfig } from "@/engine/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MuteToggle } from "./MuteToggle";
import { ProgressBar } from "./ProgressBar";
import { InventoryPanel } from "./InventoryPanel";
import { ScorePanel } from "./ScorePanel";
import { StepModal } from "./StepModal";
import { ErrorToast } from "./ErrorToast";

interface Props {
  config: LabConfig;
}

export function Hud({ config }: Props) {
  const t = useTranslations();
  const resetLab = useLabStore((s) => s.resetLab);
  const currentStep = useLabStore((s) => s.state.currentStep);
  const totalSteps = config.steps.length;

  return (
    <>
      {/* Top header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
        <div className="pointer-events-auto rounded-2xl bg-slate-900/70 px-4 py-3 backdrop-blur-md ring-1 ring-white/10 shadow-xl">
          <h1 className="text-sm font-semibold tracking-wide text-indigo-100">
            {t(`${config.titleKey}` as never)}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t(`${config.descriptionKey}` as never)}
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-slate-900/70 px-3 py-2 backdrop-blur-md ring-1 ring-white/10 shadow-xl">
          <ProgressBar current={currentStep} total={totalSteps} />
          <button
            onClick={resetLab}
            className="ml-2 rounded-md bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700/80 transition"
          >
            {t("common.reset")}
          </button>
          <MuteToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Left: tools inventory */}
      <aside className="pointer-events-auto absolute left-4 top-24 bottom-4 z-10 w-64">
        <InventoryPanel config={config} />
      </aside>

      {/* Right: live scoring */}
      <aside className="pointer-events-auto absolute right-4 top-24 bottom-4 z-10 w-72">
        <ScorePanel config={config} />
      </aside>

      {/* Errors */}
      <ErrorToast />

      {/* Step modal */}
      <StepModal config={config} />
    </>
  );
}
