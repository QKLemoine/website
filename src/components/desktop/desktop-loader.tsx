"use client"

import dynamic from "next/dynamic"
import { useSyncExternalStore, type ReactNode } from "react"

import { profile } from "@/lib/content"

import { DESKTOP_MEDIA_QUERY } from "./layout-constants"

// Client-only and code-split: the OS needs the viewport and localStorage, and
// its bundle should never be part of the classic site.
const Desktop = dynamic(() => import("./desktop"), { ssr: false })

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_MEDIA_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/**
 * `children` is the server-rendered portfolio content. It is what crawlers,
 * link previews, no-JS visitors and small screens get; on wide screens the
 * desktop mounts on top of it.
 */
export function DesktopLoader({ children }: { children: ReactNode }) {
  const isWide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_MEDIA_QUERY).matches,
    () => false
  )

  return (
    <div className="group/entry flex flex-1 flex-col">
      <div className="flex flex-1 flex-col group-has-[[data-desktop-root]]/entry:hidden">
        {children}
      </div>
      {/* Covers the static content on wide screens while the desktop chunk
          loads. It fades itself out after a few seconds, so a failed script
          load reveals the static content instead of a black page. */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 hidden items-center justify-center bg-black text-3xl font-semibold tracking-tight text-white md:flex md:animate-[entry-veil-out_0.4s_ease-out_5s_forwards]"
      >
        {profile.name}
      </div>
      {isWide && <Desktop />}
    </div>
  )
}
