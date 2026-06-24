import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * Pointer-down handler for a draggable tool in the (vertically scrollable) tool
 * tray. Used by every lab sidebar.
 *
 * Mouse / pen: the drag starts immediately — desktop behaviour is unchanged.
 *
 * Touch: beginning the drag on touch-down lets a finger "catch" a tool while the
 * student is only trying to scroll the tray. Instead we wait for the first move
 * and read its direction: a mostly-vertical swipe scrolls the tray (the tray
 * itself uses `touch-action: pan-y`), while a mostly-horizontal pull — toward the
 * bench on the right — begins the drag. The browser owns the rest of a horizontal
 * gesture, so the tool then drags freely in any direction without scrolling.
 */
export function startToolDrag<Id>(
  e: ReactPointerEvent,
  id: Id,
  onStartDrag: (id: Id, e: ReactPointerEvent) => void,
) {
  if (e.pointerType !== "touch") {
    e.preventDefault();
    onStartDrag(id, e);
    return;
  }

  const sx = e.clientX;
  const sy = e.clientY;
  const pid = e.pointerId;

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== pid) return;
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // wait for a clear intent
    cleanup();
    // Horizontal pull → drag; vertical swipe → leave it to the browser to scroll.
    // startDrag only reads clientX/clientY, so the native event is fine here.
    if (Math.abs(dx) > Math.abs(dy)) onStartDrag(id, ev as unknown as ReactPointerEvent);
  };
  const onEnd = () => cleanup();
  function cleanup() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("pointercancel", onEnd);
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onEnd);
  window.addEventListener("pointercancel", onEnd);
}
