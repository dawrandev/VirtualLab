"use client";

import { useEffect, useState } from "react";
import { DraggableItem } from "@/components/lab2d/DraggableItem";
import { Zone } from "@/components/lab2d/ZoneRegistry";
import { useInteractionContext } from "@/components/lab2d/interactionContext";
import { useZoomController, type ZoomViewId } from "@/components/lab2d/ZoomController";
import { useLab2DStore } from "@/stores/labStore2d";
import { ZONES } from "../content/zones";

import { BacterialLoop } from "./items/BacterialLoop";
import { BiohazardBin } from "./items/BiohazardBin";
import { CultureDish } from "./items/CultureDish";
import { DryingRack } from "./items/DryingRack";
import { FilterPaperStack } from "./items/FilterPaperStack";
import { GlassMarker } from "./items/GlassMarker";
import { GlassSlide } from "./items/GlassSlide";
import { Match } from "./items/Match";
import { Matchbox } from "./items/Matchbox";
import { MicroscopeIcon } from "./items/MicroscopeIcon";
import { NaClBottle } from "./items/NaClBottle";
import { SlideStack } from "./items/SlideStack";
import { SpiritLamp } from "./items/SpiritLamp";
import { WashBottle } from "./items/WashBottle";
import { MethyleneBlueBottle } from "./items/MethyleneBlueBottle";
import { ImmersionOilBottle } from "./items/ImmersionOilBottle";
import { FilterPaper } from "./items/FilterPaper";
import { AlcoholPad } from "./items/AlcoholPad";
import { Drop } from "./animations/Drop";

const DEBUG = typeof window !== "undefined" && window.location.search.includes("debugZones");

/** Reference-aligned home positions inside the inner stage. */
const HOMES = {
  // Furniture
  rack: { x: 620, y: 70 },
  cultureDish: { x: 40, y: 410 },
  matchbox: { x: 340, y: 480 },
  lamp: { x: 210, y: 220 },
  // Items
  match: { x: 350, y: 498 },
  loop: { x: 720, y: 100 },
  bin: { x: 250, y: 540 },
  slideStack: { x: 480, y: 540 },
  filter: { x: 800, y: 480 },
  nacl: { x: 920, y: 80 },
  microscope: { x: 950, y: 240 },
  glassMarker: { x: 800, y: 600 },
  slideOnRack: { x: 690, y: 188 },
  // Stage-2 cleaning
  alcoholPad: { x: 900, y: 470 },
  // Stage-4 reagents (single methylene blue + wash + filter + oil)
  mb: { x: 30, y: 110 },
  oil: { x: 30, y: 300 },
  filterTool: { x: 805, y: 470 },
  wash: { x: 920, y: 200 },
};

export function Lab1Scene2D() {
  const state = useLab2DStore((s) => s.state);
  const config = useLab2DStore((s) => s.config);
  const dispatchStep = useLab2DStore((s) => s.dispatchStep);
  const patchState = useLab2DStore((s) => s.patchState);
  const pushError = useLab2DStore((s) => s.pushError);
  const setMicroscopeOpen = useLab2DStore((s) => s.setMicroscopeOpen);
  const interaction = useInteractionContext();
  const zoom = useZoomController();

  function fireStep(id: string, zoomId?: ZoomViewId) {
    dispatchStep(id);
    if (zoomId) zoom.play(zoomId);
  }

  const [naclDropTrigger, setNaclDropTrigger] = useState(0);
  const [stainDropTrigger, setStainDropTrigger] = useState(0);
  const [stainDropColor, setStainDropColor] = useState<string>("#2746c8");
  const [binBump, setBinBump] = useState(0);
  const [airDry, setAirDry] = useState<{ active: boolean; left: number }>({ active: false, left: 0 });
  const [mbReady, setMbReady] = useState(false);
  const [mbLeft, setMbLeft] = useState(0);

  const stage = config?.stages.findIndex((s) => s.id === state.currentStageId) ?? 0;
  const isStage = (n: number) => stage === n - 1;

  // Loop wire cools after sterilization.
  useEffect(() => {
    if (state.loop.heatLevel <= 0) return;
    const t = window.setInterval(() => {
      patchState((d) => {
        d.loop.heatLevel = Math.max(0, d.loop.heatLevel - 0.04);
      });
    }, 80);
    return () => window.clearInterval(t);
  }, [state.loop.heatLevel, patchState]);

  // Match burn progress.
  useEffect(() => {
    if (!state.match.lit || state.match.burned) return;
    const ramp = state.lamp.lit ? 0.018 : 0.008;
    const cap = state.lamp.lit ? 1.0 : 0.7;
    const t = window.setInterval(() => {
      patchState((d) => {
        d.match.burnProgress = Math.min(cap, d.match.burnProgress + ramp);
        if (d.match.burnProgress >= 1) {
          d.match.lit = false;
          d.match.burned = true;
          d.trash.match = true;
        }
      });
    }, 200);
    return () => window.clearInterval(t);
  }, [state.match.lit, state.match.burned, state.lamp.lit, patchState]);

  // Re-spawn a fresh match if it was used before Stage 1 completed.
  useEffect(() => {
    if (!isStage(1)) return;
    if (!state.trash.match) return;
    if (state.lamp.lit) return;
    const t = window.setTimeout(() => {
      patchState((d) => {
        d.trash.match = false;
        d.match.struck = false;
        d.match.lit = false;
        d.match.burned = false;
        d.match.burnProgress = 0;
      });
    }, 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.trash.match, state.lamp.lit, stage]);

  // Methylene-blue contact timer (simulated): wash only after it has acted.
  useEffect(() => {
    if (state.slide.methyleneBlue.applied && !state.slide.methyleneBlue.washed) {
      setMbReady(false);
      setMbLeft(10);
      const iv = window.setInterval(() => setMbLeft((c) => Math.max(0, c - 1)), 1000);
      const to = window.setTimeout(() => setMbReady(true), 10000);
      return () => {
        window.clearInterval(iv);
        window.clearTimeout(to);
      };
    }
  }, [state.slide.methyleneBlue.applied, state.slide.methyleneBlue.washed]);

  function startAirDry() {
    const s = useLab2DStore.getState().state;
    if (s.slide.airDried || !s.slide.smeared || airDry.active) return;
    setAirDry({ active: true, left: 15 });
    const iv = window.setInterval(() => {
      setAirDry((a) => {
        if (a.left <= 1) {
          window.clearInterval(iv);
          useLab2DStore.getState().dispatchStep("air-dry");
          return { active: false, left: 0 };
        }
        return { active: true, left: a.left - 1 };
      });
    }, 1000);
  }

  function handleMatch(zone: string | null) {
    if (!isStage(1)) return;
    const fresh = () => useLab2DStore.getState().state;
    let s = fresh();
    if (s.match.burned) return;
    const overLamp = !!zone && zone.startsWith("lamp-");
    const overBin = zone === "bin";

    if (!s.match.struck) {
      dispatchStep("strike-match");
      s = fresh();
      if (!overLamp && !overBin) return;
    }
    if (s.match.lit && overLamp && !s.lamp.lit) {
      fireStep("light-lamp", "lamp-ignite");
      return;
    }
    if (s.match.lit && s.lamp.lit && overBin) {
      dispatchStep("discard-match");
      setBinBump((k) => k + 1);
    }
  }

  function onLoopDrop(zone: string | null) {
    if (!isStage(2)) return;
    const s = state;
    if (zone === "lamp-flame" && s.lamp.lit) {
      if (s.slide.smeared && !s.loop.resterilized) {
        fireStep("resterilize-loop", "flame-pass");
        return;
      }
      if (s.loop.sterilizePasses < 3 && !s.loop.carriesSample) {
        fireStep("sterilize-loop", "flame-pass");
        return;
      }
    }
    if (zone === "culture-dish" && s.loop.sterilizePasses >= 3 && !s.loop.carriesSample) {
      fireStep("take-sample", "culture-sample");
      return;
    }
    if (
      (zone === "rack-slide" || zone === "slide-on-rack") &&
      s.loop.carriesSample &&
      s.slide.onRack &&
      s.slide.naclApplied &&
      !s.slide.smeared
    ) {
      fireStep("smear-sample", "smear");
    }
  }

  function onSlideStackTap() {
    if (!isStage(2)) return;
    if (state.slide.onRack) return;
    dispatchStep("pick-slide");
  }

  function onAlcoholDrop(zone: string | null) {
    if (!isStage(2)) return;
    if (
      (zone === "rack-slide" || zone === "slide-on-rack") &&
      state.slide.onRack &&
      state.lamp.lit &&
      !state.slide.cleaned
    ) {
      dispatchStep("clean-slide");
    }
  }

  function onNaClDrop(zone: string | null) {
    if (!isStage(2)) return;
    if (
      (zone === "rack-slide" || zone === "slide-on-rack") &&
      state.slide.onRack &&
      state.slide.cleaned &&
      !state.slide.naclApplied
    ) {
      setNaclDropTrigger((k) => k + 1);
      window.setTimeout(() => fireStep("add-nacl", "nacl-drop"), 350);
    }
  }

  function onSlideDrop(zone: string | null) {
    if (!isStage(3)) return;
    if (zone === "lamp-flame" && state.slide.airDried && state.slide.fixPasses < 3) {
      fireStep("flame-fix", "flame-fix");
    }
  }

  function onMbDrop(zone: string | null) {
    if (!isStage(4)) return;
    if (zone !== "rack-slide" && zone !== "slide-on-rack") return;
    if (state.slide.fixPasses >= 3 && !state.slide.methyleneBlue.applied) {
      setStainDropColor("#2746c8");
      setStainDropTrigger((k) => k + 1);
      window.setTimeout(() => fireStep("apply-mb", "stain-mb"), 250);
    }
  }

  function onWashDrop(zone: string | null) {
    if (!isStage(4)) return;
    if (zone !== "rack-slide" && zone !== "slide-on-rack") return;
    if (state.slide.methyleneBlue.applied && !state.slide.methyleneBlue.washed) {
      if (!mbReady) {
        pushError("lab1.error.washTooEarly");
        return;
      }
      fireStep("wash-mb", "wash");
    }
  }

  function onFilterDrop(zone: string | null) {
    if (!isStage(4)) return;
    if (zone !== "rack-slide" && zone !== "slide-on-rack") return;
    if (state.slide.methyleneBlue.washed && !state.slide.blotted) {
      dispatchStep("blot-filter");
    }
  }

  function onOilDrop(zone: string | null) {
    if (!isStage(4)) return;
    if (zone !== "rack-slide" && zone !== "slide-on-rack") return;
    if (state.slide.blotted && !state.slide.oilApplied) {
      setStainDropColor("#e7b94e");
      setStainDropTrigger((k) => k + 1);
      window.setTimeout(() => dispatchStep("apply-oil"), 250);
    }
  }

  function onMicroscopeTap() {
    if (!isStage(4)) return;
    if (!state.slide.oilApplied) {
      pushError("lab1.error.noOil");
      return;
    }
    setMicroscopeOpen(true);
    dispatchStep("open-microscope");
  }

  const slideReady = state.slide.oilApplied;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {(Object.keys(ZONES) as Array<keyof typeof ZONES>).map((id) => (
        <Zone key={id} id={id} rect={ZONES[id]} debug={DEBUG} />
      ))}

      {/* Two-tier drying rack */}
      <div style={{ position: "absolute", left: HOMES.rack.x, top: HOMES.rack.y }}>
        <DryingRack />
      </div>

      {/* Culture dish */}
      <div style={{ position: "absolute", left: HOMES.cultureDish.x, top: HOMES.cultureDish.y }}>
        <CultureDish sampled={state.loop.carriesSample || state.slide.smeared} />
      </div>

      {/* Slide stack — tap to pick first slide */}
      {!state.slide.onRack && (
        <button
          aria-label="slide-stack"
          onClick={onSlideStackTap}
          style={{
            position: "absolute",
            left: HOMES.slideStack.x,
            top: HOMES.slideStack.y,
            border: "none",
            background: "transparent",
            cursor: "inherit",
          }}
          onPointerEnter={() => interaction.setTooltip("Slaydni ol")}
          onPointerLeave={() => interaction.setTooltip(null)}
        >
          <SlideStack remaining={3} />
        </button>
      )}

      {/* Filter paper stack (decoration) */}
      <div style={{ position: "absolute", left: HOMES.filter.x, top: HOMES.filter.y }}>
        <FilterPaperStack />
      </div>

      {/* Glass marker (decoration) */}
      <div style={{ position: "absolute", left: HOMES.glassMarker.x, top: HOMES.glassMarker.y }}>
        <GlassMarker />
      </div>

      {/* Spirit lamp */}
      <div style={{ position: "absolute", left: HOMES.lamp.x, top: HOMES.lamp.y }} aria-label="lamp">
        <SpiritLamp uncapped={state.lamp.uncapped} lit={state.lamp.lit} />
      </div>

      {/* Matchbox */}
      <div style={{ position: "absolute", left: HOMES.matchbox.x, top: HOMES.matchbox.y }}>
        <Matchbox open={isStage(1)} />
      </div>

      {/* Match (draggable) */}
      {!state.trash.match && (
        <DraggableItem
          id="match"
          homeX={HOMES.match.x}
          homeY={HOMES.match.y}
          width={100}
          height={32}
          tipX={20}
          tipY={16}
          disabled={!isStage(1) || state.match.burned}
          tooltipKey={
            !state.match.struck ? "Gugurtni qutiga ishqala" : !state.lamp.lit ? "Lampaga olib bor" : "Biohazardga tashla"
          }
          onDrop={handleMatch}
          onTap={handleMatch}
        >
          <Match burnProgress={state.match.burnProgress} lit={state.match.lit} burned={state.match.burned} />
        </DraggableItem>
      )}

      {/* Bacterial loop */}
      <DraggableItem
        id="loop"
        homeX={HOMES.loop.x}
        homeY={HOMES.loop.y}
        width={220}
        height={22}
        tipX={10}
        tipY={11}
        disabled={!isStage(2)}
        tooltipKey={
          isStage(2)
            ? state.slide.smeared && !state.loop.resterilized
              ? "Halqani qayta sterillang (olovga)"
              : state.loop.sterilizePasses < 3
              ? "Olov ustidan o'tkaz"
              : !state.loop.carriesSample
              ? "Kultura idishidan namuna ol"
              : "Slaydga surtma qil"
            : null
        }
        counterValue={
          isStage(2) && !state.slide.smeared && state.loop.sterilizePasses < 3 ? state.loop.sterilizePasses : null
        }
        onDrop={onLoopDrop}
      >
        <BacterialLoop heatLevel={state.loop.heatLevel} />
      </DraggableItem>

      {/* Biohazard bin */}
      <div style={{ position: "absolute", left: HOMES.bin.x, top: HOMES.bin.y }}>
        <BiohazardBin bumpKey={binBump} />
      </div>

      {/* Alcohol pad — stage 2 slide cleaning */}
      {isStage(2) && state.slide.onRack && !state.slide.cleaned && (
        <DraggableItem
          id="alcohol-pad"
          homeX={HOMES.alcoholPad.x}
          homeY={HOMES.alcoholPad.y}
          width={74}
          height={92}
          tipX={37}
          tipY={18}
          tooltipKey="Slaydni spirtli salfetka bilan tozala"
          onDrop={onAlcoholDrop}
        >
          <AlcoholPad />
        </DraggableItem>
      )}

      {/* NaCl spray bottle */}
      <DraggableItem
        id="nacl"
        homeX={HOMES.nacl.x}
        homeY={HOMES.nacl.y}
        width={50}
        height={100}
        tipX={25}
        tipY={20}
        disabled={!isStage(2) || !state.slide.onRack || !state.slide.cleaned || state.slide.naclApplied}
        tooltipKey={
          isStage(2) && state.slide.onRack && state.slide.cleaned && !state.slide.naclApplied ? "Slaydga purkash" : null
        }
        onDrop={onNaClDrop}
      >
        <NaClBottle />
      </DraggableItem>

      {/* Glass slide — visible once picked up */}
      {state.slide.onRack && (
        <DraggableItem
          id="slide"
          homeX={HOMES.slideOnRack.x}
          homeY={HOMES.slideOnRack.y}
          width={110}
          height={36}
          tipX={55}
          tipY={18}
          disabled={!isStage(3)}
          tooltipKey={isStage(3) && state.slide.airDried && state.slide.fixPasses < 3 ? "Olov ustidan o'tkaz" : null}
          counterValue={isStage(3) && state.slide.airDried && state.slide.fixPasses < 3 ? state.slide.fixPasses : null}
          onDrop={onSlideDrop}
        >
          <GlassSlide
            naclApplied={state.slide.naclApplied}
            smeared={state.slide.smeared}
            dried={state.slide.airDried}
            fixPasses={state.slide.fixPasses}
            mb={{ applied: state.slide.methyleneBlue.applied, washed: state.slide.methyleneBlue.washed }}
            oilApplied={state.slide.oilApplied}
          />
        </DraggableItem>
      )}

      {/* Drop animations */}
      <div
        style={{
          position: "absolute",
          left: HOMES.slideOnRack.x + 40,
          top: HOMES.slideOnRack.y - 60,
          pointerEvents: "none",
        }}
      >
        <Drop trigger={naclDropTrigger} color="#88c5d8" />
        <Drop trigger={stainDropTrigger} color={stainDropColor} fallHeight={60} />
      </div>

      {/* Air-dry control — stage 3, before fixation */}
      {isStage(3) && state.slide.smeared && !state.slide.airDried && (
        <button
          onClick={startAirDry}
          disabled={airDry.active}
          style={{ position: "absolute", left: 660, top: 290 }}
          className="rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-md transition hover:bg-white active:scale-95 disabled:opacity-70"
        >
          {airDry.active ? `💨 Quritilmoqda ${airDry.left}s` : "💨 Havoda quritish"}
        </button>
      )}

      {/* Methylene-blue contact countdown — stage 4 */}
      {state.slide.methyleneBlue.applied && !state.slide.methyleneBlue.washed && (
        <div
          className="absolute rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md"
          style={{ left: 660, top: 150 }}
        >
          {mbReady ? "Tayyor — endi yuving" : `Ta'sir vaqti: ${mbLeft}s`}
        </div>
      )}

      {/* Stage 4 reagents — single methylene blue + wash + filter + oil */}
      {isStage(4) && (
        <>
          <DraggableItem
            id="mb"
            homeX={HOMES.mb.x}
            homeY={HOMES.mb.y}
            width={56}
            height={120}
            tipX={28}
            tipY={10}
            tooltipKey="Metilen ko'ki bo'yog'i"
            onDrop={onMbDrop}
          >
            <MethyleneBlueBottle />
          </DraggableItem>
          <DraggableItem
            id="wash"
            homeX={HOMES.wash.x}
            homeY={HOMES.wash.y}
            width={56}
            height={100}
            tipX={28}
            tipY={20}
            tooltipKey="Distillangan suv bilan yuv"
            onDrop={onWashDrop}
          >
            <WashBottle />
          </DraggableItem>
          <DraggableItem
            id="filter"
            homeX={HOMES.filterTool.x}
            homeY={HOMES.filterTool.y}
            width={84}
            height={100}
            tipX={42}
            tipY={50}
            tooltipKey="Filtr qog'oz bilan quriting"
            onDrop={onFilterDrop}
          >
            <FilterPaper />
          </DraggableItem>
          <DraggableItem
            id="oil"
            homeX={HOMES.oil.x}
            homeY={HOMES.oil.y}
            width={50}
            height={96}
            tipX={25}
            tipY={8}
            tooltipKey="Immersion moyi tomizing"
            onDrop={onOilDrop}
          >
            <ImmersionOilBottle />
          </DraggableItem>
        </>
      )}

      {/* Microscope */}
      <button
        aria-label="microscope"
        onClick={onMicroscopeTap}
        style={{
          position: "absolute",
          left: HOMES.microscope.x,
          top: HOMES.microscope.y,
          border: "none",
          background: "transparent",
          cursor: "inherit",
        }}
        onPointerEnter={() => {
          if (isStage(4) && slideReady) interaction.setTooltip("Mikroskop ostida ko'r");
        }}
        onPointerLeave={() => interaction.setTooltip(null)}
      >
        <MicroscopeIcon enabled={isStage(4) && slideReady} />
      </button>
    </div>
  );
}
