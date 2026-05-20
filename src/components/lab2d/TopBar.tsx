"use client";

import { useLab2DStore } from "@/stores/labStore2d";

/** Top bar with student ID dropdown (left-center) and brand mark (right). */
export function TopBar() {
  const score = useLab2DStore((s) => s.state.score.outOfTen);
  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pointer-events-none"
      style={{ height: 56 }}
    >
      <div className="pl-28 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/85 rounded-2xl px-3 py-1 shadow-sm">
          <span className="text-sm font-semibold tracking-wider text-slate-700">594-494</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
            <circle cx="12" cy="8" r="3" />
            <path d="M5 20c1.5-3.5 4.5-5 7-5s5.5 1.5 7 5" />
          </svg>
        </div>
        <div className="text-xs text-slate-700/70 font-medium">
          {score.toFixed(1)}/10
        </div>
      </div>

      <div className="pr-2 flex items-center gap-2 pointer-events-auto">
        <svg width="42" height="38" viewBox="0 0 64 56" className="text-violet-700">
          <rect x="6" y="14" width="42" height="28" rx="3" fill="#fff" stroke="currentColor" strokeWidth="3" />
          <rect x="10" y="18" width="34" height="20" rx="2" fill="#f6e8ff" />
          <circle cx="20" cy="28" r="3" fill="#7a3e8c" />
          <circle cx="30" cy="32" r="2" fill="#7a3e8c" />
          <circle cx="36" cy="24" r="2" fill="#7a3e8c" />
          <path d="M28 44 L45 18 L52 12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="52" cy="11" r="3" fill="currentColor" />
        </svg>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wider text-violet-700">VIRTUAL LAB</span>
          <span className="text-[10px] font-semibold tracking-[0.2em] text-violet-700/70">MICROBIOLOGY</span>
        </div>
      </div>
    </div>
  );
}
