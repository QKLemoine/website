"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { useVideosPaused } from "@/components/home/video-motion"
import { cn } from "@/lib/utils"

import { drawPlot, drawScene, readPalette, type Palette } from "./draw"
import {
  MonopropSim,
  phaseName,
  T_LAND,
  T_LAUNCH,
  WINDOW,
  type Sensors,
} from "./sim"

const LABEL = "type-label text-muted-foreground"
const PANEL = "rounded-sm border border-border bg-card"

/** Pre-runs a flight to mid-hover, for still frames. */
function midFlight(sim: MonopropSim, sensors: Sensors) {
  while (sim.S.t < 11) sim.step(sensors)
}

/**
 * Runs `frame(dt)` on every animation frame while `el` is on screen and
 * `active` is true. Otherwise it draws a single still frame, again whenever
 * the size, the theme or `redraw` changes.
 */
function useAnimation(
  el: React.RefObject<Element | null>,
  active: boolean,
  frame: (dt: number) => void,
  redraw: unknown = null
) {
  const frameRef = useRef(frame)
  useEffect(() => {
    frameRef.current = frame
  })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = el.current
    if (!node) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(node)
    const ro = new ResizeObserver(() => frameRef.current(0))
    ro.observe(node)
    const mo = new MutationObserver(() => frameRef.current(0))
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => {
      io.disconnect()
      ro.disconnect()
      mo.disconnect()
    }
  }, [el])

  useEffect(() => {
    if (!visible) return
    if (!active) {
      const id = requestAnimationFrame(() => frameRef.current(0))
      return () => cancelAnimationFrame(id)
    }
    let last: number | null = null
    let id = requestAnimationFrame(function tick(ts) {
      const dt = last === null ? 0 : Math.min(0.1, (ts - last) / 1000)
      last = ts
      frameRef.current(dt)
      id = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(id)
  }, [visible, active, redraw])
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * The tile's moving picture: the scene alone, flying the default flight
 * with every sensor on. Always drawn in the dark palette, like the clips.
 */
export function MonopropPreview({ playing }: { playing: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const sim = useRef<MonopropSim | null>(null)
  const acc = useRef(0)
  const sensors: Sensors = { gps: true, lidar: true, imuB: true }

  useAnimation(canvas, playing, (dt) => {
    const cv = canvas.current
    if (!cv) return
    if (!sim.current) {
      sim.current = new MonopropSim()
      midFlight(sim.current, sensors)
    }
    acc.current += dt
    acc.current -= sim.current.advance(acc.current, sensors)
    drawScene(cv, sim.current.S, readPalette(cv), true)
  })

  return (
    // Spans, not divs: the preview sits inside the tile's button.
    <span className="monoprop dark block size-full">
      <canvas ref={canvas} aria-hidden className="block size-full" />
    </span>
  )
}

function Toggle({
  checked,
  onChange,
  swatch,
  children,
}: {
  checked: boolean
  onChange: (on: boolean) => void
  swatch: string
  children: ReactNode
}) {
  return (
    <label className="flex min-h-6 cursor-pointer items-center justify-between gap-3 type-small">
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2.5 rounded-[2px]"
          style={{ background: swatch }}
        />
        {children}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-5 w-9 shrink-0 rounded-full bg-border transition-colors peer-checked:bg-(--mp-lidar) peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-background after:transition-transform peer-checked:after:translate-x-4 motion-reduce:transition-none motion-reduce:after:transition-none"
      />
    </label>
  )
}

const BUTTON =
  "inline-flex min-h-8 items-center rounded-sm border border-border px-3 type-small font-medium outline-none transition-colors hover:border-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-45"

const STEPS = [
  {
    title: "Align",
    text: "On the pad, the navigator waits for 2 s of stillness, reads gravity off the accelerometers to find which way is up, and measures the ground with the LiDAR.",
  },
  {
    title: "Predict",
    text: "Every 10 ms the IMU's rotation and acceleration move the estimate forward, and its uncertainty grows.",
  },
  {
    title: "Correct",
    text: "GPS (5 Hz) and the tilt-corrected LiDAR range (50 Hz) pull the estimate back toward reality, one measurement at a time.",
  },
  {
    title: "Gate",
    text: "A reading that disagrees with the prediction far beyond its expected noise is refused, so one bad fix can't drag the vehicle off course.",
  },
]

/**
 * The full interactive console, shown in the project's dialog: the scene,
 * two error plots, the navigator's readouts, and switches to turn sensors
 * off or inject a bad GPS fix.
 */
export function MonopropDemo() {
  const root = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLCanvasElement>(null)
  const plotZ = useRef<HTMLCanvasElement>(null)
  const plotX = useRef<HTMLCanvasElement>(null)
  const sim = useRef<MonopropSim | null>(null)
  const acc = useRef(0)
  const out = useRef<Record<string, HTMLElement | null>>({})

  // Follows the site's video switch (paused by default under reduced
  // motion) until the visitor presses Play or Pause here.
  const videosPaused = useVideosPaused()
  const [choice, setChoice] = useState<boolean | null>(null)
  const playing = choice ?? !videosPaused
  const [speed, setSpeed] = useState(1)
  const [sensors, setSensors] = useState<Sensors>({
    gps: true,
    lidar: true,
    imuB: true,
  })
  const [badPending, setBadPending] = useState(false)
  const [aligned, setAligned] = useState(false)
  // Bumped by Restart, so a paused demo still redraws.
  const [restarts, setRestarts] = useState(0)

  const write = (key: string, text: string) => {
    const node = out.current[key]
    if (node && node.textContent !== text) node.textContent = text
  }

  useAnimation(
    root,
    playing,
    (dt) => {
      if (!scene.current || !plotZ.current || !plotX.current) return
      if (!sim.current) {
        sim.current = new MonopropSim()
        if (prefersReducedMotion()) midFlight(sim.current, sensors)
      }
      const s = sim.current
      acc.current += dt * speed
      acc.current -= s.advance(acc.current, sensors)

      const col: Palette = readPalette(scene.current)
      drawScene(scene.current, s.S, col, sensors.lidar)
      drawPlot(plotZ.current, s.S, col, "ez", "sz", 0.3)
      drawPlot(plotX.current, s.S, col, "ex", "sx", 1.5)

      const S = s.S
      const fmt = (v: number) => (v >= 0 ? " " : "") + v.toFixed(2)
      write("clock", `t = ${S.t.toFixed(2)} s`)
      write("phase", phaseName(S.t))
      write(
        "nav",
        !S.aligned
          ? "Waiting for stillness"
          : S.t < T_LAUNCH
            ? "Aligned on the pad"
            : S.t < T_LAND
              ? "Tracking flight"
              : "Tracking, landed"
      )
      const bar = out.current.bar
      if (bar)
        bar.style.width = S.aligned ? "100%" : `${(100 * S.win.n) / WINDOW}%`
      if (S.aligned && S.truth) {
        const T = S.truth
        write("alt", `${S.x[1].toFixed(2)} / ${T.z.toFixed(2)} m`)
        write("ex", `${fmt(S.x[0] - T.x)} m`)
        write("eth", `${fmt(((S.x[4] - T.th) * 180) / Math.PI)}°`)
        write("drift", `${Math.hypot(S.dr.x - T.x, S.dr.z - T.z).toFixed(1)} m`)
      } else {
        ;["alt", "ex", "eth", "drift"].forEach((k) => write(k, "–"))
      }
      write("imu", S.imuMode)
      write("gps", `${S.gpsAcc} / ${S.gpsRej}`)
      write("lidar", `${S.lidAcc} / ${S.lidSkip}`)
      if (S.aligned !== aligned) setAligned(S.aligned)
      if (S.badPending !== badPending) setBadPending(S.badPending)
    },
    `${restarts}-${sensors.gps}-${sensors.lidar}-${sensors.imuB}`
  )

  const set = (key: keyof Sensors) => (on: boolean) =>
    setSensors((prev) => ({ ...prev, [key]: on }))

  const readouts: [string, string][] = [
    ["alt", "Altitude, est / true"],
    ["ex", "Horizontal error"],
    ["eth", "Tilt error"],
    ["drift", "IMU-only drift"],
    ["imu", "IMU mode"],
    ["gps", "GPS used / rejected"],
    ["lidar", "LiDAR used / skipped"],
  ]

  const legend: [string, string, string][] = [
    ["var(--text)", "solid", "True vehicle"],
    ["var(--brand)", "dashed", "Filter estimate, 2σ ellipse"],
    ["var(--mp-gps)", "solid", "GPS fix"],
    ["var(--mp-lidar)", "solid", "LiDAR beam"],
    ["var(--mp-drift)", "dotted", "IMU only, no correction"],
  ]

  return (
    <div ref={root} className="monoprop space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-3">
          <div
            className={cn(
              PANEL,
              "relative aspect-[4/3] overflow-hidden sm:aspect-video"
            )}
          >
            <canvas
              ref={scene}
              role="img"
              aria-label="Side view of the lander with its true and estimated position"
              className="absolute inset-0 block size-full"
            />
            <span
              ref={(n) => {
                out.current.clock = n
              }}
              className="pointer-events-none absolute top-2.5 left-3 font-mono type-caption text-muted-foreground"
            >
              t = 0.00 s
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [plotZ, "Altitude error"],
                [plotX, "Horizontal error"],
              ] as const
            ).map(([ref, title]) => (
              <div key={title} className={cn(PANEL, "px-3 pt-2.5 pb-2")}>
                <h3 className="type-small font-semibold">{title}</h3>
                <p className="type-caption text-muted-foreground">
                  Estimate minus truth, with the filter&apos;s own ±2σ band
                </p>
                <canvas
                  ref={ref}
                  aria-hidden
                  className="mt-1 block h-28 w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className={cn(PANEL, "p-4")}>
            <p className={LABEL}>Navigator</p>
            <p
              ref={(n) => {
                out.current.nav = n
              }}
              className="mt-2 type-lead font-semibold"
              aria-live="polite"
            >
              Waiting for stillness
            </p>
            <p
              ref={(n) => {
                out.current.phase = n
              }}
              className="type-small text-muted-foreground"
            >
              Vehicle on the pad
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
              <i
                ref={(n) => {
                  out.current.bar = n
                }}
                className="block h-full w-0 bg-primary"
              />
            </div>
          </div>

          <div className={cn(PANEL, "p-4")}>
            <p className={LABEL}>Readouts</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 type-small">
              {readouts.map(([key, label]) => (
                <div key={key} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd
                    ref={(n) => {
                      out.current[key] = n
                    }}
                    className="text-right font-mono whitespace-nowrap tabular-nums"
                  >
                    –
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={cn(PANEL, "space-y-3 p-4")}>
            <p className={LABEL}>Controls</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setChoice(!playing)}
                className={cn(
                  BUTTON,
                  "border-foreground bg-foreground text-background"
                )}
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  sim.current?.reset()
                  acc.current = 0
                  setRestarts((n) => n + 1)
                }}
                className={BUTTON}
              >
                Restart
              </button>
            </div>
            <div
              role="radiogroup"
              aria-label="Playback speed"
              className="inline-flex overflow-hidden rounded-sm border border-border"
            >
              {[0.5, 1, 2].map((v) => (
                <label key={v} className="relative">
                  <input
                    type="radio"
                    name="monoprop-speed"
                    checked={speed === v}
                    onChange={() => setSpeed(v)}
                    className="peer sr-only"
                  />
                  <span className="block cursor-pointer px-2.5 py-1.5 type-label peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60">
                    {v}×
                  </span>
                </label>
              ))}
            </div>
            <Toggle
              checked={sensors.gps}
              onChange={set("gps")}
              swatch="var(--mp-gps)"
            >
              GPS
            </Toggle>
            <Toggle
              checked={sensors.lidar}
              onChange={set("lidar")}
              swatch="var(--mp-lidar)"
            >
              LiDAR
            </Toggle>
            <Toggle
              checked={sensors.imuB}
              onChange={set("imuB")}
              swatch="var(--text-muted)"
            >
              Second IMU
            </Toggle>
            <button
              type="button"
              disabled={!sensors.gps || !aligned || badPending}
              onClick={() => {
                sim.current?.sendBadGps()
                setBadPending(true)
              }}
              className={BUTTON}
            >
              Send a bad GPS fix
            </button>
          </div>

          <div className={cn(PANEL, "space-y-1.5 p-4 type-small")}>
            <p className={cn(LABEL, "mb-2")}>Legend</p>
            {legend.map(([color, style, label]) => (
              <div key={label} className="flex items-center gap-2">
                <i
                  aria-hidden
                  className="w-4.5 shrink-0 border-t-2"
                  style={{
                    borderColor: color,
                    borderTopStyle: style as "solid",
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.title} className={cn(PANEL, "p-4")}>
            <h4 className="type-small font-bold">{step.title}</h4>
            <p className="mt-1 type-caption text-muted-foreground">
              {step.text}
            </p>
          </div>
        ))}
      </div>

      <p className="max-w-[90ch] type-caption text-muted-foreground">
        Simulated data. This demo runs a planar (2D) version of the filter,
        written in TypeScript for the site: position, velocity, tilt and sensor
        biases. The flight software runs the full 15-state, 3D filter in Rust on
        the vehicle&apos;s Teensy 4.1 flight computer.
      </p>
    </div>
  )
}
