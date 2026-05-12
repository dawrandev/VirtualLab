"use client";

import { useLab2DStore } from "@/stores/labStore2d";

/**
 * Derives a single human-readable hint for the next required action,
 * given the current state and active stage. Returned as plain Uzbek
 * (no i18n key) so it can render without a translator round-trip and
 * remains easy to audit by domain experts. Returns `null` if the active
 * stage is already check-ready.
 */
export function useNextActionHint(): string | null {
  const state = useLab2DStore((s) => s.state);
  const stageId = state.currentStageId;

  if (stageId === "stage-1") {
    if (!state.match.struck) return "Gugurtni gugurt qutisiga sura (yoki bos)";
    if (!state.lamp.uncapped) return "Spirtli lampa qopqog'ini bosib och";
    if (!state.lamp.lit) return "Yonayotgan gugurtni piltaga olib bor";
    if (!state.trash.match) return "Yonayotgan gugurtni biohazard chelagiga tashla";
    if (state.loop.sterilizePasses < 3)
      return `Bakterial halqani alanga ostidan o'tkaz (${state.loop.sterilizePasses}/3)`;
    return "Hammasi tayyor — \"X — tekshir\"ni bos";
  }

  if (stageId === "stage-2") {
    if (!state.slide.onRack) return "Toza slaydni olib quritish ramkasiga qo'y";
    if (!state.slide.naclApplied) return "NaCl 0.9% pipetkasini slaydga olib bor";
    if (!state.loop.carriesSample) return "Halqani Kultura petrisiga botir";
    if (state.slide.smearRotations < 3)
      return `Halqa bilan slaydga surtma qil (${state.slide.smearRotations}/3)`;
    return "Hammasi tayyor — \"X — tekshir\"ni bos";
  }

  if (stageId === "stage-3") {
    if (!state.slide.dried) return "Slayd quritilmoqda — kut (havoda 5 soniya)";
    if (state.slide.fixPasses < 3)
      return `Slaydni olov ustidan o'tkaz (${state.slide.fixPasses}/3)`;
    return "Hammasi tayyor — \"X — tekshir\"ni bos";
  }

  if (stageId === "stage-4") {
    const s = state.slide.stains;
    if (!s.cv.applied) return "1) Gentsian-binafsha bo'yog'ini slaydga olib bor";
    if (!s.cv.washed) return "Suv shishasini slayd ustida yuvgani olib bor";
    if (!s.lugol.applied) return "2) Lugol bo'yog'ini slaydga olib bor";
    if (!s.lugol.washed) return "Yana suv bilan yuv";
    if (!s.decolor.applied) return "3) 96% etanol bilan rangsizlantir";
    if (!s.safranin.applied) return "4) Safranin bilan qarshi bo'yash";
    if (!s.safranin.washed) return "Oxirgi marta suv bilan yuv";
    return "Tayyor! Mikroskop ikonkasini bos";
  }

  return null;
}
