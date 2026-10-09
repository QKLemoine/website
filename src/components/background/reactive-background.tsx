"use client"

import { useEffect, useRef } from "react"

import type { BackgroundConfig } from "./config"
import { onBackgroundEvent } from "./events"
import { addRipple, createSim, resizeSim, stepSim } from "./flow-simulation"
import { createRenderer, type Renderer } from "./renderer"

const MAX_STEP_SECONDS = 1 / 30
/** A frame longer than this counts as slow (60fps is 16.7ms). */
const SLOW_FRAME_MS = 22
/** Gaps this long are pauses, not slow rendering, and are ignored. */
const STALL_MS = 250
const QUALITY_WINDOW_FRAMES = 120
const ACTIVITY_RIPPLE_SECONDS = 1.2
/** One flow particle per this many CSS pixels, so phones aren't crowded. */
const AREA_PER_PARTICLE = 480

/**
 * Quality ladder, walked downward when frames run long: fewer particles, then
 * lower resolution, and finally no trail layer at all.
 */
const QUALITY = [
  { particles: 1, maxDpr: Infinity, flow: true },
  { particles: 0.6, maxDpr: Infinity, flow: true },
  { particles: 0.35, maxDpr: 1, flow: true },
  { particles: 0, maxDpr: 1, flow: false },
] as const

export type BackgroundStats = {
  fps: number
  particles: number
  /** Index into the quality ladder; 0 is full quality. */
  quality: number
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

/** A plain CSS version of the aurora: shown without WebGL and before it starts. */
function staticGradient(config: BackgroundConfig): string {
  const [a, b, c, d] = config.palette
  const alpha = Math.round(config.auroraIntensity * 0.6 * 255)
    .toString(16)
    .padStart(2, "0")
  return [
    `radial-gradient(60% 50% at 18% 22%, ${a}${alpha}, transparent)`,
    `radial-gradient(55% 55% at 82% 30%, ${b}${alpha}, transparent)`,
    `radial-gradient(60% 55% at 70% 85%, ${c}${alpha}, transparent)`,
    `radial-gradient(45% 45% at 22% 80%, ${d}${alpha}, transparent)`,
    config.base,
  ].join(", ")
}

/**
 * Decorative animated background in three layers: an aurora of slowly morphing
 * colour, flow-field particles with trails, and clustered nodes joined by
 * lines. It reacts to the cursor, clicks and taps, scrolling and events sent
 * through ./events. Fills its positioned parent and never takes input.
 */
export default function ReactiveBackground({
  config,
  className,
  getSection,
  onStats,
}: {
  config: BackgroundConfig
  className?: string
  /** Fractional index of the page section in view; defaults to viewports scrolled. */
  getSection?: () => number
  onStats?: (stats: BackgroundStats) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Read every frame, so changing colours or strengths restyles the running
  // field instead of rebuilding it.
  const configRef = useRef(config)
  const getSectionRef = useRef(getSection)
  const onStatsRef = useRef(onStats)
  const redrawRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    configRef.current = config
    getSectionRef.current = getSection
    onStatsRef.current = onStats
    redrawRef.current?.()
  }, [config, getSection, onStats])

  const { particleCount, nodeCount, clusterCount, maxDevicePixelRatio } = config

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    let renderer: Renderer | null = createRenderer(canvas)
    // Without WebGL the CSS gradient on the container is the whole background.
    if (!renderer) return
    canvas.style.opacity = "1"

    // Inner functions are arrows so TypeScript keeps the non-null narrowing above.
    let quality = isLowPower() ? 1 : 0
    const deviceDpr = Math.min(
      window.devicePixelRatio || 1,
      maxDevicePixelRatio
    )
    const width = container.clientWidth || 1
    const height = container.clientHeight || 1
    const capacity = Math.max(
      200,
      Math.min(particleCount, Math.round((width * height) / AREA_PER_PARTICLE))
    )
    const sim = createSim(
      { particleCount: capacity, nodeCount, clusterCount },
      width,
      height
    )

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const pointer = { x: width / 2, y: height / 2, active: false }
    let frameId = 0
    let lastTime = 0
    let frameCount = 0
    let slowFrames = 0
    let slowWindows = 0
    let statsFrames = 0
    let statsStart = 0
    let onScreen = true
    let activity = 0
    let activityTarget = 0
    let activityOrigin = { x: width / 2, y: height / 2 }
    let sinceActivityRipple = 0
    let lastScrollY = window.scrollY

    const currentDpr = () => Math.min(deviceDpr, QUALITY[quality].maxDpr)

    const applyQuality = () => {
      sim.count = Math.round(sim.capacity * QUALITY[quality].particles)
    }

    const resize = () => {
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      resizeSim(sim, w, h)
      renderer?.resize(w, h, currentDpr())
    }

    const section = () =>
      getSectionRef.current?.() ??
      window.scrollY / Math.max(window.innerHeight, 1)

    const auroraScroll = () =>
      (window.scrollY / Math.max(sim.height, 1)) *
      configRef.current.scrollParallax *
      6

    /** Reduced motion and paused states: the aurora alone, frozen. */
    const drawStill = () => {
      sim.section = section()
      renderer?.render(sim, {
        config: configRef.current,
        flow: false,
        clusters: false,
        dt: 0,
        activity: 0,
        scroll: auroraScroll(),
      })
    }

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
        sinceActivityRipple += dt
        if (sinceActivityRipple >= ACTIVITY_RIPPLE_SECONDS) {
          sinceActivityRipple = 0
          addRipple(sim, activityOrigin.x, activityOrigin.y, 0.6)
        }
      }

      const scrollY = window.scrollY
      const scrolled = scrollY - lastScrollY
      lastScrollY = scrollY

      stepSim(
        sim,
        dt,
        {
          flowSpeed: current.flowSpeed,
          flowScale: current.flowScale,
          clusterPull: current.clusterPull,
          interactionStrength: current.interactionStrength,
          interactionRadius: current.interactionRadius,
          linkDistance: current.linkDistance,
        },
        {
          pointerX: pointer.x,
          pointerY: pointer.y,
          pointerActive: pointer.active,
          section: section(),
          // Clamped so a jump to an anchor doesn't fling every particle off screen.
          parallaxShift:
            Math.max(-40, Math.min(40, scrolled)) * current.scrollParallax,
          activity,
        }
      )
      renderer?.render(sim, {
        config: current,
        flow: current.layers.flow && QUALITY[quality].flow,
        clusters: current.layers.clusters,
        dt,
        activity,
        scroll: auroraScroll(),
      })

      // Adaptive quality, measured from real frame times. A step down needs
      // most frames to be slow for two windows in a row, so a one-off stall
      // doesn't cost quality; and it never steps back up, so it can't oscillate.
      frameCount++
      if (elapsed > SLOW_FRAME_MS && elapsed < STALL_MS) slowFrames++
      if (frameCount % QUALITY_WINDOW_FRAMES === 0) {
        const slowWindow = slowFrames > QUALITY_WINDOW_FRAMES * 0.6
        slowFrames = 0
        slowWindows = slowWindow ? slowWindows + 1 : 0
        if (slowWindows >= 2 && quality < QUALITY.length - 1) {
          slowWindows = 0
          quality++
          applyQuality()
          resize()
        }
      }

      statsFrames++
      if (now - statsStart >= 1000) {
        onStatsRef.current?.({
          fps: Math.round((statsFrames * 1000) / (now - statsStart)),
          particles: QUALITY[quality].flow ? sim.count : 0,
          quality,
        })
        statsFrames = 0
        statsStart = now
      }

      frameId = requestAnimationFrame(frame)
    }

    const start = () => {
      if (frameId !== 0 || document.hidden || !onScreen || reducedMotion.matches)
        return
      lastTime = 0
      frameCount = 0
      statsFrames = 0
      statsStart = performance.now()
      lastScrollY = window.scrollY
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

    const track = (event: PointerEvent) => {
      const local = toLocal(event.clientX, event.clientY)
      pointer.x = local.x
      pointer.y = local.y
      pointer.active = true
    }

    // Mouse and pen hover; a finger only counts while it is down.
    const onPointerMove = (event: PointerEvent) => track(event)

    const onPointerDown = (event: PointerEvent) => {
      if (reducedMotion.matches) return
      track(event)
      const local = toLocal(event.clientX, event.clientY)
      addRipple(sim, local.x, local.y, 1)
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType === "touch") pointer.active = false
    }

    const onPointerGone = () => {
      pointer.active = false
    }

    const offBackgroundEvent = onBackgroundEvent((event) => {
      if (reducedMotion.matches) return
      const local = toLocal(event.x, event.y)
      if (event.type === "pulse") {
        addRipple(sim, local.x, local.y, event.strength ?? 1)
      } else {
        activityTarget = event.active ? 1 : 0
        activityOrigin = local
        sinceActivityRipple = ACTIVITY_RIPPLE_SECONDS
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      resize()
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

    // A lost GPU context (driver reset, too many tabs) stops drawing; pick up
    // again with a fresh renderer when the browser restores it.
    const onContextLost = (event: Event) => {
      event.preventDefault()
      stop()
    }
    const onContextRestored = () => {
      renderer = createRenderer(canvas)
      resize()
      if (reducedMotion.matches) drawStill()
      else start()
    }

    applyQuality()
    sim.section = section()
    resize()
    drawStill()
    start()
    redrawRef.current = () => {
      if (frameId === 0) drawStill()
    }

    document.addEventListener("visibilitychange", onVisibility)
    reducedMotion.addEventListener("change", onMotionPreference)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    window.addEventListener("pointerup", onPointerEnd, { passive: true })
    window.addEventListener("pointercancel", onPointerEnd, { passive: true })
    document.documentElement.addEventListener("pointerleave", onPointerGone)
    window.addEventListener("blur", onPointerGone)
    canvas.addEventListener("webglcontextlost", onContextLost)
    canvas.addEventListener("webglcontextrestored", onContextRestored)

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
      window.removeEventListener("pointerup", onPointerEnd)
      window.removeEventListener("pointercancel", onPointerEnd)
      document.documentElement.removeEventListener("pointerleave", onPointerGone)
      window.removeEventListener("blur", onPointerGone)
      canvas.removeEventListener("webglcontextlost", onContextLost)
      canvas.removeEventListener("webglcontextrestored", onContextRestored)
      renderer?.dispose()
      canvas.style.opacity = "0"
    }
    // Only the values that size the simulation rebuild it; everything else is
    // read live from configRef.
  }, [particleCount, nodeCount, clusterCount, maxDevicePixelRatio])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{
        pointerEvents: "none",
        overflow: "hidden",
        background: staticGradient(config),
      }}
    >
      {/* Hidden until WebGL has drawn, so a device without it keeps the gradient. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full"
        style={{ opacity: 0 }}
      />
    </div>
  )
}
