"use client";

import { useMemo, useState } from "react";
import { Reorder, motion } from "framer-motion";
import { MAIN_STEPS } from "../exam/protocol";

interface Props {
  onStart: (order: string[]) => void;
}

const BY_ID = Object.fromEntries(MAIN_STEPS.map((s) => [s.id, s] as const));

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Right-docked planning panel (exam phase 1) — order the 5 Drigalski cards. */
export function PlanningSidebar({ onStart }: Props) {
  const initial = useMemo(() => shuffled(MAIN_STEPS.map((s) => s.id)), []);
  const [order, setOrder] = useState<string[]>(initial);

  return (
    <aside className="relative z-30 flex h-full w-[310px] shrink-0 flex-col border-l border-slate-300/70 shadow-[-8px_0_24px_rgba(0,0,0,0.06)]" style={{ background: "linear-gradient(180deg,#fbfbfc 0%,#eef0f3 100%)" }}>
      <div className="border-b border-slate-200 px-4 pb-3 pt-3">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-700"><span>🧭</span> Ish tartibini tuzing</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Drigalski usuli qadamlarini to'g'ri ketma-ketlikda joylashtiring.</p>
      </div>

      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="wb-tray flex-1 list-none overflow-y-auto px-3 py-3">
        {order.map((id, i) => (
          <Reorder.Item key={id} value={id} whileDrag={{ scale: 1.03, boxShadow: "0 10px 24px rgba(0,0,0,0.18)", cursor: "grabbing" }} className="mb-2 flex select-none items-center gap-2.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-3 shadow-sm" style={{ cursor: "grab" }}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-100 text-[12px] font-bold text-teal-700">{i + 1}</span>
            <span className="flex-1 text-[13px] font-medium leading-tight text-slate-700">{BY_ID[id]?.card}</span>
            <span className="shrink-0 text-slate-300" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="4" cy="3" r="1.4" /><circle cx="10" cy="3" r="1.4" /><circle cx="4" cy="7" r="1.4" /><circle cx="10" cy="7" r="1.4" /><circle cx="4" cy="11" r="1.4" /><circle cx="10" cy="11" r="1.4" /></svg>
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="border-t border-slate-200 p-3">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onStart(order)} className="w-full rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:from-teal-500 hover:to-cyan-600">
          Tartibni tasdiqlab boshlash →
        </motion.button>
        <p className="mt-2 text-center text-[10px] text-slate-400">Tasdiqlagach tartibni o'zgartirib bo'lmaydi.</p>
      </div>
    </aside>
  );
}
