"use client";

interface Props {
  enabled: boolean;
  /** Render-size multiplier (1 = 120×170). */
  scale?: number;
}

/**
 * Compound laboratory microscope — semi-realistic gunmetal & chrome, lit from
 * the upper-left. No flat cartoon outlines: form comes from smooth multi-stop
 * metal gradients, specular highlight streaks, soft ambient-occlusion at the
 * joints, knurled coaxial focus knobs, colour-coded objectives and a glass
 * ocular. When `enabled` the eyepiece lens glints blue with a soft halo.
 */
export function MicroscopeIcon({ enabled, scale = 1 }: Props) {
  return (
    <svg
      width={120 * scale}
      height={170 * scale}
      viewBox="0 0 120 170"
      style={{ overflow: "visible", filter: "drop-shadow(0 7px 8px rgba(0,0,0,0.3))" }}
    >
      <defs>
        <linearGradient id="msBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#59636b" />
          <stop offset="45%" stopColor="#333c43" />
          <stop offset="100%" stopColor="#13171b" />
        </linearGradient>
        <linearGradient id="msLimb" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#aab3ba" />
          <stop offset="30%" stopColor="#79828a" />
          <stop offset="68%" stopColor="#4a525a" />
          <stop offset="100%" stopColor="#262d33" />
        </linearGradient>
        <linearGradient id="msTube" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b6bec4" />
          <stop offset="34%" stopColor="#828b92" />
          <stop offset="72%" stopColor="#4c545b" />
          <stop offset="100%" stopColor="#282e34" />
        </linearGradient>
        <linearGradient id="msChrome" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f2f5f6" />
          <stop offset="48%" stopColor="#cfd5d9" />
          <stop offset="100%" stopColor="#7c858b" />
        </linearGradient>
        <radialGradient id="msKnob" cx="36%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#e1e6e9" />
          <stop offset="48%" stopColor="#a7afb5" />
          <stop offset="100%" stopColor="#444c53" />
        </radialGradient>
        <radialGradient id="msLens" cx="38%" cy="34%" r="68%">
          <stop offset="0%" stopColor={enabled ? "#d2ecff" : "#d3dadf"} />
          <stop offset="50%" stopColor={enabled ? "#4a7fc0" : "#8e979e"} />
          <stop offset="100%" stopColor={enabled ? "#1c386a" : "#4d565d"} />
        </radialGradient>
        <linearGradient id="msGloss" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {enabled && <circle cx="52" cy="88" r="60" fill="#3f74b8" opacity="0.07" />}

      {/* Ground shadow */}
      <ellipse cx="58" cy="161" rx="45" ry="8" fill="#000" opacity="0.2" />

      {/* ---- Heavy foot ---- */}
      <path d="M18 158 C12 144 26 136 44 135 L72 135 C90 136 104 144 98 158 C96 164 80 167 58 167 C36 167 20 164 18 158 Z" fill="url(#msBase)" />
      <ellipse cx="58" cy="136" rx="31" ry="7.6" fill="url(#msLimb)" />
      <path d="M32 135 Q58 129 84 135" fill="none" stroke="#dfe6ea" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <ellipse cx="58" cy="162" rx="36" ry="4.5" fill="#0a0d10" opacity="0.25" />

      {/* ---- Limb: tapered pillar + curved upper arm ---- */}
      <path d="M64 142 L61 74 Q61 63 75 63 L86 63 Q98 63 95 74 L86 142 Z" fill="url(#msLimb)" />
      {/* upper arm sweeping left to the head */}
      <path d="M82 66 C66 50 54 50 43 53 L46 67 C57 64 70 70 77 79 Z" fill="url(#msLimb)" />
      {/* specular streak + edge shadow on the pillar */}
      <path d="M70 138 L67 72" stroke="#d2d9de" strokeWidth="2.4" opacity="0.45" strokeLinecap="round" />
      <path d="M90 134 L88 74" stroke="#161b1f" strokeWidth="3" opacity="0.32" strokeLinecap="round" />
      {/* AO where the pillar meets the foot */}
      <ellipse cx="74" cy="140" rx="18" ry="5" fill="#0c0f12" opacity="0.22" />

      {/* ---- Coaxial focus knobs ---- */}
      <ellipse cx="91" cy="112" rx="15.5" ry="15.5" fill="url(#msKnob)" />
      <g stroke="#3f474e" strokeWidth="1" opacity="0.55">
        <path d="M91 98 V101 M91 123 V126 M77 112 H80 M102 112 H105 M81 102 L83.5 104.5 M101 102 L98.5 104.5 M81 122 L83.5 119.5 M101 122 L98.5 119.5" />
      </g>
      <ellipse cx="91" cy="112" rx="8" ry="8" fill="url(#msKnob)" />
      <circle cx="91" cy="112" r="3" fill="#2f363c" />
      <circle cx="87" cy="108" r="2" fill="#ffffff" opacity="0.5" />

      {/* ---- Mechanical stage (chrome) ---- */}
      <path d="M9 95 L72 95 L80 103 L17 103 Z" fill="url(#msChrome)" />
      <path d="M17 103 L80 103 L79 109 L17 109 Z" fill="#9aa2a8" />
      <path d="M11 96 L70 96" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
      {/* slide + spring clips */}
      <rect x="24" y="90" width="30" height="7" rx="1" fill="#d7eaf2" stroke="#9bb4bd" strokeWidth="0.5" opacity="0.92" />
      <rect x="26" y="91" width="10" height="2" rx="1" fill="#ffffff" opacity="0.65" />
      <rect x="21" y="91" width="8" height="4" rx="1.5" fill="#838c93" />
      <rect x="50" y="91" width="8" height="4" rx="1.5" fill="#838c93" />

      {/* ---- Sub-stage condenser + mirror ---- */}
      <rect x="49" y="103" width="14" height="12" rx="2" fill="url(#msTube)" />
      <ellipse cx="56" cy="115" rx="8" ry="2.6" fill="#363d43" />
      <ellipse cx="56" cy="121" rx="9.5" ry="3.4" fill="url(#msChrome)" />

      {/* ---- Nosepiece turret + colour-coded objectives ---- */}
      <ellipse cx="45" cy="85" rx="13.5" ry="5.2" fill="url(#msLimb)" />
      <ellipse cx="45" cy="84" rx="9" ry="3" fill="#2c333a" opacity="0.6" />
      {/* long 100x objective over the stage centre */}
      <path d="M41 87 L43.5 99 L47 99 L44.5 87 Z" fill="url(#msTube)" />
      <rect x="42.4" y="96" width="4.4" height="1.7" fill="#c0392b" />
      {/* medium objective */}
      <path d="M51 86 L52.6 94 L55.4 94 L53.8 86 Z" fill="url(#msTube)" />
      <rect x="51.8" y="92" width="3.4" height="1.4" fill="#e0a32e" />
      {/* short objective */}
      <path d="M35 86 L36.4 91 L39 91 L37.6 86 Z" fill="url(#msTube)" />

      {/* ---- Body tube + inclined ocular head ---- */}
      <rect x="38" y="56" width="14" height="28" rx="4" fill="url(#msTube)" />
      <rect x="41" y="58" width="2.6" height="24" rx="1.3" fill="#ffffff" opacity="0.4" />
      <g transform="rotate(-18 45 40)">
        <rect x="36" y="10" width="17" height="35" rx="5.5" fill="url(#msTube)" />
        <rect x="39.4" y="13" width="2.8" height="28" rx="1.4" fill="#ffffff" opacity="0.42" />
        <ellipse cx="44.5" cy="11" rx="9.5" ry="3.6" fill="url(#msChrome)" />
        <ellipse cx="44.5" cy="10.4" rx="6.6" ry="2.4" fill="url(#msLens)" />
        {enabled && <ellipse cx="42" cy="9.6" rx="2.5" ry="1" fill="#ffffff" opacity="0.75" />}
      </g>
    </svg>
  );
}
