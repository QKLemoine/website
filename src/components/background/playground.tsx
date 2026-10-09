"use client"

// Temporary tuning tool for the background. Delete this file and
// src/app/bg-playground once the chosen values are baked into config.ts.

import { useTheme } from "next-themes"
import { useState, useSyncExternalStore } from "react"

import { BackgroundLayer } from "./background-layer"
import {
  darkBackgroundConfig,
  lightBackgroundConfig,
  type BackgroundConfig,
  type BackgroundLayers,
} from "./config"
import { emitBackgroundEvent } from "./events"
import type { BackgroundStats } from "./reactive-background"

const QUALITY_NAMES = ["full", "fewer particles", "low resolution", "no trails"]

type NumericKey = {
  [K in keyof BackgroundConfig]: BackgroundConfig[K] extends number ? K : never
}[keyof BackgroundConfig]

type Slider = {
  key: NumericKey
  label: string
  min: number
  max: number
  step: number
}

const GROUPS: { title: string; sliders: Slider[] }[] = [
  {
    title: "Aurora",
    sliders: [
      { key: "auroraIntensity", label: "Intensity", min: 0, max: 0.8, step: 0.01 },
      { key: "auroraScale", label: "Blob detail", min: 0.5, max: 4, step: 0.05 },
      { key: "auroraSpeed", label: "Morph speed", min: 0, max: 4, step: 0.05 },
    ],
  },
  {
    title: "Flow particles",
    sliders: [
      { key: "particleCount", label: "Count (max)", min: 200, max: 6000, step: 100 },
      { key: "particleSize", label: "Size", min: 0.5, max: 5, step: 0.1 },
      { key: "particleOpacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
      { key: "trailLength", label: "Trail length (s)", min: 0.05, max: 4, step: 0.05 },
      { key: "flowSpeed", label: "Flow speed", min: 0, max: 160, step: 1 },
      { key: "flowScale", label: "Swirl tightness", min: 0.2, max: 4, step: 0.05 },
    ],
  },
  {
    title: "Clusters",
    sliders: [
      { key: "clusterCount", label: "Clusters", min: 1, max: 10, step: 1 },
      { key: "clusterPull", label: "Gathering", min: 0, max: 0.6, step: 0.01 },
      { key: "nodeCount", label: "Nodes", min: 0, max: 260, step: 5 },
      { key: "nodeOpacity", label: "Node opacity", min: 0, max: 1, step: 0.01 },
      { key: "linkDistance", label: "Link distance", min: 20, max: 220, step: 2 },
      { key: "lineOpacity", label: "Line opacity", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: "Interaction",
    sliders: [
      { key: "interactionStrength", label: "Cursor vortex", min: 0, max: 3, step: 0.05 },
      { key: "interactionRadius", label: "Cursor reach", min: 40, max: 500, step: 5 },
      { key: "rippleStrength", label: "Click ripple", min: 0, max: 1, step: 0.01 },
      { key: "scrollParallax", label: "Scroll parallax", min: 0, max: 0.3, step: 0.005 },
    ],
  },
  {
    title: "Legibility and performance",
    sliders: [
      { key: "contentWidth", label: "Text column width", min: 0, max: 1600, step: 16 },
      { key: "contentDim", label: "Calm behind text", min: 0, max: 1, step: 0.01 },
      { key: "maxDevicePixelRatio", label: "Resolution cap", min: 1, max: 2, step: 0.25 },
    ],
  },
]

const LAYERS: { key: keyof BackgroundLayers; label: string }[] = [
  { key: "aurora", label: "Aurora" },
  { key: "flow", label: "Flow particles" },
  { key: "clusters", label: "Clusters" },
]

const SECTIONS = ["Hero", "Projects", "About", "Experience", "Contact"]

const noopSubscribe = () => () => {}

export function BackgroundPlayground() {
  const { resolvedTheme, setTheme } = useTheme()
  // The theme is only known in the browser; render the panel once it is.
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
  const [light, setLight] = useState(lightBackgroundConfig)
  const [dark, setDark] = useState(darkBackgroundConfig)
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<BackgroundStats | null>(null)

  const isDark = resolvedTheme === "dark"
  const config = isDark ? dark : light
  const update = (patch: Partial<BackgroundConfig>) =>
    (isDark ? setDark : setLight)((current) => ({ ...current, ...patch }))

  const exported = JSON.stringify({ light, dark }, null, 2)

  const simulateStreaming = () => {
    const origin = { x: window.innerWidth - 240, y: window.innerHeight - 300 }
    emitBackgroundEvent({ type: "activity", active: true, ...origin })
    window.setTimeout(
      () => emitBackgroundEvent({ type: "activity", active: false, ...origin }),
      4000
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <BackgroundLayer light={light} dark={dark} onStats={setStats} />

      {/* Sample page content, to judge legibility and the per-section shift. */}
      <main>
        {SECTIONS.map((name, index) => (
          <section
            key={name}
            className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-5 px-6 py-20"
          >
            <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
              Section {index + 1} · {name}
            </p>
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight">
              Sample heading over the background
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/90">
              Body text sits directly on the background, like the About section
              of the site. Move the cursor, click, and scroll between sections
              while reading this to check that it stays comfortable.
            </p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Muted secondary text is the hardest case for contrast, so check
              this line in the busiest parts of the field.
            </p>
            <div className="max-w-md rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
              Cards are opaque, so text inside them is never affected.
            </div>
          </section>
        ))}
      </main>

      <aside className="fixed top-3 right-3 z-50 flex max-h-[calc(100dvh-1.5rem)] w-80 flex-col rounded-xl bg-card/95 text-sm shadow-xl ring-1 ring-foreground/10 backdrop-blur">
        <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <h1 className="font-semibold">Background playground</h1>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-md px-2 py-1 text-xs hover:bg-muted"
          >
            {collapsed ? "Show" : "Hide"}
          </button>
        </header>

        {ready && !collapsed && (
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-3">
            <p className="text-xs text-muted-foreground tabular-nums" aria-live="off">
              {stats
                ? `${stats.fps} fps · ${stats.particles} particles · quality: ${QUALITY_NAMES[stats.quality]}`
                : "measuring…"}
            </p>
            <div className="flex flex-wrap gap-2">
              <PanelButton onClick={() => setTheme(isDark ? "light" : "dark")}>
                Editing: {isDark ? "dark" : "light"} theme (switch)
              </PanelButton>
              <PanelButton onClick={simulateStreaming}>
                Simulate agent streaming
              </PanelButton>
              <PanelButton
                onClick={() =>
                  (isDark ? setDark : setLight)(
                    isDark ? darkBackgroundConfig : lightBackgroundConfig
                  )
                }
              >
                Reset this theme
              </PanelButton>
            </div>

            <Group title="Layers">
              {LAYERS.map((layer) => (
                <label key={layer.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.layers[layer.key]}
                    onChange={(event) =>
                      update({
                        layers: {
                          ...config.layers,
                          [layer.key]: event.target.checked,
                        },
                      })
                    }
                  />
                  {layer.label}
                </label>
              ))}
            </Group>

            <Group title="Colours">
              <ColorField
                label="Base"
                value={config.base}
                onChange={(base) => update({ base })}
              />
              {config.palette.map((color, index) => (
                <ColorField
                  key={index}
                  label={`Hue ${index + 1}`}
                  value={color}
                  onChange={(next) => {
                    const palette: BackgroundConfig["palette"] = [
                      ...config.palette,
                    ]
                    palette[index] = next
                    update({ palette })
                  }}
                />
              ))}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.additive}
                  onChange={(event) =>
                    update({ additive: event.target.checked })
                  }
                />
                Additive (glow) blending
              </label>
            </Group>

            {GROUPS.map((group) => (
              <Group key={group.title} title={group.title}>
                {group.sliders.map((slider) => (
                  <label key={slider.key} className="block">
                    <span className="flex justify-between text-xs">
                      <span>{slider.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {config[slider.key]}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={config[slider.key]}
                      onChange={(event) =>
                        update({ [slider.key]: Number(event.target.value) })
                      }
                      className="w-full"
                    />
                  </label>
                ))}
              </Group>
            ))}

            <Group title="Export">
              <PanelButton
                onClick={() => {
                  void navigator.clipboard.writeText(exported).then(() => {
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1500)
                  })
                }}
              >
                {copied ? "Copied" : "Copy settings (both themes)"}
              </PanelButton>
              <textarea
                readOnly
                aria-label="Settings as JSON"
                value={exported}
                className="h-28 w-full rounded-md border border-border bg-background p-2 font-mono text-[11px]"
              />
            </Group>
          </div>
        )}
      </aside>
    </div>
  )
}

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function PanelButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
    >
      {children}
    </button>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
        />
      </span>
    </label>
  )
}
