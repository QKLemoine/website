"use client"

import { MessageCircle } from "lucide-react"
import dynamic from "next/dynamic"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

// The panel (dialog, chat view, commands, chat client) is a separate chunk
// that is only fetched the first time someone opens the agent.
const loadPanel = () => import("./agent-panel")
const AgentPanel = dynamic(loadPanel, { ssr: false })

type AgentContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  /** Starts fetching the panel code early, e.g. on hover. */
  preload: () => void
}

const AgentContext = createContext<AgentContextValue | null>(null)

export function useAgent(): AgentContextValue {
  const value = useContext(AgentContext)
  if (!value) throw new Error("useAgent must be used inside AgentProvider")
  return value
}

const noopSubscribe = () => () => {}

/** "⌘K" on Apple devices, "Ctrl K" elsewhere (and on the server). */
export function useShortcutLabel(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K"
  )
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false)
  // Stays true after the first open so the conversation survives closing.
  const [mounted, setMounted] = useState(false)

  const setOpen = useCallback((next: boolean) => {
    if (next) setMounted(true)
    setOpenState(next)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setMounted(true)
        setOpenState((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const value = useMemo<AgentContextValue>(
    () => ({ open, setOpen, preload: () => void loadPanel() }),
    [open, setOpen]
  )

  return (
    <AgentContext.Provider value={value}>
      {children}
      <Launcher />
      {mounted && <AgentPanel open={open} onOpenChange={setOpen} />}
    </AgentContext.Provider>
  )
}

function Launcher() {
  const { open, setOpen, preload } = useAgent()
  const shortcut = useShortcutLabel()

  return (
    // Stays mounted under the open panel so focus has somewhere to return to
    // when the panel closes.
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
      onPointerEnter={preload}
      onFocus={preload}
      className="fixed right-4 bottom-4 z-40 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 sm:right-5 sm:bottom-5"
    >
      <MessageCircle className="size-4.5" />
      Ask me
      <kbd className="hidden rounded border border-primary-foreground/25 px-1.5 py-0.5 font-sans text-[11px] leading-none text-primary-foreground/70 sm:inline">
        {shortcut}
      </kbd>
    </button>
  )
}
