"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { DrigalskiState } from "../state";
import { LAB3_ITEMS, requiredItem, type Lab3ItemId } from "./items";

interface Props {
  state: DrigalskiState;
  placed: Set<Lab3ItemId>;
  draggingId: Lab3ItemId | null;
  onStartDrag: (id: Lab3ItemId, e: React.PointerEvent) => void;
  showHints?: boolean;
}

/** Left tool tray for Lab 3 — same paradigm as Labs 1–2. */
export function Lab3Sidebar({ state, placed, draggingId, onStartDrag, showHints = true }: Props) {
  const [hovered, setHovered] = useState<Lab3ItemId | null>(null);
  const t = useTranslations();
  const required = showHints ? requiredItem(state) : null;

  return (
    <aside className="relative z-20 flex h-full w-[212px] shrink-0 flex-col border-r border-slate-300/70" style={{ background: "linear-gradient(180deg,#fbfbfc 0%,#eef0f3 100%)" }}>
      <div className="border-b border-slate-200 px-4 pb-2 pt-3">
        <h2 className="text-sm font-bold tracking-wide text-slate-700">🧫 {t("ui.toolsTitle")}</h2>
        {showHints && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{t("ui.dragHintSidebar")}</p>}
      </div>

      <div className="wb-tray grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto px-3 py-3">
        {LAB3_ITEMS.map((item) => {
          const isPlaced = placed.has(item.id);
          const isRequired = required === item.id && !isPlaced;
          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onStartDrag(item.id, e);
                }}
                onPointerEnter={() => setHovered(item.id)}
                onPointerLeave={() => setHovered((h) => (h === item.id ? null : h))}
                className="group flex w-full flex-col items-center gap-1 rounded-xl bg-white px-1.5 py-2 transition"
                style={{
                  border: isRequired ? "2px solid #0ea5a0" : "2px solid #e2e8f0",
                  boxShadow: isRequired ? "0 0 0 1px #2dd4bf, 0 0 12px rgba(13,148,160,0.4)" : "0 1px 2px rgba(0,0,0,0.08)",
                  opacity: isPlaced || draggingId === item.id ? 0.4 : 1,
                  cursor: "grab",
                  animation: isRequired ? "wbGlow 1.6s ease-in-out infinite" : undefined,
                }}
              >
                <div className="pointer-events-none flex h-[56px] w-full items-center justify-center overflow-hidden">
                  <div style={{ transform: `scale(${item.preview})` }}>{item.render(state, {})}</div>
                </div>
                <span className="pointer-events-none text-center text-[10px] font-medium leading-tight text-slate-600">{t(item.label)}</span>
                {isPlaced && <span className="pointer-events-none text-[8px] uppercase tracking-wider text-teal-600">{t("ui.onTable")}</span>}
              </button>
              {hovered === item.id && (
                <div className="pointer-events-none absolute left-1/2 top-[102%] z-50 w-36 -translate-x-1/2 rounded-lg bg-slate-800 px-2.5 py-1.5 text-center text-[11px] text-white shadow-xl">{t(item.label)}</div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
