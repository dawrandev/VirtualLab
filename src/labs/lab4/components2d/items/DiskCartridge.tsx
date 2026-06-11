"use client";

import { ANTIBIOTICS, type DiskState } from "../../state";

interface Props {
  width?: number;
  state: DiskState;
  /** The antibiotic currently held in the forceps (lifted out). */
  carrying?: string | null;
}

/**
 * Antibiotic-disk dispenser — a small lidded plastic box with the impregnated
 * paper disks in labelled wells. Each disk is lifted out with the forceps and
 * placed on the agar; placed/held disks vanish from their well.
 */
export function DiskCartridge({ width = 162, state, carrying }: Props) {
  const w = width;
  const h = w * (132 / 162);
  return (
    <svg width={w} height={h} viewBox="0 0 162 132" style={{ overflow: "visible", filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.22))" }}>
      <defs>
        <linearGradient id="dcBox" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eef1f3" />
          <stop offset="100%" stopColor="#c8cfd4" />
        </linearGradient>
        <radialGradient id="dcWell" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#dfe4e8" />
          <stop offset="100%" stopColor="#b3bbc1" />
        </radialGradient>
      </defs>

      {/* Box body */}
      <rect x="6" y="8" width="150" height="118" rx="8" fill="url(#dcBox)" stroke="#a4abb0" strokeWidth="1.2" />
      <rect x="6" y="8" width="150" height="15" rx="8" fill="#ffffff" opacity="0.35" />
      <text x="81" y="19" textAnchor="middle" fontFamily="sans-serif" fontSize="7.5" fontWeight="bold" fill="#6b7479">ANTIBIOTIK DISKLAR</text>

      {/* Wells with disks — 3 columns × 3 rows (7 of 9 used) */}
      {ANTIBIOTICS.map((a, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = 32 + col * 49;
        const cy = 44 + row * 31;
        const present = !state.disks[a.id] && carrying !== a.id;
        return (
          <g key={a.id}>
            <ellipse cx={cx} cy={cy} rx="17" ry="11" fill="url(#dcWell)" stroke="#9aa3a9" strokeWidth="0.6" />
            {present && (
              <>
                <ellipse cx={cx} cy={cy - 1} rx="12" ry="7.6" fill="#fbfbf6" stroke="#cfcabd" strokeWidth="0.8" />
                <text x={cx} y={cy + 2} textAnchor="middle" fontFamily="sans-serif" fontSize="6.5" fontWeight="bold" fill="#5b6770">{a.code}</text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
