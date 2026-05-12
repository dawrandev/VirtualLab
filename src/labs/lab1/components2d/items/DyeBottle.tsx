"use client";

import type { StainId } from "@/engine2d/types";

interface Props {
  variant: StainId;
}

/** Map of stain → color + Cyrillic short label (matches Russian-Uzbek lab convention). */
const PRESETS: Record<StainId, { liquid: string; label: string; full: string }> = {
  cv: { liquid: "#5b2e8c", label: "CV", full: "Genzian" },
  lugol: { liquid: "#a26b1f", label: "Lugol", full: "Lyugol" },
  decolor: { liquid: "#e8eef2", label: "96%", full: "Etanol" },
  safranin: { liquid: "#cc3a55", label: "Safr", full: "Safranin" },
};

/**
 * Compact reagent dropper bottle. Color of the liquid matches the stain;
 * label is small, neutral white. Used for Crystal Violet (cv), Lugol's
 * iodine, 96% ethanol decolorizer, and Safranin.
 */
export function DyeBottle({ variant }: Props) {
  const p = PRESETS[variant];
  return (
    <svg width="44" height="92" viewBox="0 0 44 92">
      <rect x="16" y="0" width="12" height="12" rx="1" fill="#3a3a3a" />
      <rect x="18" y="12" width="8" height="4" rx="1" fill="#1f1f1f" />
      <rect x="14" y="16" width="16" height="6" rx="1" fill="#4a4a4a" />
      <path d="M8 22 L36 22 L36 86 Q36 90 32 90 L12 90 Q8 90 8 86 Z" fill={p.liquid} stroke="#1f1f1f" strokeWidth="1" />
      <rect x="12" y="36" width="20" height="32" rx="2" fill="#ffffff" stroke="#1f1f1f" strokeWidth="0.6" />
      <text x="22" y="51" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#1f1f1f">
        {p.label}
      </text>
      <text x="22" y="61" textAnchor="middle" fontFamily="sans-serif" fontSize="5" fill="#4a4a4a">
        {p.full}
      </text>
      <rect x="11" y="28" width="2.5" height="55" rx="1" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}
