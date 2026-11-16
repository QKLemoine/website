"use client"

import { ArrowUpRight, Pause, Play, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import { setVideosPaused, useVideosPaused } from "./video-motion"

export type TileData = {
  id: string
  title: string
  video?: string
  image?: string
  /** CSS object-position for the cropped media, when the centre is wrong. */
  position?: string
  metric?: string
  outcome?: string
  summary: string
}

/**
 * A tile's clip: silent and looping, playing only while at least a quarter
 * of it is on screen and the shared switch allows it.
 */
function TileVideo({
  src,
  poster,
  position,
}: {
  src: string
  poster?: string
  position?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const paused = useVideosPaused()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = ref.current
    if (!video) return
    // Rejected if the browser blocks playback; the poster simply stays.
    if (visible && !paused) video.play().catch(() => {})
    else video.pause()
  }, [visible, paused])

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
      className="size-full object-cover"
      style={position ? { objectPosition: position } : undefined}
    />
  )
}

/** Pauses or resumes every tile clip at once. */
export function VideoToggle() {
  const paused = useVideosPaused()
  return (
    <button
      type="button"
      onClick={() => setVideosPaused(!paused)}
      aria-pressed={!paused}
      className="inline-flex min-h-8 items-center gap-2 rounded-sm border border-border px-3 type-label text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {paused ? (
        <Play aria-hidden className="size-3" />
      ) : (
        <Pause aria-hidden className="size-3" />
      )}
      {paused ? "Play videos" : "Pause videos"}
    </button>
  )
}

/**
 * One project as a media tile. At rest it shows the clip and the project's
 * name; on hover or keyboard focus the clip blurs (still playing beneath)
 * and the outcome, summary and a "View project" cue appear. Clicking opens
 * the full write-up in a dialog, which `children` renders.
 */
export function ProjectTile({
  data,
  className,
  children,
}: {
  data: TileData
  className?: string
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = `${data.id}-title`
  const fade =
    "transition-opacity duration-(--duration-base) group-hover/tile:opacity-0 group-focus-visible/tile:opacity-0"

  return (
    <>
      <button
        id={data.id}
        type="button"
        aria-haspopup="dialog"
        aria-label={`${data.title}: view project`}
        onClick={() => dialogRef.current?.showModal()}
        className={cn(
          "group/tile relative isolate block w-full scroll-mt-20 overflow-hidden rounded-sm bg-media text-left outline-none focus-visible:ring-3 focus-visible:ring-ring",
          className
        )}
      >
        <span
          aria-hidden
          className="absolute inset-0 transition-transform duration-(--duration-slow) group-hover/tile:scale-[1.03] motion-reduce:group-hover/tile:scale-100"
        >
          {data.video ? (
            <TileVideo
              src={data.video}
              poster={data.image}
              position={data.position}
            />
          ) : data.image ? (
            <Image
              src={data.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
              style={data.position ? { objectPosition: data.position } : undefined}
            />
          ) : null}
        </span>

        {/* At rest: the name in the corner, over a scrim so it always reads. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/75 to-transparent",
            fade
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute bottom-0 left-0 max-w-[85%] p-5 type-title font-bold text-balance text-white sm:p-6",
            fade
          )}
        >
          {data.title}
        </span>

        {/* On hover or focus: the clip blurs and the project explains itself. */}
        <span
          aria-hidden
          className="absolute inset-0 flex flex-col justify-end bg-black/65 p-5 text-white opacity-0 backdrop-blur-md transition-opacity duration-(--duration-base) group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100 sm:p-6"
        >
          <span className="flex translate-y-2 flex-col gap-2 transition-transform duration-(--duration-slow) group-hover/tile:translate-y-0 group-focus-visible/tile:translate-y-0 motion-reduce:translate-y-0">
            <span className="type-title font-bold text-balance">
              {data.title}
            </span>
            {data.metric && (
              <span className="type-small text-white/90">
                <span className="font-semibold text-(--accent-dark)">
                  {data.metric}
                </span>{" "}
                {data.outcome}.
              </span>
            )}
            <span className="line-clamp-2 max-w-xl type-small text-white/85 lg:line-clamp-3">
              {data.summary}
            </span>
            <span className="mt-2 inline-flex items-center gap-1.5 type-label text-white">
              View project
              <ArrowUpRight className="size-3.5" />
            </span>
          </span>
        </span>

        {/* Touch screens cannot hover, so they get a permanent cue. */}
        <span
          aria-hidden
          className="absolute top-4 right-4 hidden items-center gap-1 rounded-sm bg-black/65 px-2 py-1 type-label text-white sm:top-5 sm:right-5 [@media(hover:none)]:inline-flex"
        >
          View
          <ArrowUpRight className="size-3" />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
        // Clips inside the write-up stop when it closes.
        onClose={(event) => {
          event.currentTarget
            .querySelectorAll("video")
            .forEach((video) => video.pause())
        }}
        className="m-auto max-h-[92dvh] w-[min(72rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl bg-popover p-0 text-popover-foreground shadow-2xl ring-1 ring-border backdrop:bg-black/75"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-popover px-5 py-4 sm:px-8">
          <h2 id={titleId} className="type-title font-bold">
            {data.title}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close project"
            className="flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="p-5 sm:p-8">{children}</div>
      </dialog>
    </>
  )
}
