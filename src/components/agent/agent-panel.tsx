"use client"

import { Dialog } from "@base-ui/react/dialog"
import { MessageCircle, X } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from "react"

import { profile } from "@/lib/content"
import type { OpenTarget } from "@/lib/terminal/commands"

import { ChatView } from "./chat-view"

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Below this width the panel is a full-screen sheet that covers the page. */
const SHEET_QUERY = "(max-width: 639px)"

export default function AgentPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const firstName = profile.name.split(" ")[0]

  // On phones the on-screen keyboard shrinks the visible area but not the
  // layout viewport, so a full-height sheet would hide the prompt behind the
  // keyboard. Track the visual viewport and size the sheet to it.
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    const update = () =>
      root.style.setProperty("--agent-height", `${viewport.height}px`)
    update()
    viewport.addEventListener("resize", update)
    return () => {
      viewport.removeEventListener("resize", update)
      root.style.removeProperty("--agent-height")
    }
  }, [])

  // The page behind stays clickable, so a mouse click can move focus out of
  // the panel. While it's open, Tab always brings keyboard focus back in
  // rather than wandering through content the panel is covering.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Tab") return
      const popup = popupRef.current
      if (!popup || popup.contains(document.activeElement)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [open])

  /** Scrolls the page to a section or project the agent pointed at. */
  const navigate = useCallback(
    (hash: string) => {
      const target = document.getElementById(hash.replace(/^#/, ""))
      if (!target) return
      // The sheet covers the page, so it has to get out of the way first.
      if (window.matchMedia(SHEET_QUERY).matches) onOpenChange(false)
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        })
        if (target.id.startsWith("project-")) {
          // Restart the highlight animation even if it's the same card again.
          target.classList.remove("agent-highlight")
          void target.offsetWidth
          target.classList.add("agent-highlight")
        }
      })
    },
    [onOpenChange]
  )

  // In-page links inside answers and command output go through navigate().
  const onClick = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      'a[href^="#"]'
    )
    if (!link) return
    event.preventDefault()
    navigate(link.getAttribute("href") ?? "")
  }

  // The dialog's own focus trap lets Tab escape to the page after the first
  // lap in "trap-focus" mode, so the wrap-around is done explicitly here.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || event.defaultPrevented) return
    const popup = popupRef.current
    if (!popup) return
    const tabbable = Array.from(
      popup.querySelectorAll<HTMLElement>(TABBABLE)
    ).filter((element) => element.getClientRects().length > 0)
    const first = tabbable[0]
    const last = tabbable[tabbable.length - 1]
    if (!first || !last) return
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === popup)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    // "trap-focus" keeps keyboard focus inside the panel without locking the
    // page, so the agent can scroll the page behind it. Outside clicks don't
    // dismiss it for the same reason; Esc and the close button do.
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      modal="trap-focus"
      disablePointerDismissal
    >
      {/* keepMounted: closing the panel keeps the conversation. */}
      <Dialog.Portal keepMounted>
        <Dialog.Popup
          ref={popupRef}
          // On touch devices focusing the prompt would pop the keyboard over
          // the suggestions, so focus the panel itself there; everywhere else
          // go straight to the input. (The panel is opened programmatically,
          // so the dialog can't infer the interaction type on its own.)
          initialFocus={() =>
            window.matchMedia("(pointer: coarse)").matches
              ? popupRef.current
              : inputRef.current
          }
          onClick={onClick}
          onKeyDown={onKeyDown}
          className="fixed inset-x-0 top-0 z-50 flex h-(--agent-height,100dvh) flex-col overflow-hidden bg-popover font-sans text-popover-foreground shadow-2xl outline-none transition duration-200 ease-out data-ending-style:translate-y-3 data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none sm:inset-auto sm:right-5 sm:bottom-5 sm:h-[min(36rem,calc(100dvh-6rem))] sm:w-[26rem] sm:rounded-2xl sm:border sm:border-border"
        >
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-border pr-2 pl-4">
            <Dialog.Title className="flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="size-4 text-muted-foreground" />
              Ask about {firstName}
            </Dialog.Title>
            <div className="flex items-center gap-1.5">
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-sans text-[11px] leading-none text-muted-foreground sm:inline">
                esc
              </kbd>
              <Dialog.Close
                aria-label="Close assistant"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </Dialog.Close>
            </div>
          </header>
          <Dialog.Description className="sr-only">
            Ask questions about {profile.name} in plain English, or use the
            shortcuts for projects, experience, skills and contact details.
          </Dialog.Description>
          <ChatView
            inputRef={inputRef}
            onOpen={(target: OpenTarget) => navigate(`#${target}`)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
