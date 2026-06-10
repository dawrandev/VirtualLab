"use client";

import { Hourglass } from "./Hourglass";

interface Props {
  /** 0..1 elapsed fraction of the (sped-up) wait. */
  progress: number;
  /** What is happening, e.g. "Termostatda inkubatsiya…" (optional). */
  title?: string;
  /** Prominent remaining-time / status line, e.g. "Qoldi: 18 soat · real 24 soat". */
  time: string;
  /** When true, the line turns green with a ✓ (e.g. "Tayyor — endi yuving"). */
  done?: boolean;
  width?: number;
}

/**
 * Bare (card-less) hourglass wait indicator shared across the labs: a large
 * animated hourglass with the activity title and the remaining-time line
 * stacked beneath it on the bench. A white text-shadow keeps the dark labels
 * legible over the light/grey table. Matches Lab 2's staining-wait styling.
 */
export function HourglassWait({ progress, title, time, done, width = 104 }: Props) {
  return (
    <div className="flex flex-col items-center gap-1" style={{ textShadow: "0 1px 3px rgba(255,255,255,0.95), 0 1px 6px rgba(255,255,255,0.7)" }}>
      <Hourglass progress={progress} width={width} />
      {title && <p className="text-[14px] font-bold text-slate-800">{title}</p>}
      {done ? (
        <p className="flex max-w-[200px] items-center justify-center gap-1.5 text-center text-[16px] font-bold leading-snug text-emerald-600">
          <span>✓</span>
          <span>{time}</span>
        </p>
      ) : (
        <p className="max-w-[200px] text-center text-[15px] font-semibold leading-snug text-amber-700">{time}</p>
      )}
    </div>
  );
}
