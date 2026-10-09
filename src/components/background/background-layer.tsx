"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"

import { darkBackgroundConfig, lightBackgroundConfig } from "./config"

// Client-only and in its own chunk: the background is decoration, so it never
// delays the page's content or first paint.
const ReactiveBackground = dynamic(() => import("./reactive-background"), {
  ssr: false,
})

/** The page-wide background: fixed behind all content, themed to match. */
export function BackgroundLayer() {
  const { resolvedTheme } = useTheme()

  return (
    <ReactiveBackground
      config={
        resolvedTheme === "dark" ? darkBackgroundConfig : lightBackgroundConfig
      }
      // Behind the centre column, where the text is, the field is dimmed; it
      // shows at full strength in the side margins on wide screens. On narrow
      // screens text spans the full width, so the whole field is dimmed.
      className="fixed inset-0 -z-10 opacity-45 lg:opacity-100 lg:[mask-image:linear-gradient(to_right,black,rgb(0_0_0/0.28)_22%,rgb(0_0_0/0.28)_78%,black)]"
    />
  )
}
