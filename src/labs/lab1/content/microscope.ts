import type { Lab2DState, MicroscopeResult } from "@/engine2d/types";

/**
 * Map state → microscope outcome for the **methylene blue simple stain**.
 * A simple stain does not differentiate cell-wall types — every cell takes up
 * the blue dye — so the result is about whether cells are *resolvable* and how
 * *clean* the preparation is (smear, fixation, the single stain, blotting, oil).
 */
export function microscopeResult(state: Lab2DState): MicroscopeResult {
  const s = state.slide;
  const mb = s.methyleneBlue;
  const fixed = s.fixPasses >= 3;
  const stained = mb.applied && mb.washed;

  if (!s.smeared || !fixed || !stained) {
    return {
      cellsVisible: false,
      morphology: [],
      qualityTier: "low",
      notes: [
        "Preparat to'liq tayyorlanmagan (surtma / fiksatsiya / bo'yash yetishmaydi).",
        "Mikroskop ostida hujayralar deyarli ko'rinmaydi.",
      ],
    };
  }

  const score = state.score.outOfTen;
  const qualityTier = score >= 8 ? "high" : score >= 5 ? "medium" : "low";
  const oil = s.oilApplied;
  const notes: string[] = [
    "Barcha hujayralar bir xil ko'k rangga bo'yalgan — oddiy bo'yash usuli (metilen ko'ki).",
    "Ko'rinadigan shakllar: kokklar (to'p-to'p) va tayoqchalar (batsillalar).",
  ];
  if (!oil) {
    notes.push("Immersion moyisiz 100× obyektivda tasvir xira — moy qo'shilmagan.");
  } else if (qualityTier === "high") {
    notes.push("Immersion moyi bilan 100× da tasvir tiniq. Tayyorlash sifati a'lo.");
  } else if (qualityTier === "medium") {
    notes.push("Tasvir qoniqarli, ammo tayyorlashda biroz nuqson bor.");
  } else {
    notes.push("Sifat past — protokol bosqichlarini qayta ko'rib chiqing.");
  }

  return { cellsVisible: true, morphology: ["cocci", "rods"], qualityTier, notes };
}
