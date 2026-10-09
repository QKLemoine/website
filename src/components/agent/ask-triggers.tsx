"use client"

import { MessageCircle, Search } from "lucide-react"

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

/** A search-input-shaped button for the hero: it reads as an invitation to type. */
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
      className="flex h-11 w-full max-w-md items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 text-left text-sm text-muted-foreground outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className="truncate">Ask me anything about my work</span>
      <kbd className="ml-auto hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-sans text-[11px] leading-none sm:inline">
        {shortcut}
      </kbd>
    </button>
  )
}
