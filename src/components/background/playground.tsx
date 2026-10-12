"use client"

// Temporary tuning tool for the background. Delete this file and
// src/app/bg-playground once the chosen motif and values are baked into
// config.ts.

import { useTheme } from "next-themes"
import { useState, useSyncExternalStore } from "react"

import { BackgroundLayer } from "./background-layer"
import {
  darkBackgroundSettings,
  lightBackgroundSettings,
  type BackgroundMotif,
  type BackgroundSettings,
} from "./config"

type NumericKey = {
  [K in keyof BackgroundSettings]: BackgroundSettings[K] extends number
    ? K
    : never
}[keyof BackgroundSettings]

type Slider = {
  key: NumericKey
  label: string
  min: number
  max: number
  step: number
}

const GROUPS: { title: string; sliders: Slider[] }[] = [
  {
    title: "Both",
    sliders: [
      { key: "restOpacity", label: "Opacity at rest", min: 0, max: 0.8, step: 0.01 },
      { key: "highlightOpacity", label: "Accent near cursor", min: 0, max: 1, step: 0.01 },
      { key: "interactionRadius", label: "Cursor reach", min: 40, max: 400, step: 5 },
      { key: "bend", label: "Bend", min: 0, max: 1, step: 0.01 },
      { key: "rippleStrength", label: "Click ripple", min: 0, max: 1, step: 0.01 },
      { key: "fadeEnd", label: "Faded out by (scroll)", min: 0.2, max: 1, step: 0.05 },
    ],
  },
  {
    title: "Dot grid",
    sliders: [
      { key: "dotSpacing", label: "Spacing", min: 12, max: 64, step: 1 },
      { key: "dotSize", label: "Dot size", min: 0.5, max: 2.5, step: 0.1 },
    ],
  },
  {
    title: "Contours",
    sliders: [
      { key: "contourScale", label: "Hill size", min: 120, max: 900, step: 10 },
      { key: "contourDensity", label: "Line density", min: 2, max: 16, step: 1 },
      { key: "lineWidth", label: "Line width", min: 0.5, max: 2, step: 0.1 },
    ],
  },
]

const MOTIFS: { motif: BackgroundMotif; name: string }[] = [
  { motif: "dots", name: "Dot grid" },
  { motif: "contours", name: "Contour lines" },
]

const noopSubscribe = () => () => {}

export function BackgroundPlayground() {
  const { resolvedTheme, setTheme } = useTheme()
  // The theme is only known in the browser; render the panel once it is.
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
  const [light, setLight] = useState(lightBackgroundSettings)
  const [dark, setDark] = useState(darkBackgroundSettings)
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const isDark = resolvedTheme === "dark"
  const config = isDark ? dark : light
  const update = (patch: Partial<BackgroundSettings>) =>
    (isDark ? setDark : setLight)((current) => ({ ...current, ...patch }))

  // The motif is the choice being made here, so it is left out of the export.
  const exported = JSON.stringify(
    { light: { ...light, motif: undefined }, dark: { ...dark, motif: undefined } },
    null,
    2
  )

  return (
    <div className="flex flex-1 flex-col">
      {/* The same hero-sized sample twice, one per motif. */}
      <main className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {MOTIFS.map(({ motif, name }) => (
          <section
            key={motif}
            className="relative isolate flex min-h-[calc(100svh-3rem)] flex-col justify-center gap-5 border-border px-6 py-16 md:px-10 md:not-last:border-r"
          >
            <BackgroundLayer
              light={{ ...light, motif }}
              dark={{ ...dark, motif }}
              fadeOnScroll
            />
            <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
              {name}
            </p>
            <h2 className="max-w-md text-4xl font-semibold tracking-tight text-balance">
              A <span className="text-primary">sample</span> headline over the
              background
            </h2>
            <p className="max-w-md text-base leading-relaxed text-foreground/90">
              Leave the cursor still: this should read as a calm, well-typeset
              page. Then move across it and click to see the pattern bend,
              brighten and ripple.
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Muted secondary text is the hardest case for contrast, so check
              this line too.
            </p>
            <div className="max-w-xs rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
              Cards are opaque, so text inside them is never affected.
            </div>
          </section>
        ))}
      </main>
      {/* Room to scroll, to check the fade into the flat page colour. */}
      <div className="flex h-[80svh] items-center justify-center text-sm text-muted-foreground">
        Below the hero the page is flat.
      </div>

      <aside className="fixed right-3 bottom-3 z-50 flex max-h-[calc(100dvh-1.5rem)] w-72 flex-col rounded-xl bg-card/95 text-sm shadow-xl ring-1 ring-foreground/10 backdrop-blur">
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
            <div className="flex flex-wrap gap-2">
              <PanelButton onClick={() => setTheme(isDark ? "light" : "dark")}>
                Editing: {isDark ? "dark" : "light"} theme (switch)
              </PanelButton>
              <PanelButton
                onClick={() =>
                  isDark
                    ? setDark(darkBackgroundSettings)
                    : setLight(lightBackgroundSettings)
                }
              >
                Reset this theme
              </PanelButton>
            </div>

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
