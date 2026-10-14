"use client"

import { Pause, Play } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

/**
 * A silent, looping demo clip. It plays only while on screen, stays paused
 * under reduced motion, and can always be paused with its button.
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
  // Once someone pauses it by hand, scrolling must not start it again.
  const pausedByUser = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let onScreen = false

    const sync = () => {
      if (onScreen && !reducedMotion.matches && !pausedByUser.current) {
        // Rejected if the browser blocks autoplay; the button still works.
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        sync()
      },
      { threshold: 0.4 }
    )
    observer.observe(video)
    reducedMotion.addEventListener("change", sync)
    return () => {
      observer.disconnect()
      reducedMotion.removeEventListener("change", sync)
    }
  }, [])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      pausedByUser.current = false
      video.play().catch(() => {})
    } else {
      pausedByUser.current = true
      video.pause()
    }
  }

  return (
    <div className={cn("group/video relative aspect-16/10 bg-black", className)}>
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
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="size-full object-contain"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause video" : "Play video"}
        className={cn(
          "absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white outline-none transition-opacity hover:bg-black/80 focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/70",
          // Stays visible while paused, so there is always a way to start it.
          playing && "opacity-0 group-hover/video:opacity-100"
        )}
      >
        {playing ? (
          <Pause aria-hidden className="size-4" />
        ) : (
          <Play aria-hidden className="size-4" />
        )}
      </button>
    </div>
  )
}
