"use client"

import { useSyncExternalStore } from "react"

/**
 * One switch for every project tile clip. It starts paused for visitors who
 * prefer reduced motion and playing for everyone else, and the visitor can
 * flip it at any time with the toggle above the projects.
 */
let choice: boolean | null = null
const listeners = new Set<() => void>()

function reducedMotion(): MediaQueryList {
  return window.matchMedia("(prefers-reduced-motion: reduce)")
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  const query = reducedMotion()
  query.addEventListener("change", onChange)
  return () => {
    listeners.delete(onChange)
    query.removeEventListener("change", onChange)
  }
}

export function setVideosPaused(paused: boolean) {
  choice = paused
  for (const listener of listeners) listener()
}

/** True while tile clips should stay on their posters. */
export function useVideosPaused(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => choice ?? reducedMotion().matches,
    // The server renders posters; clips start once the browser decides.
    () => true
  )
}
