"use client"

import { motion } from "framer-motion"
import { Maximize2, Minus, X } from "lucide-react"
import { memo, useEffect, useRef, type CSSProperties } from "react"

import { cn } from "@/lib/utils"

import { DOCK_RESERVED, MENU_BAR_HEIGHT, TITLE_BAR_HEIGHT } from "../layout-constants"
import type { AppDefinition, WindowState } from "../types"
import { useWindowPointer, type ResizeEdge } from "./use-window-pointer"
import { useWindowActions } from "./window-manager"

// Handles straddle the window edge (partly outside it) so they are not clipped
// by the frame's rounded corners and don't steal clicks from the content.
const RESIZE_HANDLES: { edge: ResizeEdge; className: string }[] = [
  { edge: "n", className: "inset-x-3 -top-1 h-2 cursor-ns-resize" },
  { edge: "s", className: "inset-x-3 -bottom-1 h-2 cursor-ns-resize" },
  { edge: "e", className: "inset-y-3 -right-1 w-2 cursor-ew-resize" },
  { edge: "w", className: "inset-y-3 -left-1 w-2 cursor-ew-resize" },
  { edge: "ne", className: "-top-1 -right-1 size-4 cursor-nesw-resize" },
  { edge: "nw", className: "-top-1 -left-1 size-4 cursor-nwse-resize" },
  { edge: "se", className: "-right-1 -bottom-1 size-4 cursor-nwse-resize" },
  { edge: "sw", className: "-bottom-1 -left-1 size-4 cursor-nesw-resize" },
]

const variants = {
  open: { opacity: 1, scale: 1, y: 0, display: "block" },
  // Minimized windows stay mounted so app state (terminal history) survives.
  minimized: {
    opacity: 0,
    scale: 0.85,
    y: 60,
    transitionEnd: { display: "none" },
  },
}

export const Window = memo(function Window({
  win,
  app,
  active,
}: {
  win: WindowState
  app: AppDefinition
  active: boolean
}) {
  const actions = useWindowActions()
  const ref = useRef<HTMLElement>(null)
  const { dragging, handlers } = useWindowPointer({
    bounds: win,
    minSize: app.minSize,
    disabled: win.maximized,
    onChange: (bounds) => actions.setBounds(app.id, bounds),
  })

  // Move keyboard focus with window focus (open, dock click, another window closing).
  useEffect(() => {
    const node = ref.current
    if (active && node && !node.contains(document.activeElement)) node.focus()
  }, [active])

  const geometry: CSSProperties = win.maximized
    ? {
        left: 0,
        top: MENU_BAR_HEIGHT,
        width: "100%",
        height: `calc(100% - ${MENU_BAR_HEIGHT + DOCK_RESERVED}px)`,
      }
    : { left: win.x, top: win.y, width: win.width, height: win.height }

  const AppComponent = app.component

  return (
    <motion.section
      ref={ref}
      role="dialog"
      aria-label={app.title}
      tabIndex={-1}
      data-active={active || undefined}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={win.minimized ? "minimized" : "open"}
      exit={{ opacity: 0, scale: 0.96 }}
      variants={variants}
      transition={{ duration: 0.16, ease: "easeOut" }}
      style={{ ...geometry, zIndex: win.z }}
      onPointerDownCapture={() => actions.focus(app.id)}
      onFocusCapture={() => actions.focus(app.id)}
      className={cn(
        "absolute outline-none",
        win.maximized ? "rounded-none" : "rounded-xl",
        active
          ? "shadow-[0_24px_70px_-12px_rgba(0,0,0,0.75)]"
          : "shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]",
        // Animate maximize/restore, but never fight the pointer mid-drag.
        !dragging && "transition-[left,top,width,height] duration-200 ease-out"
      )}
    >
      <div className="flex size-full flex-col overflow-hidden rounded-[inherit] border border-white/10 bg-card text-card-foreground">
        <header
          {...handlers("move")}
          onDoubleClick={() => actions.toggleMaximize(app.id)}
          style={{ height: TITLE_BAR_HEIGHT }}
          className={cn(
            "group/titlebar relative flex shrink-0 touch-none items-center border-b border-white/10 bg-white/[0.04] px-3 select-none",
            !win.maximized && "cursor-default"
          )}
        >
          <div className="group/lights flex items-center gap-2">
            <TrafficLight
              label={`Close ${app.title}`}
              color="bg-[#ff5f57]"
              idleHover="group-hover/lights:bg-[#ff5f57]"
              active={active}
              onClick={() => actions.close(app.id)}
            >
              <X />
            </TrafficLight>
            <TrafficLight
              label={`Minimize ${app.title}`}
              color="bg-[#febc2e]"
              idleHover="group-hover/lights:bg-[#febc2e]"
              active={active}
              onClick={() => actions.minimize(app.id)}
            >
              <Minus />
            </TrafficLight>
            <TrafficLight
              label={`${win.maximized ? "Restore" : "Maximize"} ${app.title}`}
              color="bg-[#28c840]"
              idleHover="group-hover/lights:bg-[#28c840]"
              active={active}
              onClick={() => actions.toggleMaximize(app.id)}
            >
              <Maximize2 />
            </TrafficLight>
          </div>
          <span
            className={cn(
              "pointer-events-none absolute inset-x-20 truncate text-center text-[13px] font-medium",
              active ? "text-foreground/90" : "text-muted-foreground"
            )}
          >
            {app.title}
          </span>
        </header>

        <div className="relative min-h-0 flex-1">
          <AppComponent />
        </div>
      </div>

      {!win.maximized &&
        RESIZE_HANDLES.map(({ edge, className }) => (
          <div
            key={edge}
            aria-hidden
            {...handlers(edge)}
            className={cn("absolute z-10 touch-none", className)}
          />
        ))}
    </motion.section>
  )
})

function TrafficLight({
  label,
  color,
  idleHover,
  active,
  onClick,
  children,
}: {
  label: string
  color: string
  /** Full literal class so Tailwind can see it; inactive windows colour their lights only on hover. */
  idleHover: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-3 items-center justify-center rounded-full text-black/70 outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        active ? color : cn("bg-white/20", idleHover),
        "[&>svg]:size-2 [&>svg]:stroke-[3] [&>svg]:opacity-0 group-hover/lights:[&>svg]:opacity-100 focus-visible:[&>svg]:opacity-100"
      )}
    >
      {children}
    </button>
  )
}
