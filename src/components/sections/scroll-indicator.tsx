"use client"

import { ChevronDown } from "lucide-react"
import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

/** Past this many pixels the hint has done its job and gets out of the way. */
const HIDE_AFTER_PX = 80

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true })
  return () => window.removeEventListener("scroll", onChange)
}

/** A "Scroll" hint at the bottom of the hero that jumps to the given section. */
export function ScrollIndicator({ targetId }: { targetId: string }) {
  const hidden = useSyncExternalStore(
    subscribe,
    () => window.scrollY > HIDE_AFTER_PX,
    () => false
  )

  return (
    <button
      type="button"
      // Once faded out it must not be reachable by keyboard or screen reader.
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      onClick={() => {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })
      }}
      className={cn(
        "mx-auto flex flex-col items-center gap-1 rounded-md px-3 py-1 text-xs font-medium tracking-widest text-muted-foreground uppercase outline-none transition-opacity duration-300 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        hidden && "pointer-events-none opacity-0"
      )}
    >
      Scroll
      <ChevronDown aria-hidden className="size-4" />
    </button>
  )
}
