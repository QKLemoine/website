"use client"

import { useEffect, useRef } from "react"

import { onDesktopEvent } from "../desktop-events"
import { defaultWallpaperConfig, type WallpaperConfig } from "./config"
import {
  addPulse,
  createField,
  PULSE_LIFE,
  PULSE_SPEED,
  resizeField,
  stepField,
  type Field,
  type Pointer,
} from "./simulation"

/** The glow layer is drawn at 1/GLOW_SCALE resolution and stretched by CSS, which is both cheaper and softer. */
const GLOW_SCALE = 10
/** Soft gradients barely move, so they are redrawn every few frames. */
const GLOW_EVERY = 4
const MAX_STEP_SECONDS = 1 / 30
/** A frame longer than this counts as slow (60fps is 16.7ms). */
const SLOW_FRAME_MS = 22
/** Gaps this long are pauses, not slow rendering, and are ignored. */
const STALL_MS = 250
const QUALITY_WINDOW_FRAMES = 120
const MIN_PARTICLES = 150
const ACTIVITY_PULSE_SECONDS = 0.8
/** Points at or above this size use the thicker stroke. */
const LARGE_POINT = 1.35

// Static film grain. Very dark gradients only have a few 8-bit shades to work
// with and show visible rings; a little noise dithers them away. It is a
// one-off SVG texture, so it costs nothing per frame.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

function rgba(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

function isLowPower(): boolean {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  return (
    nav.hardwareConcurrency <= 4 ||
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
    nav.connection?.saveData === true
  )
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  field: Field,
  config: WallpaperConfig
) {
  const { width, height } = ctx.canvas
  ctx.globalCompositeOperation = "source-over"
  ctx.fillStyle = config.background
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = "lighter"
  const radius = (Math.min(field.width, field.height) * 0.45) / GLOW_SCALE
  for (let k = 0; k < field.clusterCount; k++) {
    const cx = field.centerX[k] / GLOW_SCALE
    const cy = field.centerY[k] / GLOW_SCALE
    const color = config.palette[k % config.palette.length]
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    gradient.addColorStop(0, rgba(color, config.glowOpacity))
    gradient.addColorStop(1, rgba(color, 0))
    ctx.fillStyle = gradient
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
  }
}

function drawPoints(
  ctx: CanvasRenderingContext2D,
  field: Field,
  config: WallpaperConfig,
  dpr: number,
  activity: number
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  // Every frame starts from a clean canvas and each point is drawn as a short
  // streak along its velocity. (Fading the previous frame instead looks
  // similar but 8-bit alpha never decays to zero, leaving permanent ghosts.)
  ctx.globalCompositeOperation = "source-over"
  ctx.clearRect(0, 0, field.width, field.height)

  ctx.globalCompositeOperation = "lighter"
  ctx.lineCap = "round"
  const alpha = 0.7 + activity * 0.3
  const trail = config.trailLength
  // One path per cluster and size class: a dozen strokes per frame in total.
  for (let k = 0; k < field.clusterCount; k++) {
    ctx.strokeStyle = rgba(config.palette[k % config.palette.length], alpha)
    for (let large = 0; large < 2; large++) {
      ctx.lineWidth = large ? 3.1 : 2
      ctx.beginPath()
      for (let i = 0; i < field.count; i++) {
        if (field.cluster[i] !== k) continue
        if (Number(field.size[i] >= LARGE_POINT) !== large) continue
        const x = field.x[i]
        const y = field.y[i]
        // The tiny offset keeps a resting point from being a zero-length line.
        ctx.moveTo(x - field.vx[i] * trail - 0.01, y - field.vy[i] * trail)
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }

  for (const pulse of field.pulses) {
    const life = 1 - pulse.age / PULSE_LIFE
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * life * pulse.strength})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(pulse.x, pulse.y, pulse.age * PULSE_SPEED, 0, Math.PI * 2)
    ctx.stroke()
  }
}

/**
 * Animated background: points drifting between soft clusters, reacting to the
 * cursor and to desktop events. Self-contained; pass a config to restyle it.
 */
export function Wallpaper({
  config = defaultWallpaperConfig,
}: {
  config?: WallpaperConfig
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const glowCanvas = glowRef.current
    const pointsCanvas = pointsRef.current
    const glow = glowCanvas?.getContext("2d")
    const points = pointsCanvas?.getContext("2d")
    if (!container || !glowCanvas || !pointsCanvas || !glow || !points) return

    // Inner functions are arrows so TypeScript keeps the non-null narrowing above.
    const lowPower = isLowPower()
    let dpr = lowPower
      ? 1
      : Math.min(window.devicePixelRatio || 1, config.maxDevicePixelRatio)
    const options = {
      particleCount: Math.round(config.particleCount * (lowPower ? 0.5 : 1)),
      clusterCount: config.clusterCount,
      interactionStrength: config.interactionStrength,
      interactionRadius: config.interactionRadius,
    }
    const field = createField(
      options,
      container.clientWidth || 1,
      container.clientHeight || 1
    )

    const pointer: Pointer = { x: 0, y: 0, active: false }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frameId = 0
    let lastTime = 0
    let frameCount = 0
    let slowFrames = 0
    let slowWindows = 0
    let activity = 0
    let activityTarget = 0
    let activityOrigin = { x: 0, y: 0 }
    let sinceActivityPulse = 0

    const sizeCanvases = () => {
      const width = container.clientWidth || 1
      const height = container.clientHeight || 1
      resizeField(field, width, height)
      pointsCanvas.width = Math.round(width * dpr)
      pointsCanvas.height = Math.round(height * dpr)
      glowCanvas.width = Math.ceil(width / GLOW_SCALE)
      glowCanvas.height = Math.ceil(height / GLOW_SCALE)
      drawGlow(glow, field, config)
    }

    /** One finished-looking still image: used for reduced motion and before the loop starts. */
    const drawStill = () => {
      drawGlow(glow, field, config)
      drawPoints(points, field, config, dpr, 0)
    }

    const frame = (now: number) => {
      // The first frame has no previous timestamp to measure from. (Comparing
      // against performance.now() instead is wrong: rAF timestamps can be
      // slightly earlier than it, which would produce a negative step.)
      const elapsed = lastTime === 0 ? 0 : now - lastTime
      lastTime = now
      const dt = Math.min(Math.max(elapsed, 0) / 1000, MAX_STEP_SECONDS)

      activity += (activityTarget - activity) * Math.min(1, dt * 3)
      if (activityTarget > 0) {
        sinceActivityPulse += dt
        if (sinceActivityPulse >= ACTIVITY_PULSE_SECONDS) {
          sinceActivityPulse = 0
          addPulse(field, activityOrigin.x, activityOrigin.y, 0.35)
        }
      }

      stepField(field, dt, pointer, activity, options)
      if (frameCount % GLOW_EVERY === 0) drawGlow(glow, field, config)
      drawPoints(points, field, config, dpr, activity)

      // Adaptive quality: if this device can't hold the frame rate, shed
      // points and resolution rather than stutter. A step down needs most
      // frames to be slow for two windows in a row, so a one-off stall (tab
      // switch, GC, a screenshot) doesn't cost quality; and it never steps
      // back up, so quality can't oscillate.
      frameCount++
      if (elapsed > SLOW_FRAME_MS && elapsed < STALL_MS) slowFrames++
      if (frameCount % QUALITY_WINDOW_FRAMES === 0) {
        const slowWindow = slowFrames > QUALITY_WINDOW_FRAMES * 0.6
        slowFrames = 0
        slowWindows = slowWindow ? slowWindows + 1 : 0
        if (slowWindows >= 2 && field.count > MIN_PARTICLES) {
          slowWindows = 0
          field.count = Math.max(MIN_PARTICLES, Math.floor(field.count * 0.65))
          if (dpr > 1) {
            dpr = 1
            sizeCanvases()
          }
        }
      }

      frameId = requestAnimationFrame(frame)
    }

    const start = () => {
      if (frameId !== 0 || document.hidden || reducedMotion.matches) return
      lastTime = 0
      frameCount = 0
      frameId = requestAnimationFrame(frame)
    }

    const stop = () => {
      cancelAnimationFrame(frameId)
      frameId = 0
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    const onMotionPreference = () => {
      stop()
      if (reducedMotion.matches) drawStill()
      else start()
    }

    const onPointerMove = (event: PointerEvent) => {
      // Touch has no hover; reacting to taps would just make the field twitch.
      if (event.pointerType === "touch") return
      const rect = container.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.active = true
    }

    const onPointerGone = () => {
      pointer.active = false
    }

    const offDesktopEvent = onDesktopEvent((event) => {
      if (reducedMotion.matches) return
      const rect = container.getBoundingClientRect()
      const x = event.x - rect.left
      const y = event.y - rect.top
      if (event.type === "pulse") {
        addPulse(field, x, y, event.strength ?? 1)
      } else {
        activityTarget = event.active ? 1 : 0
        activityOrigin = { x, y }
        sinceActivityPulse = ACTIVITY_PULSE_SECONDS
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      sizeCanvases()
      if (frameId === 0) drawStill()
    })
    resizeObserver.observe(container)

    sizeCanvases()
    drawStill()
    start()

    document.addEventListener("visibilitychange", onVisibility)
    reducedMotion.addEventListener("change", onMotionPreference)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onPointerGone)
    window.addEventListener("blur", onPointerGone)

    return () => {
      stop()
      offDesktopEvent()
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      reducedMotion.removeEventListener("change", onMotionPreference)
      window.removeEventListener("pointermove", onPointerMove)
      document.documentElement.removeEventListener("pointerleave", onPointerGone)
      window.removeEventListener("blur", onPointerGone)
    }
  }, [config])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ backgroundColor: config.background }}
    >
      <canvas ref={glowRef} className="absolute inset-0 size-full" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: GRAIN }}
      />
      <canvas ref={pointsRef} className="absolute inset-0 size-full" />
    </div>
  )
}
