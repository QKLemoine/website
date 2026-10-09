"use client"

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

import { MENU_BAR_HEIGHT } from "../layout-constants"
import type { Bounds, Size } from "../types"

export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
export type PointerMode = "move" | ResizeEdge

type Session = {
  pointerId: number
  startX: number
  startY: number
  startBounds: Bounds
  mode: PointerMode
}

/** Pure geometry for a move or resize gesture, given the pointer delta. */
export function computeBounds(
  start: Bounds,
  mode: PointerMode,
  dx: number,
  dy: number,
  min: Size
): Bounds {
  if (mode === "move") return { ...start, x: start.x + dx, y: start.y + dy }

  let { x, y, width, height } = start
  if (mode.includes("e")) width = Math.max(min.width, start.width + dx)
  if (mode.includes("s")) height = Math.max(min.height, start.height + dy)
  if (mode.includes("w")) {
    width = Math.max(min.width, start.width - dx)
    x = start.x + start.width - width
  }
  if (mode.includes("n")) {
    // The top edge can't pass the menu bar; the bottom edge stays anchored.
    const bottom = start.y + start.height
    y = Math.max(MENU_BAR_HEIGHT, Math.min(start.y + dy, bottom - min.height))
    height = bottom - y
  }
  return { x, y, width, height }
}

/**
 * Pointer-capture based move/resize. Capture keeps events flowing to the handle
 * even when the cursor outruns the window or crosses an iframe-like surface.
 */
export function useWindowPointer({
  bounds,
  minSize,
  disabled,
  onChange,
}: {
  bounds: Bounds
  minSize: Size
  disabled: boolean
  onChange: (bounds: Bounds) => void
}) {
  const session = useRef<Session | null>(null)
  const [dragging, setDragging] = useState(false)

  function handlers(mode: PointerMode) {
    return {
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        if (disabled || event.button !== 0) return
        if ((event.target as HTMLElement).closest("button")) return
        event.currentTarget.setPointerCapture(event.pointerId)
        session.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startBounds: bounds,
          mode,
        }
        setDragging(true)
      },
      onPointerMove(event: ReactPointerEvent<HTMLElement>) {
        const current = session.current
        if (!current || current.pointerId !== event.pointerId) return
        onChange(
          computeBounds(
            current.startBounds,
            current.mode,
            event.clientX - current.startX,
            event.clientY - current.startY,
            minSize
          )
        )
      },
      onPointerUp: end,
      onPointerCancel: end,
    }
  }

  function end(event: ReactPointerEvent<HTMLElement>) {
    if (session.current?.pointerId !== event.pointerId) return
    session.current = null
    setDragging(false)
  }

  return { dragging, handlers }
}
