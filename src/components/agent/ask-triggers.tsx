"use client"

import { AnimatePresence, motion } from "framer-motion"
import { MessageCircle, Search } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

import { useAgent, useShortcutLabel } from "./agent-provider"

/** Compact button for the nav bar. */
export function AskButton() {
  const { open, setOpen, preload } = useAgent()

  return (
    <Button
      variant="outline"
      size="sm"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      onPointerEnter={preload}
      onFocus={preload}
    >
      <MessageCircle />
      Ask me
    </Button>
  )
}

const EXAMPLE_SECONDS = 4.5

/**
 * Steps through `count` items on a timer. Stays on the first one under
 * reduced motion, and pauses while the tab is hidden.
 */
function useCycle(count: number): number {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (count < 2) return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let timer = 0
    const sync = () => {
      window.clearInterval(timer)
      if (reducedMotion.matches) setIndex(0)
      else if (!document.hidden) {
        timer = window.setInterval(
          () => setIndex((current) => (current + 1) % count),
          EXAMPLE_SECONDS * 1000
        )
      }
    }
    sync()
    reducedMotion.addEventListener("change", sync)
    document.addEventListener("visibilitychange", sync)
    return () => {
      window.clearInterval(timer)
      reducedMotion.removeEventListener("change", sync)
      document.removeEventListener("visibilitychange", sync)
    }
  }, [count])

  return index
}

/**
 * A search-input-shaped button for the hero: it reads as an invitation to
 * type, with example questions fading through as its placeholder.
 */
export function AskPrompt({ examples = [] }: { examples?: string[] }) {
  const { open, setOpen, preload } = useAgent()
  const shortcut = useShortcutLabel()
  const index = useCycle(examples.length)
  const label = "Ask me anything about my work"

  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      onPointerEnter={preload}
      onFocus={preload}
      className="flex h-11 w-full max-w-md items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 text-left text-sm text-muted-foreground outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          className="truncate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {examples[index] ?? label}
        </motion.span>
      </AnimatePresence>
      <kbd className="ml-auto hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-sans text-[11px] leading-none sm:inline">
        {shortcut}
      </kbd>
    </button>
  )
}
