"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { useCallback, useEffect, useRef } from "react"

import {
  darkBackgroundConfig,
  lightBackgroundConfig,
  type BackgroundConfig,
} from "./config"

import type { BackgroundStats } from "./reactive-background"

// Client-only and in its own chunk: the background is decoration, so it never
// delays the page's content or first paint.
const ReactiveBackground = dynamic(() => import("./reactive-background"), {
  ssr: false,
})

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
  light = lightBackgroundConfig,
  dark = darkBackgroundConfig,
  onStats,
}: {
  light?: BackgroundConfig
  dark?: BackgroundConfig
  onStats?: (stats: BackgroundStats) => void
}) {
  const { resolvedTheme } = useTheme()
  const getSection = useSectionProgress()

  return (
    <ReactiveBackground
      config={resolvedTheme === "dark" ? dark : light}
      getSection={getSection}
      onStats={onStats}
      className="fixed inset-0 -z-10"
    />
  )
}
