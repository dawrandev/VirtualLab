"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLab2DStore } from "@/stores/labStore2d";

/**
 * Left sidebar with reference-style controls (frame 46):
 *   ← Назад
 *   ↻ Заново
 *   RUS (language)
 *   H — помощь  (yordam — Stage hint)
 *   Z — потушить (lamp off)
 *   X — проверить (check stage)
 *   ?  (legend)
 */
export function Sidebar() {
  const router = useRouter();
  const resetLab = useLab2DStore((s) => s.resetLab);
  const checkStage = useLab2DStore((s) => s.checkStage);
  const advanceStage = useLab2DStore((s) => s.advanceStage);
  const currentStageId = useLab2DStore((s) => s.state.currentStageId);
  const stage = useLab2DStore((s) => s.state.stages[s.state.currentStageId]);
  const patchState = useLab2DStore((s) => s.patchState);

  const stageChecked = stage?.status === "checked";
  const stageFailed = stage?.status === "failed";

  // Keyboard shortcuts (reference uses H / Z / X).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === "x") {
        if (stageChecked) advanceStage();
        else checkStage();
      } else if (k === "z") {
        patchState((d) => {
          d.lamp.lit = false;
        });
      } else if (k === "h") {
        // help — placeholder for now
      } else if (k === "r") {
        resetLab();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stageChecked, advanceStage, checkStage, patchState, resetLab]);

  return (
    <aside
      className="absolute top-0 left-0 z-30 h-full pointer-events-auto"
      style={{ width: 96 }}
    >
      <div className="flex flex-col gap-2 px-2 py-3 h-full">
        <PillButton label="Назад" iconLeft="back" onClick={() => router.push("/")} />
        <PillButton label="Заново" iconLeft="reload" onClick={resetLab} />

        <div className="mt-1 mb-2 mx-auto flex items-center justify-center w-12 h-7 rounded-md bg-white/85 text-xs font-bold tracking-wider text-slate-700 shadow-sm">
          UZ
        </div>

        <KeyHint k="H" label="yordam" />
        <KeyHint k="Z" label="o'chir" />
        <KeyHint
          k="X"
          label={stageChecked ? "Davom" : "tekshir"}
          highlight={stageChecked ? "ok" : stageFailed ? "fail" : undefined}
          onClick={() => (stageChecked ? advanceStage() : checkStage())}
        />

        <div className="mt-auto mx-auto w-10 h-10 rounded-full bg-white/85 grid place-items-center text-slate-600 text-lg font-bold shadow-sm">
          ?
        </div>
      </div>
    </aside>
  );
}

function PillButton({
  label,
  iconLeft,
  onClick,
}: {
  label: string;
  iconLeft?: "back" | "reload";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1 rounded-xl bg-white/85 hover:bg-white text-slate-700 text-sm font-medium px-2 py-2 shadow-sm transition active:scale-95"
    >
      {iconLeft === "back" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {iconLeft === "reload" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
          <path d="M21 4v5h-5" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </button>
  );
}

function KeyHint({
  k,
  label,
  onClick,
  highlight,
}: {
  k: string;
  label: string;
  onClick?: () => void;
  highlight?: "ok" | "fail";
}) {
  const bg =
    highlight === "ok"
      ? "bg-emerald-500 text-white hover:bg-emerald-400"
      : highlight === "fail"
      ? "bg-rose-500 text-white hover:bg-rose-400"
      : "bg-white/85 text-slate-700 hover:bg-white";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg ${bg} px-2 py-1.5 shadow-sm transition active:scale-95`}
    >
      <span className="w-6 h-6 grid place-items-center rounded-md bg-black/15 text-xs font-bold">
        {k}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
