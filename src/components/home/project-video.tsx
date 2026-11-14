"use client"

import { Pause, Play } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

/** The frame every project figure sits in, so stills and clips match. */
export const MEDIA_FRAME =
  "group/media relative aspect-video overflow-hidden rounded-sm bg-media"

/** Media eases up a touch while hovered: slow, small, transform only. */
export const MEDIA_ZOOM =
  "transition-transform duration-(--duration-slow) group-hover/media:scale-[1.02]"

/**
 * A silent demo clip that rests on its poster. With a mouse it plays while
 * hovered; on touch screens and keyboards the button plays and pauses it.
 * Nothing moves until the visitor asks.
 */
export function ProjectVideo({
  src,
  poster,
  label,
  className,
}: {
  src: string
  poster?: string
  /** Describes the clip for screen readers. */
  label: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  // Set by the button: a clip started by hand keeps playing when the cursor
  // leaves, and one paused by hand stays paused while hovered.
  const pinned = useRef(false)
  const canHover = useRef(false)

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      // Hover-to-play is motion nobody asked for under reduced motion.
      canHover.current = hover.matches && !reducedMotion.matches
    }
    sync()
    hover.addEventListener("change", sync)
    reducedMotion.addEventListener("change", sync)
    return () => {
      hover.removeEventListener("change", sync)
      reducedMotion.removeEventListener("change", sync)
    }
  }, [])

  const play = () => {
    // Rejected if the browser blocks playback; the poster simply stays.
    videoRef.current?.play().catch(() => {})
  }

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    pinned.current = true
    if (video.paused) play()
    else video.pause()
  }

  return (
    <div
      className={cn("group/video", MEDIA_FRAME, className)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse" || !canHover.current) return
        pinned.current = false
        play()
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse" || pinned.current) return
        videoRef.current?.pause()
      }}
    >
      {/* Letterboxed rather than cropped: demo recordings carry labels at
          their edges. */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        aria-label={label}
        loop
        muted
        playsInline
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={cn("size-full object-contain", MEDIA_ZOOM)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause video" : "Play video"}
        className={cn(
          "absolute bottom-4 left-4 flex h-8 items-center gap-2 rounded-sm bg-black/70 px-3 type-label text-white outline-none transition-opacity hover:bg-black/90 focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/70",
          // Always visible while paused, so touch screens have an obvious
          // way to start it; out of the way while it plays.
          playing && "opacity-0 group-hover/video:opacity-100"
        )}
      >
        {playing ? (
          <Pause aria-hidden className="size-3" />
        ) : (
          <Play aria-hidden className="size-3" />
        )}
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  )
}
