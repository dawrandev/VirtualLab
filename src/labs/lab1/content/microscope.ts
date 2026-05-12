import type { Lab2DState, MicroscopeResult } from "@/engine2d/types";

/** Map state → microscope outcome (Gram +/-, quality). */
export function microscopeResult(state: Lab2DState): MicroscopeResult {
  const cv = state.slide.stains.cv;
  const safranin = state.slide.stains.safranin;
  const fixed = state.slide.fixPasses >= 3;
  const smeared = state.slide.smeared;
  // Decolorizer step is what differentiates Gram+ vs Gram-; track it
  // independently of the legacy "smearRotations" field which no longer exists.
  if (!smeared || !fixed) {
    return {
      gramOutcome: "ambiguous",
      qualityTier: "low",
      notes: [
        "Surtma yetarli darajada qotirilmagan yoki tayyorlanmagan.",
        "Mikroskop ostida hujayralar deyarli ko'rinmaydi.",
      ],
    };
  }

  const score = state.score.outOfTen;
  const properGramSequence =
    cv.applied && state.slide.stains.lugol.applied && state.slide.stains.decolor.applied && safranin.applied;

  if (!properGramSequence) {
    return {
      gramOutcome: "ambiguous",
      qualityTier: "low",
      notes: [
        "Bo'yash bosqichlari to'liq emas. To'rt reagentni tartibida qo'llang.",
      ],
    };
  }

  // High score → high quality; safranin dominant on washed-CV slide → Gram negative
  const cvDominant = cv.washed === false || (cv.applied && !state.slide.stains.decolor.applied);
  const qualityTier = score >= 8 ? "high" : score >= 5 ? "medium" : "low";
  return {
    gramOutcome: cvDominant ? "positive" : "negative",
    qualityTier,
    notes: [
      cvDominant
        ? "Hujayralar binafsha-ko'k bo'yalgan — Gram-musbat (Gr+)."
        : "Hujayralar pushti-qizg'ish bo'yalgan — Gram-manfiy (Gr−).",
      qualityTier === "high"
        ? "Tayyorlash sifati a'lo darajada."
        : qualityTier === "medium"
        ? "Tayyorlashda biroz nuqson bor."
        : "Sifat past — protokolni qayta o'qib chiqing.",
    ],
  };
}
