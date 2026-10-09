"use client"

import { SquareTerminal } from "lucide-react"

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
      <SquareTerminal />
      Ask me
    </Button>
  )
}

/** A prompt-shaped button for the hero: it reads as an invitation to type. */
export function AskPrompt() {
  const { open, setOpen, preload } = useAgent()
  const shortcut = useShortcutLabel()

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      onPointerEnter={preload}
      onFocus={preload}
      className="group/ask flex h-11 w-full max-w-md items-center gap-2.5 rounded-lg border border-border bg-background/70 px-3.5 text-left font-mono text-sm text-muted-foreground outline-none transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span aria-hidden className="text-emerald-600 dark:text-emerald-400">
        ›
      </span>
      Ask me anything about my work
      <span
        aria-hidden
        className="h-4 w-[7px] animate-[terminal-blink_1.1s_steps(1)_infinite] bg-emerald-600 motion-reduce:animate-none dark:bg-emerald-400"
      />
      <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 font-sans text-[11px] leading-none sm:inline">
        {shortcut}
      </kbd>
    </button>
  )
}
