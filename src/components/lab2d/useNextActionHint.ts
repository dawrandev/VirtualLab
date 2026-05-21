"use client";

import { useLab2DStore } from "@/stores/labStore2d";

/**
 * Maps the active stage + slice of state to a single human-readable
 * instruction (methylene blue simple-stain flow):
 *   stage-1: strike → light lamp → discard match
 *   stage-2: sterilize loop ×3 → sample → pick slide → clean → NaCl → smear → re-sterilize
 *   stage-3: air-dry → flame-fix ×3
 *   stage-4: methylene blue → wash → blot → immersion oil → microscope
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
    if (!state.loop.carriesSample) return "Halqani kultura idishiga botir va namuna ol";
    if (!state.slide.onRack) return "Toza slaydni quritish ramkasiga qo'y (slayd to'plamini bos)";
    if (!state.slide.cleaned) return "Slaydni spirtli salfetka bilan tozala";
    if (!state.slide.naclApplied) return "NaCl shishasini slaydga olib bor";
    if (!state.slide.smeared) return "Halqani slaydga olib borib surtma qil";
    if (!state.loop.resterilized) return "Halqani qaytadan olov ustidan o'tkaz (qayta sterillash)";
    return "Hammasi tayyor — \"X — tekshir\"ni bos";
  }

  if (stageId === "stage-3") {
    if (!state.slide.airDried) return "Surtmani havoda quriting (tugmani bosing)";
    if (state.slide.fixPasses < 3) return `Slaydni olov ustidan o'tkaz (${state.slide.fixPasses}/3)`;
    return "Hammasi tayyor — \"X — tekshir\"ni bos";
  }

  if (stageId === "stage-4") {
    const mb = state.slide.methyleneBlue;
    if (!mb.applied) return "Metilen ko'ki bo'yog'ini slaydga olib bor";
    if (!mb.washed) return "Suv shishasini slaydga olib bor (yuvish)";
    if (!state.slide.blotted) return "Filtr qog'oz bilan slaydni quriting";
    if (!state.slide.oilApplied) return "Immersion moyini slaydga tomizing";
    return "Tayyor! Mikroskop ikonkasini bos";
  }

  return null;
}
