"use client";

import { Flame } from "../animations/Flame";

interface Props {
  /** When true, the flame is rendered above the wick. */
  lit: boolean;
  /** Diameter of the silver collar / brass ring in viewport pixels. */
  diameter?: number;
}

/**
 * Top-down view of the lamp neck — silver collar with a brown wick stub
 * at center and (optionally) a tall flame rising upward. Used inside the
 * `LampIgniteZoom` and `FlamePassZoom` cutscenes.
 */
export function LampTopDown({ lit, diameter = 360 }: Props) {
  const r = diameter / 2;
  return (
    <div style={{ position: "relative", width: diameter, height: diameter * 1.4 }}>
      {/* Flame above the wick — positioned in the upper half */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: 0,
          width: diameter * 0.45,
          height: diameter * 0.85,
        }}
      >
        <Flame width={diameter * 0.45} height={diameter * 0.85} intensity={lit ? 1 : 0} preset="lamp" />
      </div>

      {/* Collar + wick rendered as a circular SVG */}
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        style={{ position: "absolute", left: 0, top: diameter * 0.4 }}
      >
        <defs>
          <radialGradient id="collarRim" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f6f8fa" />
            <stop offset="55%" stopColor="#c8cfd3" />
            <stop offset="100%" stopColor="#7a878f" />
          </radialGradient>
        </defs>
        <circle cx={r} cy={r} r={r - 4} fill="url(#collarRim)" stroke="#5b6770" strokeWidth="2" />
        <circle cx={r} cy={r} r={r - 18} fill="#9aa9b0" />
        {/* Wick — a small dark brown disk in the center */}
        <ellipse cx={r} cy={r} rx={r * 0.16} ry={r * 0.12} fill={lit ? "#2a1c12" : "#8a6543"} />
        {/* Wick wet sheen */}
        <ellipse cx={r - r * 0.06} cy={r - r * 0.05} rx={r * 0.05} ry={r * 0.02} fill="#ffffff" opacity="0.55" />
      </svg>
    </div>
  );
}
