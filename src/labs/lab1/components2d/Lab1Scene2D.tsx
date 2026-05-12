"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DraggableItem } from "@/components/lab2d/DraggableItem";
import { Zone } from "@/components/lab2d/ZoneRegistry";
import { useInteractionContext } from "@/components/lab2d/interactionContext";
import type { StainId } from "@/engine2d/types";
import { useLab2DStore } from "@/stores/labStore2d";
import { ZONES } from "../content/zones";

import { BacterialLoop } from "./items/BacterialLoop";
import { BiohazardBin } from "./items/BiohazardBin";
import { DryingRack } from "./items/DryingRack";
import { DyeBottle } from "./items/DyeBottle";
import { FilterPaperStack } from "./items/FilterPaperStack";
import { GlassMarker } from "./items/GlassMarker";
import { GlassSlide } from "./items/GlassSlide";
import { Match } from "./items/Match";
import { Matchbox } from "./items/Matchbox";
import { MicroscopeIcon } from "./items/MicroscopeIcon";
import { NaClBottle } from "./items/NaClBottle";
import { PetriDish } from "./items/PetriDish";
import { SlideStack } from "./items/SlideStack";
import { SpiritLamp } from "./items/SpiritLamp";
import { WashBottle } from "./items/WashBottle";
import { Drop } from "./animations/Drop";
import { Steam } from "./animations/Steam";
import { Flame } from "./animations/Flame";

const DEBUG = typeof window !== "undefined" && window.location.search.includes("debugZones");

/** Home positions for draggable items (relative to inner-stage origin). */
const HOMES = {
  matchbox: { x: 340, y: 470 },
  // Match sits lying on the matchbox; head over the strike strip so a
  // simple tap or short drag already overlaps the strike zone.
  match: { x: 350, y: 488 },
  lamp: { x: 200, y: 200 },
  loop: { x: 770, y: 380 },
  bin: { x: 60, y: 410 },
  petri: { x: 530, y: 200 },
  slideStack: { x: 620, y: 470 },
  filter: { x: 800, y: 480 },
  nacl: { x: 920, y: 70 },
  microscope: { x: 950, y: 240 },
  glassMarker: { x: 800, y: 590 },
  rack: { x: 640, y: 70 },
  // Stage 4 reagents column (left strip)
  dyeCv: { x: 30, y: 90 },
  dyeLugol: { x: 30, y: 210 },
  dyeDecolor: { x: 30, y: 330 },
  dyeSafranin: { x: 30, y: 450 },
  wash: { x: 920, y: 200 },
  // Slide on rack (rest position once picked up)
  slideOnRack: { x: 690, y: 100 },
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
  const [airDryTimer, setAirDryTimer] = useState<number | null>(null);

  const stage = config?.stages.findIndex((s) => s.id === state.currentStageId) ?? 0;
  const isStage = (n: number) => stage === n - 1;

  // Cool down loop wire after sterilization passes
  useEffect(() => {
    if (state.loop.heatLevel <= 0) return;
    const t = window.setInterval(() => {
      patchState((d) => {
        d.loop.heatLevel = Math.max(0, d.loop.heatLevel - 0.04);
      });
    }, 80);
    return () => window.clearInterval(t);
  }, [state.loop.heatLevel, patchState]);

  // Match burn-down: once lit, the stick shrinks and chars over ~8s. Beyond
  // that the match auto-extinguishes (burned=true) and visually disappears
  // on the next dispatch — keeping the workbench clean if the user forgets
  // to discard it.
  useEffect(() => {
    if (!state.match.lit || state.match.burned) return;
    const t = window.setInterval(() => {
      patchState((d) => {
        d.match.burnProgress = Math.min(1, d.match.burnProgress + 0.012);
        if (d.match.burnProgress >= 1) {
          d.match.lit = false;
          d.match.burned = true;
          // Auto-trash so it disappears once it stops burning, preventing
          // a "burnt stick clutter" UX.
          d.trash.match = true;
        }
      });
    }, 100);
    return () => window.clearInterval(t);
  }, [state.match.lit, state.match.burned, patchState]);

  // Air-dry countdown — once slide is smeared + onRack + not yet dried.
  useEffect(() => {
    if (!isStage(3)) return;
    if (state.slide.dried) {
      setAirDryTimer(null);
      return;
    }
    if (!state.slide.smeared || !state.slide.onRack) return;
    if (airDryTimer === null) setAirDryTimer(5);
    const t = window.setInterval(() => {
      setAirDryTimer((v) => {
        if (v === null) return null;
        if (v <= 1) {
          window.clearInterval(t);
          dispatchStep("air-dry");
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.slide.smeared, state.slide.onRack, state.slide.dried, stage]);

  /** Match drop/tap unified handler. Reads fresh state between dispatches so
   *  one user gesture can advance several steps in a row (e.g., strike +
   *  light in one drag onto the lamp). */
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
      if (!overLamp && !overBin) return; // user tapped at home — done.
    }

    if (s.match.lit && overLamp && !s.lamp.lit) {
      if (!s.lamp.uncapped) {
        dispatchStep("open-lamp");
        s = fresh();
      }
      dispatchStep("light-lamp");
      return;
    }

    if (s.match.lit && s.lamp.lit && overBin) {
      dispatchStep("discard-match");
      setBinBump((k) => k + 1);
    }
  }

  const onMatchDrop = handleMatch;
  const onMatchTap = handleMatch;

  function onLampTap() {
    if (!isStage(1)) return;
    if (!state.lamp.uncapped) {
      dispatchStep("open-lamp");
    }
  }

  function onLoopDrop(zone: string | null) {
    if (isStage(1)) {
      if (zone === "lamp-flame" && state.lamp.lit) {
        dispatchStep("sterilize-loop");
      }
      return;
    }
    if (isStage(2)) {
      if (zone === "petri-source" && state.loop.sterilizePasses >= 3 && !state.loop.carriesSample) {
        dispatchStep("take-sample");
      } else if ((zone === "rack-top" || zone === "slide-on-rack") && state.loop.carriesSample) {
        dispatchStep("smear-sample");
      }
      return;
    }
  }

  function onSlideStackTap() {
    if (!isStage(2)) return;
    if (state.slide.onRack) return;
    dispatchStep("pick-slide");
  }

  function onNaClDrop(zone: string | null) {
    if (!isStage(2)) return;
    if ((zone === "rack-top" || zone === "slide-on-rack") && state.slide.onRack && !state.slide.naclApplied) {
      setNaclDropTrigger((k) => k + 1);
      window.setTimeout(() => dispatchStep("add-nacl"), 350);
    }
  }

  function onSlideDrop(zone: string | null) {
    if (!isStage(3)) return;
    if (!state.slide.dried) return;
    if (zone === "lamp-flame" && state.slide.fixPasses < 3) {
      dispatchStep("flame-fix");
    }
  }

  function onDyeDrop(variant: StainId, zone: string | null) {
    if (!isStage(4)) return;
    if (zone !== "rack-top" && zone !== "slide-on-rack") return;
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
    if (zone !== "rack-top" && zone !== "slide-on-rack") return;
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
      return;
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
      {/* Optional debug overlay for zones */}
      {DEBUG &&
        (Object.keys(ZONES) as Array<keyof typeof ZONES>).map((id) => (
          <Zone key={id} id={id} rect={ZONES[id]} debug />
        ))}

      {/* Register zones (no debug) */}
      {!DEBUG &&
        (Object.keys(ZONES) as Array<keyof typeof ZONES>).map((id) => (
          <Zone key={id} id={id} rect={ZONES[id]} />
        ))}

      {/* === Static, non-draggable furniture === */}
      {/* Drying rack */}
      <div style={{ position: "absolute", left: HOMES.rack.x, top: HOMES.rack.y }}>
        <DryingRack />
      </div>

      {/* Petri-source dish (decorative, used as zone for sample pick-up) */}
      <div style={{ position: "absolute", left: HOMES.petri.x, top: HOMES.petri.y }}>
        <PetriDish
          sampled={state.loop.carriesSample || isStage(3) || isStage(4)}
          label="Kultura"
        />
      </div>

      {/* Slide stack (tap to pick) */}
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
          <SlideStack remaining={state.slide.onRack ? 4 : 5} />
        </button>
      )}

      {/* Filter paper stack */}
      <div style={{ position: "absolute", left: HOMES.filter.x, top: HOMES.filter.y }}>
        <FilterPaperStack />
      </div>

      {/* Glass marker (decorative label) */}
      <div style={{ position: "absolute", left: HOMES.glassMarker.x, top: HOMES.glassMarker.y }}>
        <GlassMarker />
      </div>

      {/* === Lamp (tap to open cap; the rest is a static landmark) === */}
      <button
        aria-label="lamp"
        onClick={onLampTap}
        style={{
          position: "absolute",
          left: HOMES.lamp.x,
          top: HOMES.lamp.y,
          border: "none",
          background: "transparent",
          cursor: "inherit",
        }}
        onPointerEnter={() => {
          if (isStage(1) && !state.lamp.uncapped) interaction.setTooltip("Qopqoqni och");
        }}
        onPointerLeave={() => interaction.setTooltip(null)}
      >
        <SpiritLamp uncapped={state.lamp.uncapped} lit={state.lamp.lit} />
      </button>

      {/* === Matchbox (decorative; opens when match is taken) === */}
      <div style={{ position: "absolute", left: HOMES.matchbox.x, top: HOMES.matchbox.y }}>
        <Matchbox open={isStage(1)} />
      </div>

      {/* === Match (draggable for stage 1) ===
          tipX/tipY = the burning head (left edge of the stick). */}
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
              : !state.lamp.uncapped
              ? "Avval lampa qopqog'ini och"
              : !state.lamp.lit
              ? "Piltaga olib bor"
              : "Biohazardga tashla"
          }
          onDrop={onMatchDrop}
          onTap={onMatchTap}
        >
          <Match
            burnProgress={state.match.burnProgress}
            lit={state.match.lit}
            burned={state.match.burned}
          />
        </DraggableItem>
      )}

      {/* === Bacterial loop ===
          tip = wire ring at the left edge of the SVG. */}
      <DraggableItem
        id="loop"
        homeX={HOMES.loop.x}
        homeY={HOMES.loop.y}
        width={220}
        height={22}
        tipX={10}
        tipY={11}
        disabled={isStage(4)}
        tooltipKey={
          isStage(1)
            ? state.loop.sterilizePasses < 3
              ? "Olovdan o'tkaz"
              : "Sterilizatsiya tugadi"
            : isStage(2)
            ? !state.loop.carriesSample
              ? "Kultura ol"
              : "Slaydga surt"
            : null
        }
        counterValue={isStage(1) ? state.loop.sterilizePasses : null}
        onDrop={onLoopDrop}
      >
        <BacterialLoop heatLevel={state.loop.heatLevel} />
      </DraggableItem>

      {/* === Biohazard bin === */}
      <div style={{ position: "absolute", left: HOMES.bin.x, top: HOMES.bin.y }}>
        <BiohazardBin bumpKey={binBump} />
      </div>

      {/* === NaCl bottle (drag onto slide on rack) ===
          tip = dropper bulb at the top of the bottle. */}
      <DraggableItem
        id="nacl"
        homeX={HOMES.nacl.x}
        homeY={HOMES.nacl.y}
        width={50}
        height={100}
        tipX={25}
        tipY={22}
        disabled={!isStage(2)}
        tooltipKey={isStage(2) && !state.slide.naclApplied ? "Slaydga tomchi tashla" : null}
        onDrop={onNaClDrop}
      >
        <NaClBottle />
      </DraggableItem>

      {/* === Glass slide (only visible once on rack) === */}
      {state.slide.onRack && (
        <DraggableItem
          id="slide"
          homeX={HOMES.slideOnRack.x}
          homeY={HOMES.slideOnRack.y}
          width={110}
          height={36}
          disabled={!isStage(3)}
          tooltipKey={
            isStage(3) && state.slide.dried && state.slide.fixPasses < 3 ? "Olov ustidan o'tkaz" : null
          }
          counterValue={isStage(3) && state.slide.dried ? state.slide.fixPasses : null}
          onDrop={onSlideDrop}
          returnHome
        >
          <GlassSlide
            naclApplied={state.slide.naclApplied}
            smeared={state.slide.smeared}
            smearRotations={state.slide.smearRotations}
            dried={state.slide.dried}
            fixPasses={state.slide.fixPasses}
            stains={state.slide.stains}
          />
        </DraggableItem>
      )}

      {/* Drop animations layered above the slide */}
      <div style={{ position: "absolute", left: HOMES.slideOnRack.x + 40, top: HOMES.slideOnRack.y - 60, pointerEvents: "none" }}>
        <Drop trigger={naclDropTrigger} color="#88c5d8" />
        <Drop trigger={stainDropTrigger} color={activeStainColor} fallHeight={60} />
      </div>

      {/* Steam over slide while drying */}
      {airDryTimer !== null && airDryTimer > 0 && (
        <div style={{ position: "absolute", left: HOMES.slideOnRack.x + 55, top: HOMES.slideOnRack.y - 80, pointerEvents: "none" }}>
          <Steam active />
        </div>
      )}
      {airDryTimer !== null && airDryTimer > 0 && (
        <div
          className="absolute rounded-full bg-amber-300 text-xs font-bold text-slate-900 grid place-items-center shadow"
          style={{ left: HOMES.slideOnRack.x + 110, top: HOMES.slideOnRack.y - 38, width: 32, height: 32 }}
        >
          {airDryTimer}s
        </div>
      )}

      {/* === Stage 4 dye bottles + wash bottle === */}
      {isStage(4) && (
        <>
          <DraggableItem
            id="dye-cv"
            homeX={HOMES.dyeCv.x}
            homeY={HOMES.dyeCv.y}
            width={44}
            height={92}
            tooltipKey="1: Genzian-binafsha"
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
            tooltipKey="2: Lyugol"
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
            tooltipKey="3: 96% etanol"
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
            tooltipKey="4: Safranin"
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
            tooltipKey="Yuvish"
            onDrop={onWashDrop}
          >
            <WashBottle />
          </DraggableItem>
        </>
      )}

      {/* Microscope icon (always rendered; only enabled in stage 4 after wash) */}
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

      {/* "Far" flame attached to lamp wick — for visual reference of where to drag */}
      <AnimatePresence>
        {state.lamp.lit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>
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
