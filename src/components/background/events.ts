/**
 * A tiny event channel into the background. The background stays a standalone
 * component: it never imports page or agent code, it only listens here.
 */
export type BackgroundEvent =
  /** A one-off ripple. Coordinates are viewport pixels. */
  | { type: "pulse"; x: number; y: number; strength?: number }
  /** Sustained activity, e.g. while the agent streams an answer. */
  | { type: "activity"; active: boolean; x: number; y: number }

type Listener = (event: BackgroundEvent) => void

const listeners = new Set<Listener>()

export function emitBackgroundEvent(event: BackgroundEvent) {
  for (const listener of listeners) listener(event)
}

export function onBackgroundEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
