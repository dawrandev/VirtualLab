"use client";

interface Props {
  /** 0..1 heat level. 0 = cool grey wire, 1 = bright orange-red glow. */
  heatLevel: number;
}

/**
 * Long handle bacterial inoculation loop (white plastic + thin black wire +
 * circular wire loop at the tip). Wire color lerps with heat. A soft halo
 * filter intensifies at high heat. Reference frames 15-19.
 */
export function BacterialLoop({ heatLevel }: Props) {
  const clamp = Math.max(0, Math.min(1, heatLevel));
  const wire = lerpColor("#4a4a4a", "#ff5a1a", clamp);
  const glow = clamp > 0.05 ? `drop-shadow(0 0 ${4 + 12 * clamp}px rgba(255,${110 - clamp * 60},20,${0.4 + clamp * 0.5}))` : "none";

  return (
    <div style={{ position: "relative", width: 220, height: 22 }}>
      <svg width="220" height="22" viewBox="0 0 220 22" style={{ filter: glow }}>
        <defs>
          <linearGradient id="loopHandle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f3f3f3" />
            <stop offset="55%" stopColor="#dcdcdc" />
            <stop offset="100%" stopColor="#909090" />
          </linearGradient>
        </defs>
        {/* Handle */}
        <rect x="80" y="6" width="135" height="10" rx="5" fill="url(#loopHandle)" stroke="#5a5a5a" strokeWidth="0.8" />
        {/* Ferrule */}
        <rect x="72" y="7" width="12" height="8" rx="1.5" fill="#bdc3c7" stroke="#5a5a5a" strokeWidth="0.6" />
        {/* Wire */}
        <line x1="14" y1="11" x2="72" y2="11" stroke={wire} strokeWidth="1.8" strokeLinecap="round" />
        {/* Loop ring (open circle) */}
        <circle cx="10" cy="11" r="5" stroke={wire} strokeWidth="1.8" fill="none" />
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
