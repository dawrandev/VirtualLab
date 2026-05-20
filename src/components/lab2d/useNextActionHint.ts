"use client";

import { useLab2DStore } from "@/stores/labStore2d";

/**
 * Maps the active stage + slice of state to a single human-readable
 * instruction. Reference-aligned (compressed) flow:
 *   stage-1: strike → light lamp → discard match
 *   stage-2: sterilize loop ×3 → sample → pick slide → NaCl → smear
 *   stage-3: flame-fix ×3
 *   stage-4: 4-step Gram + microscope
 */
export function useNextActionHint(): string | null {
  const state = useLab2DStore((s) => s.state);
  const stageId = state.currentStageId;

  if (stageId === "stage-1") {
    if (!state.match.struck) return "Gugurtni qutiga ishqala (yoki bos)";
    if (!state.lamp.lit) return "Yonayotgan gugurtni lampaga olib bor";
    if (!state.trash.match) return "Yonayotgan gugurtni biohazardga tashla";
    return "Hammasi tayyor — \"X — tekshir\"ni bos";
  }

  if (stageId === "stage-2") {
    if (state.loop.sterilizePasses < 3)
      return `Halqani olov ustidan o'tkaz (${state.loop.sterilizePasses}/3)`;
    if (!state.loop.carriesSample)
      return "Halqani kultura idishiga botir va namuna ol";
    if (!state.slide.onRack)
      return "Toza slaydni quritish ramkasiga qo'y (slayd to'plamini bos)";
    if (!state.slide.naclApplied) return "NaCl shishasini slaydga olib bor";
    if (!state.slide.smeared) return "Halqani slaydga olib borib surtma qil";
    return "Hammasi tayyor — \"X — tekshir\"ni bos";
  }

  if (stageId === "stage-3") {
    if (state.slide.fixPasses < 3)
      return `Slaydni olov ustidan o'tkaz (${state.slide.fixPasses}/3)`;
    return "Hammasi tayyor — \"X — tekshir\"ni bos";
  }

  if (stageId === "stage-4") {
    const s = state.slide.stains;
    if (!s.cv.applied) return "1) Gentsian-binafsha bo'yog'ini slaydga olib bor";
    if (!s.cv.washed) return "Suv shishasini slaydga olib bor (yuvish)";
    if (!s.lugol.applied) return "2) Lugol bo'yog'ini slaydga olib bor";
    if (!s.lugol.washed) return "Yana suv bilan yuv";
    if (!s.decolor.applied) return "3) 96% etanol bilan rangsizlantir";
    if (!s.safranin.applied) return "4) Safranin bilan qarshi bo'yash";
    if (!s.safranin.washed) return "Oxirgi marta suv bilan yuv";
    return "Tayyor! Mikroskop ikonkasini bos";
  }

  return null;
}
