"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { useMemo, useSyncExternalStore } from "react"

import {
  darkBackgroundSettings,
  lightBackgroundSettings,
  type BackgroundColors,
  type BackgroundSettings,
} from "./config"

// Client-only and in its own chunk: the background is decoration, so it never
// delays the page's content or first paint.
const ReactiveBackground = dynamic(() => import("./reactive-background"), {
  ssr: false,
})

const COLOR_TOKENS = ["--text-muted", "--brand"]
const HEX = /^#[0-9a-f]{6}$/i

function readColorTokens(): string {
  const style = getComputedStyle(document.documentElement)
  return COLOR_TOKENS.map((name) => style.getPropertyValue(name).trim()).join(",")
}

function subscribeToTheme(onChange: () => void) {
  // The theme is a class on <html>; the token values change with it.
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  })
  return () => observer.disconnect()
}

/**
 * The background's colours, read from the CSS tokens of the active theme so
 * the canvas and the page can never disagree.
 */
function useBackgroundColors(): BackgroundColors {
  const tokens = useSyncExternalStore(subscribeToTheme, readColorTokens, () => "")
  return useMemo(() => {
    // The canvas needs plain hex; anything else falls back to a neutral grey.
    const [ink, accent] = tokens
      .split(",")
      .map((value) => (HEX.test(value) ? value : "#808080"))
    return { ink: ink ?? "#808080", accent: accent ?? "#808080" }
  }, [tokens])
}

/**
 * The background of one section, themed to match. Give the section
 * `relative isolate` so this sits behind its content and nothing else.
 */
export function BackgroundLayer({
  light = lightBackgroundSettings,
  dark = darkBackgroundSettings,
  fadeOnScroll = false,
}: {
  light?: BackgroundSettings
  dark?: BackgroundSettings
  fadeOnScroll?: boolean
}) {
  const { resolvedTheme } = useTheme()
  const colors = useBackgroundColors()
  const settings = resolvedTheme === "dark" ? dark : light
  const config = useMemo(() => ({ ...settings, ...colors }), [settings, colors])

  return (
    <ReactiveBackground
      config={config}
      fadeOnScroll={fadeOnScroll}
      className="absolute inset-0 -z-10"
    />
  )
}
