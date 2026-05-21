"use client";

interface Props {
  /** 0..1 heat level. 0 = cool grey wire, 1 = bright orange-red glow. */
  heatLevel: number;
}

/**
 * Bacteriological inoculation loop — modelled on the KazNMU virtual-lab
 * reference: a slim black handle with a metal ferrule, a thin straight wire
 * and a small circular wire ring at the tip. The wire + ring lerp from grey to
 * glowing orange-red with heat and gain a soft halo.
 */
export function BacterialLoop({ heatLevel }: Props) {
  const clamp = Math.max(0, Math.min(1, heatLevel));
  const wire = lerpColor("#5a5f66", "#ff5a1a", clamp);
  const glow = clamp > 0.05 ? `drop-shadow(0 0 ${4 + 12 * clamp}px rgba(255,${110 - clamp * 60},20,${0.4 + clamp * 0.5}))` : "drop-shadow(0 2px 3px rgba(0,0,0,0.28))";

  return (
    <div style={{ position: "relative", width: 220, height: 22 }}>
      <svg width="220" height="22" viewBox="0 0 220 22" style={{ filter: glow, overflow: "visible" }}>
        <defs>
          <linearGradient id="loopHandleBlk" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a4d52" />
            <stop offset="35%" stopColor="#26282c" />
            <stop offset="100%" stopColor="#0c0d0f" />
          </linearGradient>
          <linearGradient id="loopFerrule" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8edf0" />
            <stop offset="50%" stopColor="#aab2b8" />
            <stop offset="100%" stopColor="#7c848a" />
          </linearGradient>
        </defs>

        {/* Black handle */}
        <rect x="80" y="5" width="136" height="12" rx="6" fill="url(#loopHandleBlk)" stroke="#000" strokeWidth="0.5" />
        {/* Handle highlight */}
        <rect x="86" y="7" width="120" height="2.4" rx="1.2" fill="#ffffff" opacity="0.22" />
        {/* End cap */}
        <circle cx="214" cy="11" r="3" fill="#16181b" />

        {/* Metal ferrule */}
        <rect x="70" y="6.5" width="13" height="9" rx="2" fill="url(#loopFerrule)" stroke="#6c747a" strokeWidth="0.5" />

        {/* Wire */}
        <line x1="14" y1="11" x2="70" y2="11" stroke={wire} strokeWidth="1.7" strokeLinecap="round" />
        {/* Loop ring (open circle at the tip) */}
        <circle cx="9" cy="11" r="5" stroke={wire} strokeWidth="1.7" fill="none" />
      </svg>
    </div>
  );
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`;
}
function parseHex(h: string): [number, number, number] {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}
