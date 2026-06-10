"use client";

import { useId } from "react";
import { motion } from "framer-motion";

interface Props {
  /** 0..1 — fraction of the wait elapsed (sand drained from top to bottom). */
  progress: number;
  width?: number;
}

/**
 * Animated sand hourglass (qum soat) for the staining wait. Two glass bulbs:
 * the top chamber drains and the bottom heap grows as `progress` goes 0 → 1,
 * while a live stream of falling grains pours through the neck the whole time
 * it runs (independent of progress, so the sand always looks like it's moving).
 * Funnel shapes come from clipping the sand to the bulb outline.
 */
export function Hourglass({ progress, width = 46 }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  const done = p >= 1;
  const w = width;
  const h = w * (80 / 60);
  const uid = useId().replace(/:/g, "");
  const clipId = `hgc-${uid}`;
  const sandId = `hgs-${uid}`;
  const glassId = `hgg-${uid}`;

  // Sand surfaces: top drops from y=12 (full) to 40 (empty); bottom heap rises
  // from y=68 (empty) to 40 (full) as the wait elapses.
  const yTop = 12 + 28 * p;
  const yBot = 68 - 28 * p;

  const topPath = "M14,12 L46,12 Q42,33 30,40 Q18,33 14,12 Z";
  const botPath = "M14,68 L46,68 Q42,47 30,40 Q18,47 14,68 Z";
  const grains = [0, 1, 2, 3, 4, 5, 6];

  return (
    <svg width={w} height={h} viewBox="0 0 60 80" style={{ overflow: "visible", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }}>
      <defs>
        <clipPath id={clipId}>
          <path d={topPath} />
          <path d={botPath} />
        </clipPath>
        <linearGradient id={sandId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f1f8fb" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c8dde6" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* Wooden frame: caps + side posts */}
      <rect x="5" y="1.5" width="50" height="7.5" rx="3.4" fill="#cba163" stroke="#9c763f" strokeWidth="0.9" />
      <rect x="5" y="71" width="50" height="7.5" rx="3.4" fill="#cba163" stroke="#9c763f" strokeWidth="0.9" />
      <rect x="8.5" y="8" width="3.6" height="64" rx="1.8" fill="#b58d50" />
      <rect x="47.9" y="8" width="3.6" height="64" rx="1.8" fill="#b58d50" />

      {/* Glass bulbs */}
      <path d={topPath} fill={`url(#${glassId})`} />
      <path d={botPath} fill={`url(#${glassId})`} />

      {/* Sand, clipped to the bulb shapes */}
      <g clipPath={`url(#${clipId})`}>
        {/* top chamber sand */}
        <rect x="10" y={yTop} width="40" height={Math.max(0, 40 - yTop)} fill={`url(#${sandId})`} />
        {/* concave dip on the top surface as it drains */}
        {!done && p > 0.02 && <ellipse cx="30" cy={yTop} rx="16" ry="2.6" fill="#d9810a" opacity="0.5" />}

        {/* bottom heap */}
        <rect x="10" y={yBot} width="40" height={Math.max(0, 68 - yBot)} fill={`url(#${sandId})`} />
        {/* heap mound on top */}
        <ellipse cx="30" cy={yBot} rx={Math.min(15, 4 + 24 * p)} ry="2.8" fill="#fbbf24" />
        {/* grain texture in the heap */}
        <circle cx="25" cy="62" r="0.9" fill="#d9810a" opacity="0.5" />
        <circle cx="34" cy="64" r="0.9" fill="#d9810a" opacity="0.5" />
        <circle cx="30" cy="60" r="0.8" fill="#d9810a" opacity="0.45" />

        {/* live falling stream + grains (only while running) */}
        {!done && (
          <>
            <motion.rect
              x="29.1"
              y="40"
              width="1.8"
              height="25"
              fill="#f59e0b"
              initial={{ opacity: 0.45 }}
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            {grains.map((g) => (
              <motion.circle
                key={g}
                r={1.25}
                fill="#fde047"
                cx={30}
                initial={{ opacity: 0 }}
                animate={{ cy: [40, 65], cx: [30, 30 + (g % 2 ? 1.5 : -1.5), 30], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.8, delay: g * 0.11, repeat: Infinity, ease: "easeIn" }}
              />
            ))}
          </>
        )}
      </g>

      {/* Glass outline + neck ring + shine */}
      <path d={topPath} fill="none" stroke="#9fc0cc" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={botPath} fill="none" stroke="#9fc0cc" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="27.6" y="38.4" width="4.8" height="3.2" rx="1" fill="#bcd4dd" />
      <path d="M22,17 Q18.5,29 27,38" fill="none" stroke="#ffffff" strokeWidth="1.3" opacity="0.55" strokeLinecap="round" />
    </svg>
  );
}
