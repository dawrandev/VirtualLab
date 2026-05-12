"use client";

import { useEffect, useState } from "react";
import { DraggableItem } from "@/components/lab2d/DraggableItem";
import { Zone } from "@/components/lab2d/ZoneRegistry";
import { useInteractionContext } from "@/components/lab2d/interactionContext";
import type { StainId } from "@/engine2d/types";
import { useLab2DStore } from "@/stores/labStore2d";
import { ZONES } from "../content/zones";

import { BacterialLoop } from "./items/BacterialLoop";
import { BiohazardBin } from "./items/BiohazardBin";
import { CultureDish } from "./items/CultureDish";
import { DryingRack } from "./items/DryingRack";
import { DyeBottle } from "./items/DyeBottle";
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
import { Drop } from "./animations/Drop";

const DEBUG = typeof window !== "undefined" && window.location.search.includes("debugZones");

/** Reference-aligned home positions inside the inner stage. */
const HOMES = {
  // Furniture
  rack: { x: 620, y: 70 }, // wraps both tiers
  cultureDish: { x: 40, y: 410 }, // bottom-left, below lamp
  matchbox: { x: 340, y: 480 },
  lamp: { x: 210, y: 220 },
  // Items
  match: { x: 350, y: 498 }, // tip lives inside the matchbox-strike zone
  loop: { x: 720, y: 100 }, // resting on top tier of the rack
  bin: { x: 250, y: 540 },
  slideStack: { x: 480, y: 540 },
  filter: { x: 800, y: 480 },
  nacl: { x: 920, y: 80 },
  microscope: { x: 950, y: 240 },
  glassMarker: { x: 800, y: 600 },
  slideOnRack: { x: 690, y: 188 },
  // Stage 4 reagents
  dyeCv: { x: 30, y: 90 },
  dyeLugol: { x: 30, y: 210 },
  dyeDecolor: { x: 30, y: 330 },
  dyeSafranin: { x: 30, y: 450 },
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

  const [naclDropTrigger, setNaclDropTrigger] = useState(0);
  const [stainDropTrigger, setStainDropTrigger] = useState(0);
  const [activeStainColor, setActiveStainColor] = useState<string>("#5b2e8c");
  const [binBump, setBinBump] = useState(0);

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

  // Match burn progress — slow visual char/shrink while held. Caps at 0.7
  // so the match never burns out in the user's hand; it's only consumed
  // when explicitly discarded (or after the lamp is lit, with extra time).
  useEffect(() => {
    if (!state.match.lit || state.match.burned) return;
    const ramp = state.lamp.lit ? 0.018 : 0.008; // faster after lamp lit
    const cap = state.lamp.lit ? 1.0 : 0.7; // keep alive while user is still working
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

  // If the match was discarded/burned before Stage 1 completed, spawn a
  // fresh match so the user can retry without hitting "Заново".
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
      dispatchStep("light-lamp");
      return;
    }

    if (s.match.lit && s.lamp.lit && overBin) {
      dispatchStep("discard-match");
      setBinBump((k) => k + 1);
    }
  }

  function onLoopDrop(zone: string | null) {
    if (isStage(2)) {
      if (zone === "lamp-flame" && state.lamp.lit && state.loop.sterilizePasses < 3) {
        dispatchStep("sterilize-loop");
        return;
      }
      if (
        zone === "culture-dish" &&
        state.loop.sterilizePasses >= 3 &&
        !state.loop.carriesSample
      ) {
        dispatchStep("take-sample");
        return;
      }
      if (
        (zone === "rack-slide" || zone === "slide-on-rack") &&
        state.loop.carriesSample &&
        state.slide.onRack &&
        state.slide.naclApplied
      ) {
        dispatchStep("smear-sample");
        return;
      }
    }
  }

  function onSlideStackTap() {
    if (!isStage(2)) return;
    if (state.slide.onRack) return;
    dispatchStep("pick-slide");
  }

  function onNaClDrop(zone: string | null) {
    if (!isStage(2)) return;
    if (
      (zone === "rack-slide" || zone === "slide-on-rack") &&
      state.slide.onRack &&
      !state.slide.naclApplied
    ) {
      setNaclDropTrigger((k) => k + 1);
      window.setTimeout(() => dispatchStep("add-nacl"), 350);
    }
  }

  function onSlideDrop(zone: string | null) {
    if (!isStage(3)) return;
    if (zone === "lamp-flame" && state.slide.fixPasses < 3) {
      dispatchStep("flame-fix");
    }
  }

  function onDyeDrop(variant: StainId, zone: string | null) {
    if (!isStage(4)) return;
    if (zone !== "rack-slide" && zone !== "slide-on-rack") return;
    const c = colorForStain(variant);
    if (variant === "cv" && !state.slide.stains.cv.applied) {
      setActiveStainColor(c);
      setStainDropTrigger((k) => k + 1);
      window.setTimeout(() => dispatchStep("stain-cv"), 250);
    } else if (variant === "lugol" && state.slide.stains.cv.washed && !state.slide.stains.lugol.applied) {
      setActiveStainColor(c);
      setStainDropTrigger((k) => k + 1);
      window.setTimeout(() => dispatchStep("stain-lugol"), 250);
    } else if (variant === "decolor" && state.slide.stains.lugol.washed && !state.slide.stains.decolor.applied) {
      setActiveStainColor(c);
      setStainDropTrigger((k) => k + 1);
      window.setTimeout(() => dispatchStep("stain-decolor"), 250);
    } else if (variant === "safranin" && state.slide.stains.decolor.applied && !state.slide.stains.safranin.applied) {
      setActiveStainColor(c);
      setStainDropTrigger((k) => k + 1);
      window.setTimeout(() => dispatchStep("stain-safranin"), 250);
    } else {
      pushError("lab1.error.gramOrder");
    }
  }

  function onWashDrop(zone: string | null) {
    if (!isStage(4)) return;
    if (zone !== "rack-slide" && zone !== "slide-on-rack") return;
    if (state.slide.stains.cv.applied && !state.slide.stains.cv.washed) {
      dispatchStep("wash-cv");
      return;
    }
    if (state.slide.stains.lugol.applied && !state.slide.stains.lugol.washed) {
      dispatchStep("wash-lugol");
      return;
    }
    if (state.slide.stains.safranin.applied && !state.slide.stains.safranin.washed) {
      dispatchStep("wash-safranin");
    }
  }

  function onMicroscopeTap() {
    if (!isStage(4)) return;
    if (!state.slide.stains.safranin.washed) {
      pushError("lab1.error.notStained");
      return;
    }
    setMicroscopeOpen(true);
    dispatchStep("open-microscope");
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Zones — always registered; debug overlay when ?debugZones */}
      {(Object.keys(ZONES) as Array<keyof typeof ZONES>).map((id) => (
        <Zone key={id} id={id} rect={ZONES[id]} debug={DEBUG} />
      ))}

      {/* Two-tier drying rack (static furniture) */}
      <div style={{ position: "absolute", left: HOMES.rack.x, top: HOMES.rack.y }}>
        <DryingRack />
      </div>

      {/* Culture dish (bottom-left, replaces previous Kultura petri) */}
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

      {/* Filter paper stack */}
      <div style={{ position: "absolute", left: HOMES.filter.x, top: HOMES.filter.y }}>
        <FilterPaperStack />
      </div>

      {/* Glass marker (decoration) */}
      <div style={{ position: "absolute", left: HOMES.glassMarker.x, top: HOMES.glassMarker.y }}>
        <GlassMarker />
      </div>

      {/* Spirit lamp (decorative, click-free now — light-lamp folds into match drag) */}
      <div
        style={{ position: "absolute", left: HOMES.lamp.x, top: HOMES.lamp.y }}
        aria-label="lamp"
      >
        <SpiritLamp uncapped={state.lamp.uncapped} lit={state.lamp.lit} />
      </div>

      {/* Matchbox (decorative, drawer always open during stage 1) */}
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
            !state.match.struck
              ? "Gugurtni qutiga ishqala"
              : !state.lamp.lit
              ? "Lampaga olib bor"
              : "Biohazardga tashla"
          }
          onDrop={handleMatch}
          onTap={handleMatch}
        >
          <Match
            burnProgress={state.match.burnProgress}
            lit={state.match.lit}
            burned={state.match.burned}
          />
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
            ? state.loop.sterilizePasses < 3
              ? "Olov ustidan o'tkaz"
              : !state.loop.carriesSample
              ? "Kultura idishidan namuna ol"
              : "Slaydga surtma qil"
            : null
        }
        counterValue={
          isStage(2) && state.loop.sterilizePasses < 3 ? state.loop.sterilizePasses : null
        }
        onDrop={onLoopDrop}
      >
        <BacterialLoop heatLevel={state.loop.heatLevel} />
      </DraggableItem>

      {/* Biohazard bin */}
      <div style={{ position: "absolute", left: HOMES.bin.x, top: HOMES.bin.y }}>
        <BiohazardBin bumpKey={binBump} />
      </div>

      {/* NaCl spray bottle */}
      <DraggableItem
        id="nacl"
        homeX={HOMES.nacl.x}
        homeY={HOMES.nacl.y}
        width={50}
        height={100}
        tipX={25}
        tipY={20}
        disabled={!isStage(2) || !state.slide.onRack || state.slide.naclApplied}
        tooltipKey={
          isStage(2) && state.slide.onRack && !state.slide.naclApplied
            ? "Slaydga purkash"
            : null
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
          tooltipKey={isStage(3) && state.slide.fixPasses < 3 ? "Olov ustidan o'tkaz" : null}
          counterValue={isStage(3) && state.slide.fixPasses < 3 ? state.slide.fixPasses : null}
          onDrop={onSlideDrop}
        >
          <GlassSlide
            naclApplied={state.slide.naclApplied}
            smeared={state.slide.smeared}
            smearRotations={state.slide.smeared ? 3 : 0}
            dried={true}
            fixPasses={state.slide.fixPasses}
            stains={state.slide.stains}
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
        <Drop trigger={stainDropTrigger} color={activeStainColor} fallHeight={60} />
      </div>

      {/* Stage 4 reagents */}
      {isStage(4) && (
        <>
          <DraggableItem
            id="dye-cv"
            homeX={HOMES.dyeCv.x}
            homeY={HOMES.dyeCv.y}
            width={44}
            height={92}
            tipX={22}
            tipY={20}
            tooltipKey="1) Gentsian"
            onDrop={(z) => onDyeDrop("cv", z)}
          >
            <DyeBottle variant="cv" />
          </DraggableItem>
          <DraggableItem
            id="dye-lugol"
            homeX={HOMES.dyeLugol.x}
            homeY={HOMES.dyeLugol.y}
            width={44}
            height={92}
            tipX={22}
            tipY={20}
            tooltipKey="2) Lyugol"
            onDrop={(z) => onDyeDrop("lugol", z)}
          >
            <DyeBottle variant="lugol" />
          </DraggableItem>
          <DraggableItem
            id="dye-decolor"
            homeX={HOMES.dyeDecolor.x}
            homeY={HOMES.dyeDecolor.y}
            width={44}
            height={92}
            tipX={22}
            tipY={20}
            tooltipKey="3) Etanol"
            onDrop={(z) => onDyeDrop("decolor", z)}
          >
            <DyeBottle variant="decolor" />
          </DraggableItem>
          <DraggableItem
            id="dye-safranin"
            homeX={HOMES.dyeSafranin.x}
            homeY={HOMES.dyeSafranin.y}
            width={44}
            height={92}
            tipX={22}
            tipY={20}
            tooltipKey="4) Safranin"
            onDrop={(z) => onDyeDrop("safranin", z)}
          >
            <DyeBottle variant="safranin" />
          </DraggableItem>
          <DraggableItem
            id="wash"
            homeX={HOMES.wash.x}
            homeY={HOMES.wash.y}
            width={56}
            height={100}
            tipX={28}
            tipY={20}
            tooltipKey="Yuvish"
            onDrop={onWashDrop}
          >
            <WashBottle />
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
          if (isStage(4) && state.slide.stains.safranin.washed) interaction.setTooltip("Mikroskop ostida ko'r");
        }}
        onPointerLeave={() => interaction.setTooltip(null)}
      >
        <MicroscopeIcon enabled={isStage(4) && state.slide.stains.safranin.washed} />
      </button>
    </div>
  );
}

function colorForStain(s: StainId): string {
  switch (s) {
    case "cv":
      return "#5b2e8c";
    case "lugol":
      return "#a26b1f";
    case "decolor":
      return "#cbd5da";
    case "safranin":
      return "#cc3a55";
  }
}
