"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLab2DStore } from "@/stores/labStore2d";
import type { Lab2DState, StepId } from "@/engine2d/types";
import config from "../config2d";
import { Lab1ResultModal } from "../components2d/Lab1ResultModal";
import { Drop } from "../components2d/animations/Drop";
import { BacterialLoop } from "../components2d/items/BacterialLoop";
import { ToolSidebar } from "./ToolSidebar";
import { ITEMS, ITEM_BY_ID, intentFor, type ItemId } from "./items";

const STAGE_IDS = ["stage-1", "stage-2", "stage-3", "stage-4"] as const;
const DROP_PAD = 26;
const TICK = 70;
const HOLD_DUR = 1400; // sterilize / fix
const SAMPLE_DUR = 1900; // loop into tube
const AIRDRY_DUR = 12000; // hold slide in the air
const RUB_K = 0.0016; // rub progress per px moved
const GHOST_SCALE = 1.06; // matches the drag-ghost CSS scale

type Kind = "rub" | "hold" | "sample" | "airdry" | "instant";

interface DragState {
  id: ItemId;
  fromSidebar: boolean;
  px: number;
  py: number;
}
interface Hold {
  kind: Kind;
  target: ItemId | "air";
  intent: StepId;
  progress: number;
}
interface Fx {
  kind: "check" | "drop-nacl" | "drop-mb" | "drop-oil" | "wash";
  x: number;
  y: number;
  key: number;
}

/** What kind of interaction a (tool → target) pair is. */
function actionKind(tool: ItemId, target: ItemId): Kind {
  if (tool === "match" && target === "matchbox") return "rub"; // strike
  if (tool === "alcohol-pad" && target === "slide") return "rub"; // wipe clean
  if (tool === "loop" && target === "slide") return "rub"; // smear
  if (tool === "filter" && target === "slide") return "rub"; // blot
  if (tool === "loop" && target === "lamp") return "hold"; // sterilize / re-sterilize
  if (tool === "slide" && target === "lamp") return "hold"; // fix
  if (tool === "loop" && target === "culture") return "sample"; // insert + sample
  return "instant";
}

function holdLabel(h: Hold): string {
  switch (h.intent) {
    case "strike-match":
      return "🔥 Yoqilmoqda…";
    case "clean-slide":
      return "🧼 Artilmoqda…";
    case "smear-sample":
      return "✦ Surtilmoqda…";
    case "blot-filter":
      return "📄 Quritilmoqda…";
    case "flame-fix":
      return "🔥 Fiksatsiya…";
    case "take-sample":
      return "🧫 Namuna olinmoqda…";
    case "air-dry":
      return `💨 Havoda quritilmoqda ${Math.ceil((1 - h.progress) * (AIRDRY_DUR / 1000))}s`;
    default:
      return "🔥 Qizimoqda…";
  }
}

function nextHint(s: Lab2DState): string {
  switch (s.currentStageId) {
    case "stage-1":
      if (!s.match.struck) return "Gugurtni gugurt qutisiga olib borib ishqalang";
      if (!s.lamp.lit) return "Yonayotgan gugurtni lampaga olib boring";
      if (!s.trash.match) return "Gugurtni biohazardga tashlang";
      return "Bosqich tayyor";
    case "stage-2":
      if (s.loop.sterilizePasses < 3) return "Halqani olov ustida ushlab turing (qizigancha)";
      if (!s.loop.carriesSample) return "Halqani kultura probirkasiga soling";
      if (!s.slide.onRack) return "Buyum oynasini stolga sudrab oling";
      if (!s.slide.cleaned) return "Oynani spirtli salfetka bilan arting";
      if (!s.slide.naclApplied) return "NaCl ni oynaga tomizing";
      if (!s.slide.smeared) return "Halqani oyna ustida yurgizib surtma qiling";
      if (!s.loop.resterilized) return "Halqani qaytadan olovda ushlab sterillang";
      return "Bosqich tayyor";
    case "stage-3":
      if (!s.slide.airDried) return "Oynani ko'tarib havoda ushlab quriting (~12s)";
      if (s.slide.fixPasses < 3) return "Oynani olov ustida ushlab turing (fiksatsiya)";
      return "Bosqich tayyor";
    case "stage-4":
      if (!s.slide.methyleneBlue.applied) return "Metilen ko'kini oynaga olib boring";
      if (!s.slide.methyleneBlue.washed) return "Suv bilan yuving";
      if (!s.slide.blotted) return "Filtr qog'oz bilan oynani arting";
      if (!s.slide.oilApplied) return "Immersion moyini tomizing";
      return "Oynani mikroskopga olib boring";
    default:
      return "";
  }
}

export function Lab1Workbench() {
  const router = useRouter();
  const mountLab = useLab2DStore((s) => s.mountLab);
  const resetLab = useLab2DStore((s) => s.resetLab);
  const advanceStage = useLab2DStore((s) => s.advanceStage);
  const cfg = useLab2DStore((s) => s.config);
  const state = useLab2DStore((s) => s.state);

  const tableRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Record<string, { x: number; y: number }>>({});
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const lastPtr = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [hoverTarget, setHoverTarget] = useState<ItemId | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const holdRef = useRef<Hold | null>(null);
  holdRef.current = hold;
  const holdIv = useRef<number | null>(null);
  // After an action completes the tool stays in the hand; this prevents the
  // same target from immediately re-triggering until the pointer leaves it.
  const lockTargetRef = useRef<ItemId | "air" | null>(null);

  const [fx, setFx] = useState<Fx | null>(null);
  const fxKey = useRef(0);
  const [binBump, setBinBump] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mbReady, setMbReady] = useState(false);
  const mbReadyRef = useRef(false);
  mbReadyRef.current = mbReady;
  const [mbLeft, setMbLeft] = useState(0);

  useEffect(() => {
    mountLab(config);
  }, [mountLab]);

  useEffect(() => {
    if (!cfg) return;
    const idx = cfg.stages.findIndex((st) => st.id === state.currentStageId);
    if (idx < 0 || idx >= cfg.stages.length - 1) return;
    const stg = cfg.stages[idx];
    const rec = state.stages[state.currentStageId];
    if (rec?.status === "active" && stg.check(state).ok) advanceStage();
  }, [cfg, state, advanceStage]);

  useEffect(() => {
    const fresh =
      !state.match.struck &&
      !state.lamp.lit &&
      !state.slide.onRack &&
      state.slide.fixPasses === 0 &&
      !state.slide.methyleneBlue.applied &&
      state.score.earned === 0;
    if (fresh) setPlaced((p) => (Object.keys(p).length ? {} : p));
  }, [
    state.match.struck,
    state.lamp.lit,
    state.slide.onRack,
    state.slide.fixPasses,
    state.slide.methyleneBlue.applied,
    state.score.earned,
  ]);

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

  const flashAt = useCallback((kind: Fx["kind"], x: number, y: number) => {
    fxKey.current += 1;
    setFx({ kind, x, y, key: fxKey.current });
    window.setTimeout(() => setFx(null), 1000);
  }, []);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  /** Screen-space active point of the dragged tool (its working end). */
  function hitPoint(d: DragState, clientX: number, clientY: number) {
    const def = ITEM_BY_ID[d.id];
    return { hx: clientX + (def.tipX ?? 0) * GHOST_SCALE, hy: clientY + (def.tipY ?? 0) * GHOST_SCALE };
  }

  const targetAt = useCallback((px: number, py: number, exclude: ItemId): ItemId | null => {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    for (const [id, pos] of Object.entries(placedRef.current)) {
      const itemId = id as ItemId;
      if (itemId === exclude) continue;
      const def = ITEM_BY_ID[itemId];
      if (!def.target) continue;
      const cx = (pos.x / 100) * rect.width;
      const cy = (pos.y / 100) * rect.height;
      if (
        px >= cx - def.w / 2 - DROP_PAD &&
        px <= cx + def.w / 2 + DROP_PAD &&
        py >= cy - def.h / 2 - DROP_PAD &&
        py <= cy + def.h / 2 + DROP_PAD
      )
        return itemId;
    }
    return null;
  }, []);

  function placeOrRemove(id: ItemId, intent: StepId, clientX: number, clientY: number) {
    const rect = tableRef.current?.getBoundingClientRect();
    if (intent === "discard-match") {
      setPlaced((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
      return;
    }
    if (!rect) return;
    const x = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(6, Math.min(94, ((clientY - rect.top) / rect.height) * 100));
    setPlaced((p) => ({ ...p, [id]: { x, y } }));
  }

  function cancelHold() {
    if (holdIv.current) {
      window.clearInterval(holdIv.current);
      holdIv.current = null;
    }
    holdRef.current = null;
    setHold(null);
  }

  function completeAction(intent: StepId, target: ItemId | "air") {
    const store = useLab2DStore.getState();
    const before = store.state;
    store.dispatchStep(intent);
    const after = useLab2DStore.getState().state;
    cancelHold();
    if (after !== before) onSuccess(intent, target);
    // The tool STAYS in the hand — the student keeps holding it until they
    // release. Lock this target so it doesn't immediately re-trigger.
    lockTargetRef.current = target;
  }

  function startTimed(kind: Kind, target: ItemId | "air", intent: StepId, duration: number) {
    cancelHold();
    const h: Hold = { kind, target, intent, progress: 0 };
    holdRef.current = h;
    setHold(h);
    let p = 0;
    holdIv.current = window.setInterval(() => {
      p += TICK / duration;
      if (p >= 1) {
        completeAction(intent, target);
        return;
      }
      const nh: Hold = { kind, target, intent, progress: p };
      holdRef.current = nh;
      setHold(nh);
    }, TICK);
  }

  function startRub(target: ItemId, intent: StepId) {
    cancelHold();
    const h: Hold = { kind: "rub", target, intent, progress: 0 };
    holdRef.current = h;
    setHold(h);
  }

  const startDrag = useCallback((id: ItemId, e: React.PointerEvent) => {
    const fromSidebar = !placedRef.current[id];
    lastPtr.current = { x: e.clientX, y: e.clientY };
    lockTargetRef.current = null;
    setDrag({ id, fromSidebar, px: e.clientX, py: e.clientY });
  }, []);

  /** The action the pointer is currently over (target may be "air" for drying). */
  function desiredAction(d: DragState, clientX: number, clientY: number) {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    if (!inside) return null;
    const s = useLab2DStore.getState().state;
    const { hx, hy } = hitPoint(d, clientX, clientY);
    const tg = targetAt(hx - rect.left, hy - rect.top, d.id);
    if (tg) {
      if (tg === "lamp" && !s.lamp.lit) return null; // can't use an unlit flame
      const intent = intentFor(d.id, tg, s);
      // Fixation only after the smear has air-dried (otherwise let air-dry win).
      if (intent && !(intent === "flame-fix" && !s.slide.airDried)) {
        return { target: tg as ItemId | "air", intent, kind: actionKind(d.id, tg) };
      }
    }
    // Slide held in the open air during stage 3 → air-drying.
    if (d.id === "slide" && s.currentStageId === "stage-3" && s.slide.smeared && !s.slide.airDried) {
      return { target: "air" as const, intent: "air-dry" as StepId, kind: "airdry" as Kind };
    }
    return null;
  }

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      const dx = e.clientX - lastPtr.current.x;
      const dy = e.clientY - lastPtr.current.y;
      lastPtr.current = { x: e.clientX, y: e.clientY };
      setDrag((d) => (d ? { ...d, px: e.clientX, py: e.clientY } : d));
      const d = dragRef.current;
      if (!d) return;

      const desired = desiredAction(d, e.clientX, e.clientY);
      const h = holdRef.current;

      // Release the "already-consumed" lock once we leave that target.
      if (lockTargetRef.current && (!desired || desired.target !== lockTargetRef.current)) {
        lockTargetRef.current = null;
      }

      if (!desired) {
        // Nothing valid under the pointer.
        if (h && h.kind !== "rub") cancelHold(); // timed needs continuous contact
        setHoverTarget(null);
        return;
      }
      setHoverTarget(desired.target === "air" ? null : desired.target);

      // This target's action was just completed and the tool is still in hand.
      if (lockTargetRef.current === desired.target) return;

      if (desired.kind === "instant") {
        if (h) cancelHold();
        return; // fires on release
      }

      if (!h || h.target !== desired.target || h.kind !== desired.kind) {
        if (desired.kind === "rub") startRub(desired.target as ItemId, desired.intent);
        else startTimed(desired.kind, desired.target, desired.intent, desired.kind === "sample" ? SAMPLE_DUR : desired.kind === "airdry" ? AIRDRY_DUR : HOLD_DUR);
        return;
      }

      // Same action continues. Rub accumulates from movement; timed via interval.
      if (h.kind === "rub") {
        const np = h.progress + Math.hypot(dx, dy) * RUB_K;
        if (np >= 1) {
          completeAction(h.intent, h.target);
        } else {
          const nh: Hold = { ...h, progress: np };
          holdRef.current = nh;
          setHold(nh);
        }
      }
    }
    function onUp(e: PointerEvent) {
      resolveDrop(e);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id]);

  function endDrag() {
    setDrag(null);
    setHoverTarget(null);
  }

  function resolveDrop(e: PointerEvent) {
    cancelHold(); // abandon any in-progress (unfinished) hold/rub
    lockTargetRef.current = null;
    const d = dragRef.current;
    const rect = tableRef.current?.getBoundingClientRect();
    if (!d || !rect) {
      endDrag();
      return;
    }
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    const store = useLab2DStore.getState();

    // Released over the tray → put the tool away (manual return to the sidebar).
    if (!inside) {
      if (!d.fromSidebar) {
        setPlaced((p) => {
          const n = { ...p };
          delete n[d.id];
          return n;
        });
      }
      endDrag();
      return;
    }

    // Instant actions fire on release; hold/rub actions already fired mid-drag,
    // so on release we simply place the tool down where it was let go.
    const { hx, hy } = hitPoint(d, e.clientX, e.clientY);
    const target = targetAt(hx - rect.left, hy - rect.top, d.id);
    if (target) {
      const intent = intentFor(d.id, target, store.state);
      if (intent && actionKind(d.id, target) === "instant") {
        if (intent === "wash-mb" && !mbReadyRef.current) {
          showToast("Bo'yoq hali ta'sir qilmoqda — kuting");
        } else {
          const before = store.state;
          store.dispatchStep(intent);
          const after = useLab2DStore.getState().state;
          if (after !== before) onSuccess(intent, target);
          else showToast("Hozir bo'lmaydi — ketma-ketlikni kuzating");
        }
        placeOrRemove(d.id, intent, e.clientX, e.clientY);
        endDrag();
        return;
      }
    }

    // Place / reposition the tool on the bench (stays until manually removed).
    const xPct = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    setPlaced((p) => ({ ...p, [d.id]: { x: xPct, y: yPct } }));
    if (d.id === "slide" && !store.state.slide.onRack) store.dispatchStep("pick-slide");
    endDrag();
  }

  function onSuccess(intent: string, target: ItemId | "air") {
    const sp = placedRef.current["slide"];
    const sx = sp?.x ?? 50;
    const sy = sp?.y ?? 50;
    if (intent === "discard-match") setBinBump((k) => k + 1);
    if (intent === "add-nacl") flashAt("drop-nacl", sx, sy);
    else if (intent === "apply-mb") flashAt("drop-mb", sx, sy);
    else if (intent === "apply-oil") flashAt("drop-oil", sx, sy);
    else if (intent === "wash-mb") flashAt("wash", sx, sy);
    else if (target !== "air") {
      const tp = placedRef.current[target];
      flashAt("check", tp?.x ?? sx, tp?.y ?? sy);
    }
  }

  if (!cfg) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Yuklanmoqda…</div>;
  }

  const placedSet = new Set(Object.keys(placed)) as Set<ItemId>;
  const draggingDef = drag ? ITEM_BY_ID[drag.id] : null;
  const activeIdx = STAGE_IDS.indexOf(state.currentStageId as (typeof STAGE_IDS)[number]);
  const hint = nextHint(state);
  const slidePos = placed["slide"];

  const validTargets = new Set<ItemId>();
  if (drag) {
    ITEMS.forEach((it) => {
      if (it.target && placedSet.has(it.id) && it.id !== drag.id && intentFor(drag.id, it.id, state)) validTargets.add(it.id);
    });
  }

  const ringColor = hold && (hold.intent === "smear-sample" || hold.intent === "clean-slide" || hold.intent === "blot-filter")
    ? "#7c3aed"
    : hold && hold.intent === "air-dry"
    ? "#0ea5e9"
    : "#f97316";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden select-none text-slate-800" style={{ background: "#ececec" }}>
      <header className="z-30 flex items-center gap-3 border-b border-slate-300/70 bg-white/85 px-3 py-2 backdrop-blur">
        <button onClick={() => router.push("/")} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">
          ←
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide text-slate-800">Bakterial hujayra morfologiyasi</span>
          <span className="text-[11px] text-slate-500">Oddiy bo'yash — metilen ko'ki · Lab 1</span>
        </div>
        <div className="ml-3 hidden items-center gap-1.5 md:flex">
          {STAGE_IDS.map((id, i) => (
            <div key={id} className="flex items-center gap-1.5">
              <div className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: i < activeIdx ? "#10b981" : i === activeIdx ? "#7c3aed" : "#cbd5e1" }}>
                {i < activeIdx ? "✓" : i + 1}
              </div>
              {i < STAGE_IDS.length - 1 && <div className="h-0.5 w-4 rounded bg-slate-300" />}
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[40%] items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow">
          <span className="text-amber-300">➜</span>
          <span className="truncate">{hint}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 px-3 py-1.5 text-center">
            <span className="text-sm font-bold text-white">{state.score.outOfTen.toFixed(1)}</span>
            <span className="text-[11px] text-violet-200">/10</span>
          </div>
          <button onClick={resetLab} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">
            ↻ Qayta
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ToolSidebar state={state} placed={placedSet} draggingId={drag?.id ?? null} binBump={binBump} onStartDrag={startDrag} />

        <div ref={tableRef} className="relative flex-1 overflow-hidden" style={{ background: "linear-gradient(180deg,#ededed 0%,#e6e6e6 55%,#8f8f8f 55%,#9a9a9a 100%)" }}>
          {placedSet.size === 0 && !drag && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-2xl bg-white/70 px-5 py-3 text-sm font-medium text-slate-500 shadow">
                Asboblarni chap paneldan ish stoliga sudrab oling
              </p>
            </div>
          )}

          {ITEMS.filter((it) => placedSet.has(it.id)).map((it) => {
            const pos = placed[it.id];
            const isValid = validTargets.has(it.id);
            const isHover = hoverTarget === it.id;
            const plugOff = it.id === "culture" && hold?.kind === "sample";
            return (
              <div key={it.id} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)", opacity: drag?.id === it.id ? 0.35 : 1 }}>
                {(isValid || isHover) && (
                  <div
                    className="pointer-events-none absolute -inset-3 rounded-2xl"
                    style={{
                      border: `2px dashed ${isHover ? "#7c3aed" : "#a78bfa"}`,
                      boxShadow: isHover ? "0 0 18px rgba(124,58,237,0.45)" : "none",
                      animation: "wbZonePulse 1.4s ease-in-out infinite",
                    }}
                  />
                )}
                <div
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startDrag(it.id, e);
                  }}
                  onDoubleClick={() =>
                    setPlaced((p) => {
                      const n = { ...p };
                      delete n[it.id];
                      return n;
                    })
                  }
                  style={{ cursor: "grab" }}
                  title={it.label}
                >
                  {it.render(state, { binBump, tubePlugOff: plugOff })}
                </div>
              </div>
            );
          })}

          {/* MB contact countdown near the placed slide */}
          {slidePos && state.slide.methyleneBlue.applied && !state.slide.methyleneBlue.washed && (
            <div
              className="pointer-events-none absolute z-20 rounded-lg bg-blue-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md"
              style={{ left: `${slidePos.x}%`, top: `${slidePos.y + 12}%`, transform: "translate(-50%,0)" }}
            >
              {mbReady ? "Tayyor — endi yuving" : `Ta'sir vaqti: ${mbLeft}s`}
            </div>
          )}

          {fx && (fx.kind === "drop-nacl" || fx.kind === "drop-mb" || fx.kind === "drop-oil") && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 8}%` }}>
              {fx.kind === "drop-nacl" && <Drop trigger={fx.key} color="#88c5d8" />}
              {fx.kind === "drop-mb" && <Drop trigger={fx.key} color="#2746c8" fallHeight={64} />}
              {fx.kind === "drop-oil" && <Drop trigger={fx.key} color="#e7b94e" fallHeight={64} />}
            </div>
          )}
          {/* Water-wash animation: a stream sweeps down, rinsing the blue away */}
          {fx?.kind === "wash" && (
            <div
              key={fx.key}
              className="pointer-events-none absolute z-30 overflow-hidden rounded-md"
              style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: "translate(-50%,-50%)", width: 130, height: 96 }}
            >
              <motion.div
                initial={{ y: -96, opacity: 0.9 }}
                animate={{ y: 70, opacity: 0 }}
                transition={{ duration: 0.95, ease: "easeIn" }}
                style={{ width: "100%", height: 64, background: "linear-gradient(180deg, rgba(150,200,225,0) 0%, rgba(150,200,225,0.9) 50%, rgba(150,200,225,0) 100%)" }}
              />
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ y: -40, opacity: 0.8 }}
                  animate={{ y: 90, opacity: 0 }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: "easeIn" }}
                  className="absolute rounded-full"
                  style={{ left: `${22 + i * 20}%`, width: 6, height: 12, background: "#9fc8e1" }}
                />
              ))}
            </div>
          )}
          {fx?.kind === "check" && (
            <div key={fx.key} className="pointer-events-none absolute z-30 grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white shadow-lg" style={{ left: `${fx.x}%`, top: `${fx.y}%`, animation: "wbCheckPop 0.5s ease-out" }}>
              ✓
            </div>
          )}

          {/* Drag ghost */}
          {drag && draggingDef && (
            <div className="pointer-events-none fixed z-50" style={{ left: drag.px, top: drag.py, transform: "translate(-50%,-50%) scale(1.06)", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
              {hold && drag.id === "loop" && hold.kind === "hold" ? (
                <BacterialLoop heatLevel={hold.progress} />
              ) : hold && drag.id === "loop" && hold.kind === "sample" ? (
                // Rotate the loop so its WIRE RING (left end) swings down into the
                // vertical tube; negative angle = ring goes down, handle up.
                <div style={{ transform: `rotate(${-hold.progress * 95}deg)`, transition: "transform 0.08s linear" }}>
                  <BacterialLoop heatLevel={0} />
                </div>
              ) : (
                draggingDef.render(state, { binBump })
              )}

              {/* Warm glow while fixing a slide over the flame */}
              {hold && drag.id === "slide" && hold.kind === "hold" && (
                <div className="absolute inset-0 rounded-md" style={{ background: `rgba(255,140,40,${0.15 + hold.progress * 0.4})`, mixBlendMode: "screen" }} />
              )}

              {/* Airflow lines while air-drying in the hand */}
              {hold && hold.kind === "airdry" && (
                <div className="absolute -inset-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="absolute h-[2px] w-10 rounded bg-sky-300/80" style={{ top: `${20 + i * 26}%`, left: 0, animation: `wbAirflow 1.1s linear ${i * 0.25}s infinite` }} />
                  ))}
                </div>
              )}

              {/* Progress ring + label for any held/rubbed action */}
              {hold && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="5" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke={ringColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 30} strokeDashoffset={2 * Math.PI * 30 * (1 - hold.progress)} transform="rotate(-90 36 36)" />
                  </svg>
                  <div className="absolute left-1/2 top-[112%] -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {holdLabel(hold)}
                  </div>
                </div>
              )}
            </div>
          )}

          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-rose-600/95 px-4 py-2 text-sm font-medium text-white shadow-lg">
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Lab1ResultModal />
    </div>
  );
}
