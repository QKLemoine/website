"use client"

import { useEffect, useRef } from "react"

import { MOTIF_REST_SCALE, type BackgroundConfig } from "./config"
import { createNoise2D } from "./noise"

const MAX_STEP_SECONDS = 1 / 30
/** Grid the contour height field is sampled on, CSS pixels. */
const CELL = 12
const RIPPLE_SPEED = 300
const RIPPLE_SECONDS = 1.3
/** Half-width of the ripple's ring, CSS pixels. */
const RIPPLE_WIDTH = 44
const MAX_RIPPLES = 4
/** Furthest a dot is pushed at bend 1, CSS pixels. */
const DOT_PUSH = 16

type Ripple = { x: number; y: number; age: number }

function rgba(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16)
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

/** 1 at the centre, easing to 0 at the radius. */
function falloff(distance: number, radius: number): number {
  if (distance >= radius) return 0
  const t = 1 - (distance * distance) / (radius * radius)
  return t * t
}

/** 1 on the ripple's ring, easing to 0 either side of it. */
function ring(distance: number, radius: number): number {
  const t = (distance - radius) / RIPPLE_WIDTH
  return t > -1 && t < 1 ? (1 - t * t) * (1 - t * t) : 0
}

/**
 * Decorative background for one section: a faint dot grid or a set of contour
 * lines. It is completely still at rest and only redraws while something is
 * changing: the pattern bends and brightens near the cursor and ripples on a
 * click or tap. Fills its positioned parent and never takes input.
 */
export default function ReactiveBackground({
  config,
  className,
  fadeOnScroll = false,
}: {
  config: BackgroundConfig
  className?: string
  /** Fade out as the page scrolls. Assumes the section is at the top of the page. */
  fadeOnScroll?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Read on every draw, so changing colours or strengths restyles the pattern
  // without rebuilding it.
  const configRef = useRef(config)
  const redrawRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    configRef.current = config
    redrawRef.current?.()
  }, [config])

  const { maxDevicePixelRatio } = config

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    // Without a canvas the section simply sits on the flat page colour.
    if (!container || !canvas || !ctx) return

    const noise = createNoise2D(7)
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, inside: false }
    const crossings = new Float32Array(8)
    let ripples: Ripple[] = []
    let width = 1
    let height = 1
    let columns = 1
    let rows = 1
    let base = new Float32Array(0)
    let field = new Float32Array(0)
    let baseScale = 0
    /** 0–1: how much the cursor currently affects the pattern. */
    let influence = 0
    let opacity = 1
    let frameId = 0
    let lastTime = 0

    /** The contours' height field at rest; it only changes with size or scale. */
    const buildBase = (scale: number) => {
      baseScale = scale
      columns = Math.ceil(width / CELL)
      rows = Math.ceil(height / CELL)
      base = new Float32Array((columns + 1) * (rows + 1))
      field = new Float32Array(base.length)
      for (let j = 0; j <= rows; j++) {
        for (let i = 0; i <= columns; i++) {
          const x = (i * CELL) / scale
          const y = (j * CELL) / scale
          base[j * (columns + 1) + i] =
            noise(x, y) + 0.35 * noise(x * 2.1 + 17, y * 2.1 + 9)
        }
      }
    }

    const dotsPath = (current: BackgroundConfig) => {
      const path = new Path2D()
      const spacing = Math.max(8, current.dotSpacing)
      const radius = current.dotSize
      const push = current.bend * DOT_PUSH * influence
      const ripplePush = current.rippleStrength * DOT_PUSH * 0.5
      const reach = current.interactionRadius
      for (let gy = (height % spacing) / 2; gy < height; gy += spacing) {
        for (let gx = (width % spacing) / 2; gx < width; gx += spacing) {
          let x = gx
          let y = gy
          if (push > 0.01) {
            const dx = gx - pointer.x
            const dy = gy - pointer.y
            const distance = Math.hypot(dx, dy)
            const amount = push * falloff(distance, reach)
            if (amount > 0 && distance > 0.001) {
              x += (dx / distance) * amount
              y += (dy / distance) * amount
            }
          }
          for (const ripple of ripples) {
            const dx = gx - ripple.x
            const dy = gy - ripple.y
            const distance = Math.hypot(dx, dy)
            const amount =
              ripplePush *
              (1 - ripple.age / RIPPLE_SECONDS) *
              ring(distance, ripple.age * RIPPLE_SPEED)
            if (amount > 0 && distance > 0.001) {
              x += (dx / distance) * amount
              y += (dy / distance) * amount
            }
          }
          path.moveTo(x + radius, y)
          path.arc(x, y, radius, 0, Math.PI * 2)
        }
      }
      return path
    }

    const contourPath = (current: BackgroundConfig) => {
      const scale = Math.max(60, current.contourScale)
      if (scale !== baseScale) buildBase(scale)
      // The cursor is a small hill and a ripple a travelling ridge, so the
      // lines bend around them instead of being pushed.
      const bump = current.bend * 0.6 * influence
      const rippleBump = current.rippleStrength * 0.3
      let heights = base
      if (bump > 0.005 || ripples.length > 0) {
        heights = field
        const reach = current.interactionRadius
        for (let j = 0; j <= rows; j++) {
          for (let i = 0; i <= columns; i++) {
            const index = j * (columns + 1) + i
            const x = i * CELL
            const y = j * CELL
            let value = base[index]
            if (bump > 0.005) {
              value +=
                bump * falloff(Math.hypot(x - pointer.x, y - pointer.y), reach)
            }
            for (const ripple of ripples) {
              value +=
                rippleBump *
                (1 - ripple.age / RIPPLE_SECONDS) *
                ring(
                  Math.hypot(x - ripple.x, y - ripple.y),
                  ripple.age * RIPPLE_SPEED
                )
            }
            field[index] = value
          }
        }
      }

      // Marching squares: for every grid cell, join the points where each
      // contour level crosses its edges.
      const path = new Path2D()
      const step = 1 / Math.max(1, current.contourDensity)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const index = j * (columns + 1) + i
          const topLeft = heights[index]
          const topRight = heights[index + 1]
          const bottomLeft = heights[index + columns + 1]
          const bottomRight = heights[index + columns + 2]
          const low = Math.min(topLeft, topRight, bottomLeft, bottomRight)
          const high = Math.max(topLeft, topRight, bottomLeft, bottomRight)
          const x = i * CELL
          const y = j * CELL
          for (
            let level = Math.ceil(low / step) * step;
            level < high;
            level += step
          ) {
            let count = 0
            if (topLeft < level !== topRight < level) {
              crossings[count++] =
                x + ((level - topLeft) / (topRight - topLeft)) * CELL
              crossings[count++] = y
            }
            if (topRight < level !== bottomRight < level) {
              crossings[count++] = x + CELL
              crossings[count++] =
                y + ((level - topRight) / (bottomRight - topRight)) * CELL
            }
            if (bottomLeft < level !== bottomRight < level) {
              crossings[count++] =
                x + ((level - bottomLeft) / (bottomRight - bottomLeft)) * CELL
              crossings[count++] = y + CELL
            }
            if (topLeft < level !== bottomLeft < level) {
              crossings[count++] = x
              crossings[count++] =
                y + ((level - topLeft) / (bottomLeft - topLeft)) * CELL
            }
            for (let point = 0; point + 3 < count; point += 4) {
              path.moveTo(crossings[point], crossings[point + 1])
              path.lineTo(crossings[point + 2], crossings[point + 3])
            }
          }
        }
      }
      return path
    }

    const draw = () => {
      const current = configRef.current
      ctx.clearRect(0, 0, width, height)
      if (opacity <= 0) return

      const dots = current.motif === "dots"
      const path = dots ? dotsPath(current) : contourPath(current)
      const paint = (style: string | CanvasGradient) => {
        if (dots) {
          ctx.fillStyle = style
          ctx.fill(path)
        } else {
          ctx.strokeStyle = style
          ctx.lineWidth = current.lineWidth
          ctx.stroke(path)
        }
      }

      paint(rgba(current.ink, current.restOpacity * MOTIF_REST_SCALE[current.motif]))

      // The same shapes again in the accent colour, through a gradient that is
      // only opaque near the cursor or on a ripple's ring.
      if (influence > 0.01) {
        const glow = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          current.interactionRadius
        )
        glow.addColorStop(0, rgba(current.accent, current.highlightOpacity * influence))
        glow.addColorStop(1, rgba(current.accent, 0))
        paint(glow)
      }
      for (const ripple of ripples) {
        const radius = ripple.age * RIPPLE_SPEED
        const strength =
          current.highlightOpacity *
          current.rippleStrength *
          (1 - ripple.age / RIPPLE_SECONDS)
        const wave = ctx.createRadialGradient(
          ripple.x,
          ripple.y,
          Math.max(0, radius - RIPPLE_WIDTH),
          ripple.x,
          ripple.y,
          radius + RIPPLE_WIDTH
        )
        wave.addColorStop(0, rgba(current.accent, 0))
        wave.addColorStop(0.5, rgba(current.accent, strength))
        wave.addColorStop(1, rgba(current.accent, 0))
        paint(wave)
      }
    }

    const frame = (now: number) => {
      frameId = 0
      // The first frame after waking has no previous timestamp to measure from.
      const dt =
        lastTime === 0
          ? 0
          : Math.min(Math.max(now - lastTime, 0) / 1000, MAX_STEP_SECONDS)
      lastTime = now

      const target = pointer.inside ? 1 : 0
      influence += (target - influence) * Math.min(1, dt * 6)
      const ease = Math.min(1, dt * 14)
      pointer.x += (pointer.targetX - pointer.x) * ease
      pointer.y += (pointer.targetY - pointer.y) * ease
      for (const ripple of ripples) ripple.age += dt
      ripples = ripples.filter((ripple) => ripple.age < RIPPLE_SECONDS)

      const settled =
        dt > 0 &&
        ripples.length === 0 &&
        Math.abs(target - influence) < 0.004 &&
        Math.abs(pointer.targetX - pointer.x) < 0.2 &&
        Math.abs(pointer.targetY - pointer.y) < 0.2
      if (settled) influence = target
      draw()

      // Once nothing is changing the loop stops, leaving the last frame up.
      if (settled) lastTime = 0
      else frameId = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (frameId !== 0 || document.hidden || reducedMotion.matches) return
      if (opacity <= 0) return
      frameId = requestAnimationFrame(frame)
    }

    const stop = () => {
      cancelAnimationFrame(frameId)
      frameId = 0
      lastTime = 0
    }

    /** Drop every reaction and show the plain pattern. */
    const rest = () => {
      stop()
      pointer.inside = false
      influence = 0
      ripples = []
      draw()
    }

    const resize = () => {
      width = container.clientWidth || 1
      height = container.clientHeight || 1
      const dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      baseScale = 0
      if (frameId === 0) draw()
    }

    const onScroll = () => {
      if (!fadeOnScroll) return
      const end = Math.max(1, configRef.current.fadeEnd * height)
      const next = Math.max(0, 1 - window.scrollY / end)
      if (next === opacity) return
      const wasHidden = opacity <= 0
      opacity = next
      container.style.opacity = String(opacity)
      if (opacity <= 0) rest()
      else if (wasHidden) draw()
    }

    const track = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointer.targetX = event.clientX - rect.left
      pointer.targetY = event.clientY - rect.top
      const inside =
        opacity > 0 &&
        pointer.targetX >= 0 &&
        pointer.targetX <= rect.width &&
        pointer.targetY >= 0 &&
        pointer.targetY <= rect.height
      // Arriving from outside, the glow starts where the cursor is instead of
      // sliding over from where it last was.
      if (inside && influence < 0.01) {
        pointer.x = pointer.targetX
        pointer.y = pointer.targetY
      }
      pointer.inside = inside
      return inside
    }

    // Mouse and pen hover; a finger only counts while it is down.
    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion.matches) return
      const wasInside = pointer.inside
      if (track(event) || wasInside) wake()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches || !track(event)) return
      if (configRef.current.rippleStrength > 0) {
        ripples.push({ x: pointer.targetX, y: pointer.targetY, age: 0 })
        if (ripples.length > MAX_RIPPLES) ripples.shift()
      }
      wake()
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return
      pointer.inside = false
      wake()
    }

    const onPointerGone = () => {
      pointer.inside = false
      wake()
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else wake()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    resize()
    onScroll()
    redrawRef.current = () => {
      if (frameId === 0) draw()
    }

    document.addEventListener("visibilitychange", onVisibility)
    reducedMotion.addEventListener("change", rest)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    window.addEventListener("pointerup", onPointerEnd, { passive: true })
    window.addEventListener("pointercancel", onPointerEnd, { passive: true })
    document.documentElement.addEventListener("pointerleave", onPointerGone)
    window.addEventListener("blur", onPointerGone)

    return () => {
      stop()
      redrawRef.current = null
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      reducedMotion.removeEventListener("change", rest)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerEnd)
      window.removeEventListener("pointercancel", onPointerEnd)
      document.documentElement.removeEventListener("pointerleave", onPointerGone)
      window.removeEventListener("blur", onPointerGone)
      container.style.opacity = ""
    }
    // Everything else is read live from configRef.
  }, [maxDevicePixelRatio, fadeOnScroll])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{
        pointerEvents: "none",
        overflow: "hidden",
        // Dissolves into the flat page colour instead of ending on an edge.
        maskImage: "linear-gradient(to bottom, #000 55%, transparent)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  )
}
