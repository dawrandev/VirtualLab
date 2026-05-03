"use client";

import { useTranslations } from "next-intl";
import { useLabStore } from "@/stores/labStore";
import type { LabConfig, ToolId } from "@/engine/types";

interface Props {
  config: LabConfig;
}

const TOOL_LABEL_KEYS: Record<ToolId, string> = {
  loop: "lab1.toolLoop",
  slide: "lab1.toolSlide",
  dyePipette: "lab1.toolDyePipette",
  waterPipette: "lab1.toolWaterPipette",
  match: "lab1.toolMatch",
  matchbox: "lab1.toolMatchbox",
  spiritLamp: "lab1.toolSpiritLamp",
  cultureTube: "lab1.toolCultureTube",
  microscope: "lab1.toolMicroscope",
};

const TOOL_EMOJI: Record<ToolId, string> = {
  loop: "⊙",
  slide: "▭",
  dyePipette: "💜",
  waterPipette: "💧",
  match: "🔥",
  matchbox: "📦",
  spiritLamp: "🕯️",
  cultureTube: "🧪",
  microscope: "🔬",
};

/** Where to find each tool on the lab bench (UZ hint). */
const TOOL_HINT: Record<ToolId, string> = {
  match: "Stol chap tomonida",
  matchbox: "Stol chap tomonida",
  spiritLamp: "Stol markazida",
  loop: "Stol chap tomonida",
  cultureTube: "Stol o'ng tomonida",
  slide: "Stol chap tomonida",
  dyePipette: "Stol o'ng tomonida (binafsha)",
  waterPipette: "Stol o'ng tomonida (ko'k)",
  microscope: "Stol o'ng oxirida",
};

/**
 * Read-only legend of tools available in the current lab. Tools are
 * interacted with directly in the 3D scene (drag-and-drop). This panel
 * just helps the user identify tools by name + location hint.
 */
export function InventoryPanel({ config }: Props) {
  const t = useTranslations();
  const draggedToolId = useLabStore((s) => s.state.draggedToolId);

  return (
    <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md ring-1 ring-white/10 shadow-xl p-4 h-full overflow-y-auto">
      <h2 className="text-sm font-semibold tracking-wide text-indigo-100 mb-1">
        {t("lab1.toolsTitle")}
      </h2>
      <p className="text-xs text-slate-500 mb-4 italic">
        Stol ustidagi asboblarni sichqoncha bilan ushlab, sudrang.
      </p>

      <div className="space-y-2">
        {config.tools.map((tool) => {
          const active = draggedToolId === tool.id;
          return (
            <div
              key={tool.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                active
                  ? "border-indigo-400 bg-indigo-500/15 shadow-sm shadow-indigo-500/20"
                  : "border-slate-700 bg-slate-800/40"
              }`}
            >
              <span className="text-2xl">{TOOL_EMOJI[tool.id]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">
                  {t(TOOL_LABEL_KEYS[tool.id] as never)}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {TOOL_HINT[tool.id]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
