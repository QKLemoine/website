/**
 * A tiny event channel between the desktop UI and the wallpaper. The wallpaper
 * stays a standalone component: it never imports window or terminal code, it
 * only listens here.
 */
export type DesktopEvent =
  /** A one-off ripple, e.g. when a window opens. Coordinates are viewport pixels. */
  | { type: "pulse"; x: number; y: number; strength?: number }
  /** Sustained activity, e.g. while the terminal streams an answer. */
  | { type: "activity"; active: boolean; x: number; y: number }

type Listener = (event: DesktopEvent) => void

const listeners = new Set<Listener>()

export function emitDesktopEvent(event: DesktopEvent) {
  for (const listener of listeners) listener(event)
}

export function onDesktopEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
