"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"

import {
  darkBackgroundSettings,
  lightBackgroundSettings,
  type BackgroundColors,
  type BackgroundSettings,
} from "./config"

import type { BackgroundStats } from "./reactive-background"

// Client-only and in its own chunk: the background is decoration, so it never
// delays the page's content or first paint.
const ReactiveBackground = dynamic(() => import("./reactive-background"), {
  ssr: false,
})

const COLOR_TOKENS = ["--page", "--field-1", "--field-2", "--field-3", "--field-4"]
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
export function useBackgroundColors(): BackgroundColors {
  const tokens = useSyncExternalStore(subscribeToTheme, readColorTokens, () => "")
  return useMemo(() => {
    // The canvas needs plain hex; anything else falls back to a neutral grey.
    const [base, ...hues] = tokens
      .split(",")
      .map((value) => (HEX.test(value) ? value : "#808080"))
    return {
      base: base ?? "#808080",
      palette: [
        hues[0] ?? "#808080",
        hues[1] ?? "#808080",
        hues[2] ?? "#808080",
        hues[3] ?? "#808080",
      ],
    }
  }, [tokens])
}

/**
 * Tracks which `main > section` is at the middle of the viewport, as a
 * fractional index, so the background can shift between sections.
 */
function useSectionProgress(): () => number {
  const tops = useRef<number[]>([])

  useEffect(() => {
    const main = document.querySelector("main")
    if (!main) return
    const measure = () => {
      tops.current = Array.from(
        main.querySelectorAll<HTMLElement>(":scope > section")
      ).map((section) => section.getBoundingClientRect().top + window.scrollY)
    }
    measure()
    // Section heights change when disclosures open, fonts load, or the window resizes.
    const observer = new ResizeObserver(measure)
    observer.observe(main)
    return () => observer.disconnect()
  }, [])

  return useCallback(() => {
    const list = tops.current
    if (list.length === 0) return window.scrollY / Math.max(window.innerHeight, 1)
    const middle = window.scrollY + window.innerHeight / 2
    let index = 0
    while (index < list.length - 1 && middle >= list[index + 1]) index++
    const start = list[index]
    const end =
      list[index + 1] ?? document.documentElement.scrollHeight
    const fraction = Math.max(0, Math.min(1, (middle - start) / (end - start)))
    return index + fraction
  }, [])
}

/** The page-wide background: fixed behind all content, themed to match. */
export function BackgroundLayer({
  light = lightBackgroundSettings,
  dark = darkBackgroundSettings,
  colors,
  onStats,
}: {
  light?: BackgroundSettings
  dark?: BackgroundSettings
  /** Overrides the theme tokens; only the tuning playground uses this. */
  colors?: BackgroundColors
  onStats?: (stats: BackgroundStats) => void
}) {
  const { resolvedTheme } = useTheme()
  const tokenColors = useBackgroundColors()
  const getSection = useSectionProgress()
  const settings = resolvedTheme === "dark" ? dark : light
  const config = useMemo(
    () => ({ ...settings, ...(colors ?? tokenColors) }),
    [settings, colors, tokenColors]
  )

  return (
    <ReactiveBackground
      config={config}
      getSection={getSection}
      onStats={onStats}
      className="fixed inset-0 -z-10"
    />
  )
}
