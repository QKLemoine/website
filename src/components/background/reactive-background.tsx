"use client"

import { useEffect, useRef } from "react"

import type { BackgroundConfig } from "./config"
import { onBackgroundEvent } from "./events"
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
const MIN_PARTICLES = 60
const ACTIVITY_PULSE_SECONDS = 0.9
/** Points at or above this size use the thicker stroke. */
const LARGE_POINT = 1.35

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
  config: BackgroundConfig
) {
  const { width, height } = ctx.canvas
  // Both layers stay transparent so the page's own background shows through
  // and the component works on any theme.
  ctx.clearRect(0, 0, width, height)
  const radius = (Math.min(field.width, field.height) * 0.5) / GLOW_SCALE
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
  config: BackgroundConfig,
  dpr: number,
  activity: number
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  // Every frame starts from a clean canvas and each point is drawn as a short
  // streak along its velocity. (Fading the previous frame instead looks
  // similar but 8-bit alpha never decays to zero, leaving permanent ghosts.)
  ctx.globalCompositeOperation = "source-over"
  ctx.clearRect(0, 0, field.width, field.height)

  ctx.globalCompositeOperation = config.blend
  ctx.lineCap = "round"
  const alpha = config.pointOpacity * (1 + activity * 0.35)
  const trail = config.trailLength
  // One path per cluster and size class: about ten strokes per frame in total.
  for (let k = 0; k < field.clusterCount; k++) {
    ctx.strokeStyle = rgba(config.palette[k % config.palette.length], alpha)
    for (let large = 0; large < 2; large++) {
      ctx.lineWidth = large ? 3 : 2
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

  ctx.globalCompositeOperation = "source-over"
  for (const pulse of field.pulses) {
    const life = 1 - pulse.age / PULSE_LIFE
    ctx.strokeStyle = `rgba(${config.rippleColor}, ${0.14 * life * pulse.strength})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(pulse.x, pulse.y, pulse.age * PULSE_SPEED, 0, Math.PI * 2)
    ctx.stroke()
  }
}

/**
 * Decorative animated background: points drifting between soft clusters, like
 * a projected embedding space. It reacts to the cursor, clicks and taps, page
 * scroll, and events sent through ./events. Fills its positioned parent.
 */
export default function ReactiveBackground({
  config,
  className,
}: {
  config: BackgroundConfig
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<HTMLCanvasElement>(null)
  // Colours and strengths are read from here every frame, so a theme switch
  // restyles the existing field instead of rebuilding it.
  const configRef = useRef(config)
  const redrawRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    configRef.current = config
    redrawRef.current?.()
  }, [config])

  const { particleCount, areaPerParticle, clusterCount, maxDevicePixelRatio } =
    config

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
      : Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio)
    const width = container.clientWidth || 1
    const height = container.clientHeight || 1
    const byArea = Math.round((width * height) / areaPerParticle)
    const count = Math.max(
      MIN_PARTICLES,
      Math.round(Math.min(particleCount, byArea) * (lowPower ? 0.5 : 1))
    )
    const field = createField(
      {
        particleCount: count,
        clusterCount,
        interactionStrength: 0,
        interactionRadius: 0,
      },
      width,
      height
    )

    const pointer: Pointer = { x: 0, y: 0, active: false }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frameId = 0
    let lastTime = 0
    let frameCount = 0
    let slowFrames = 0
    let slowWindows = 0
    let onScreen = true
    let activity = 0
    let activityTarget = 0
    let activityOrigin = { x: 0, y: 0 }
    let sinceActivityPulse = 0

    const sizeCanvases = () => {
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      resizeField(field, w, h)
      pointsCanvas.width = Math.round(w * dpr)
      pointsCanvas.height = Math.round(h * dpr)
      glowCanvas.width = Math.ceil(w / GLOW_SCALE)
      glowCanvas.height = Math.ceil(h / GLOW_SCALE)
      drawGlow(glow, field, configRef.current)
    }

    /** One finished-looking still image: used for reduced motion and whenever the loop is stopped. */
    const drawStill = () => {
      drawGlow(glow, field, configRef.current)
      drawPoints(points, field, configRef.current, dpr, 0)
    }

    const scrollDrift = () =>
      (window.scrollY / Math.max(window.innerHeight, 1)) *
      configRef.current.scrollShift

    const frame = (now: number) => {
      const current = configRef.current
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
          addPulse(field, activityOrigin.x, activityOrigin.y, 0.3)
        }
      }

      // Scrolling moves the clusters along their paths. Easing toward the
      // target turns a flick of the wheel into a slow glide of the whole field.
      field.drift += (scrollDrift() - field.drift) * Math.min(1, dt * 2.5)

      stepField(field, dt, pointer, activity, {
        particleCount: field.capacity,
        clusterCount: field.clusterCount,
        interactionStrength: current.interactionStrength,
        interactionRadius: current.interactionRadius,
      })
      if (frameCount % GLOW_EVERY === 0) drawGlow(glow, field, current)
      drawPoints(points, field, current, dpr, activity)

      // Adaptive quality: if this device can't hold the frame rate, shed
      // points and resolution rather than stutter. A step down needs most
      // frames to be slow for two windows in a row, so a one-off stall (tab
      // switch, GC) doesn't cost quality; and it never steps back up, so
      // quality can't oscillate.
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
      if (frameId !== 0 || document.hidden || !onScreen || reducedMotion.matches)
        return
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

    const toLocal = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const onPointerMove = (event: PointerEvent) => {
      // Touch has no hover; a finger dragging to scroll shouldn't shove the
      // field around. Touch gets ripples and the scroll shift instead.
      if (event.pointerType === "touch") return
      const local = toLocal(event.clientX, event.clientY)
      pointer.x = local.x
      pointer.y = local.y
      pointer.active = true
    }

    const onPointerGone = () => {
      pointer.active = false
    }

    // Clicks and taps anywhere on the page send out a soft ripple.
    const onPointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches) return
      const local = toLocal(event.clientX, event.clientY)
      addPulse(field, local.x, local.y, configRef.current.clickStrength)
    }

    const offBackgroundEvent = onBackgroundEvent((event) => {
      if (reducedMotion.matches) return
      const local = toLocal(event.x, event.y)
      if (event.type === "pulse") {
        addPulse(field, local.x, local.y, event.strength ?? 1)
      } else {
        activityTarget = event.active ? 1 : 0
        activityOrigin = local
        sinceActivityPulse = ACTIVITY_PULSE_SECONDS
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      sizeCanvases()
      if (frameId === 0) drawStill()
    })
    resizeObserver.observe(container)

    // Nothing to animate while the canvas is scrolled out of view.
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) start()
      else stop()
    })
    intersectionObserver.observe(container)

    field.drift = scrollDrift()
    sizeCanvases()
    drawStill()
    start()
    redrawRef.current = () => {
      if (frameId === 0) drawStill()
    }

    document.addEventListener("visibilitychange", onVisibility)
    reducedMotion.addEventListener("change", onMotionPreference)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    document.documentElement.addEventListener("pointerleave", onPointerGone)
    window.addEventListener("blur", onPointerGone)

    return () => {
      stop()
      redrawRef.current = null
      offBackgroundEvent()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      reducedMotion.removeEventListener("change", onMotionPreference)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      document.documentElement.removeEventListener("pointerleave", onPointerGone)
      window.removeEventListener("blur", onPointerGone)
    }
    // Only the values that size the simulation rebuild it; everything else is
    // read live from configRef.
  }, [particleCount, areaPerParticle, clusterCount, maxDevicePixelRatio])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ pointerEvents: "none", overflow: "hidden" }}
    >
      <canvas ref={glowRef} className="absolute inset-0 size-full" />
      <canvas ref={pointsRef} className="absolute inset-0 size-full" />
    </div>
  )
}
