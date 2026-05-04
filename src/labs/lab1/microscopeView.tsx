"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useLabStore } from "@/stores/labStore";

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  opacity: number;
  hue: number;
}

function generateParticles(count: number, minSize: number, maxSize: number, baseOpacity: number): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: minSize + Math.random() * (maxSize - minSize),
    delay: Math.random() * 4,
    opacity: baseOpacity + Math.random() * 0.15,
    hue: 270 + Math.random() * 30, // purple range
  }));
}

/**
 * Microscope final view — fullscreen modal with quality-tier image
 * and procedurally drifting bacteria overlay.
 *
 * Quality tiers (from reference lines 1405-1409):
 *   high (>8.0): 28 particles, larger, opaque
 *   medium (5.0-8.0): 10 particles, mid, translucent
 *   low (<5.0): 5 particles, scattered, faint
 */
export default function MicroscopeView() {
  const t = useTranslations();
  const score = useLabStore((s) => s.state.score);
  const microscopeOpen = useLabStore((s) => s.state.microscopeOpen);
  const patch = useLabStore((s) => s.patch);
  const resetLab = useLabStore((s) => s.resetLab);
  const closeMicroscope = () =>
    patch((draft) => {
      draft.microscopeOpen = false;
    });
  const restartLab = () => {
    resetLab();
  };

  const tier = score.outOfTen >= 8.0 ? "high" : score.outOfTen >= 5.0 ? "medium" : "low";
  const particles = useMemo(() => {
    if (tier === "high") return generateParticles(28, 7, 17, 0.85);
    if (tier === "medium") return generateParticles(10, 5, 12, 0.4);
    return generateParticles(5, 6, 18, 0.2);
  }, [tier]);

  if (!microscopeOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <button
        onClick={closeMicroscope}
        className="absolute top-6 right-6 z-50 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
      >
        <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>

      <div className="relative w-[min(85vw,800px)] aspect-square">
        {/* Scope eyepiece dark vignette */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden ring-4 ring-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)]"
          style={{
            background: "radial-gradient(circle, #2b1f3a 0%, #0a0a14 75%, #000 100%)",
          }}
        >
          <TransformWrapper minScale={1} maxScale={6} initialScale={1}>
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
              <div className="relative w-full h-full">
                {/* Bacteria particles */}
                {particles.map((p) => (
                  <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                      left: `${p.left}%`,
                      top: `${p.top}%`,
                      width: `${p.size}px`,
                      height: `${p.size * 0.6}px`,
                      backgroundColor: `hsla(${p.hue}, 70%, 35%, ${p.opacity})`,
                      transform: `rotate(${p.id * 17}deg)`,
                      animation: `drift 6s ease-in-out infinite`,
                      animationDelay: `${p.delay}s`,
                      boxShadow: `0 0 4px hsla(${p.hue}, 80%, 40%, 0.4)`,
                    }}
                  />
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>

        {/* Score + finished badge + restart button */}
        <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-3 shadow-2xl text-center">
            <p className="text-xs uppercase tracking-wider text-indigo-100">
              {t("lab1.resultTitle")} — Lab tugadi!
            </p>
            <p className="text-3xl font-bold text-white">
              {t("lab1.scoreOutOf", { score: score.outOfTen.toFixed(1) })}
            </p>
          </div>
          <button
            onClick={restartLab}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 transition px-5 py-2.5 text-sm font-semibold text-white shadow-lg ring-1 ring-emerald-300/40"
          >
            Qayta boshlash
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(2px, -3px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
