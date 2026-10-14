"use client"

import { Minus, Plus } from "lucide-react"
import { useEffect, useRef, useState, type PointerEvent } from "react"

import type { MapRegion, Place } from "@/lib/off-the-clock"
import { cn } from "@/lib/utils"

import { Gallery } from "./gallery"

const ZOOM_STEP = 1.7
/** How far in the view can go, as a fraction of the widest view's width. */
const MAX_ZOOM = 40

/** The visible part of the map, in the map's own coordinates. */
type View = { x: number; y: number; width: number }

/** Lived-in places are a ring, visited ones a dot: told apart by shape, not only colour. */
function Marker({ kind, className }: { kind: Place["kind"]; className?: string }) {
  return kind === "lived" ? (
    <span
      aria-hidden
      className={cn(
        "flex size-3.5 items-center justify-center rounded-full border-2 border-signal bg-background",
        className
      )}
    >
      <span className="size-1 rounded-full bg-signal" />
    </span>
  ) : (
    <span
      aria-hidden
      className={cn(
        "block size-2.5 rounded-full bg-primary ring-2 ring-background",
        className
      )}
    />
  )
}

/**
 * The travel map: an SVG world drawn on the server, with a button per place.
 * It zooms with the buttons, a pinch or ctrl-scroll, and pans by dragging;
 * selecting a place shows its date, note and photos underneath.
 */
export function TravelMap({
  land,
  borders,
  regions,
  places,
}: {
  land: string
  borders: string
  /** The first region is the widest view and bounds all panning. */
  regions: MapRegion[]
  places: Place[]
}) {
  const [worldX, worldY, worldWidth, worldHeight] = regions[0].box
  const aspect = worldWidth / worldHeight
  const [view, setView] = useState<View>({
    x: worldX,
    y: worldY,
    width: worldWidth,
  })
  const [selected, setSelected] = useState(0)
  const frameRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const height = view.width / aspect
  const place = places[selected]

  /** Keeps a view inside the widest one and within the zoom limits. */
  const clamp = (next: View): View => {
    const width = Math.min(worldWidth, Math.max(worldWidth / MAX_ZOOM, next.width))
    // Zoom about the centre of what was asked for.
    const centreX = next.x + next.width / 2
    const centreY = next.y + next.width / aspect / 2
    const nextHeight = width / aspect
    return {
      width,
      x: Math.min(worldX + worldWidth - width, Math.max(worldX, centreX - width / 2)),
      y: Math.min(
        worldY + worldHeight - nextHeight,
        Math.max(worldY, centreY - nextHeight / 2)
      ),
    }
  }

  const zoom = (factor: number) =>
    setView((current) => {
      const width = current.width / factor
      return clamp({
        width,
        x: current.x + (current.width - width) / 2,
        y: current.y + (current.width - width) / aspect / 2,
      })
    })

  // Ctrl-scroll and trackpad pinch zoom the map; a plain scroll is left to the
  // page. React's wheel listener is passive, so this one is attached by hand.
  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  })
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      zoomRef.current(Math.exp(-event.deltaY * 0.01))
    }
    frame.addEventListener("wheel", onWheel, { passive: false })
    return () => frame.removeEventListener("wheel", onWheel)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // A press on a marker selects it; only the map itself drags.
    if ((event.target as Element).closest("button")) return
    drag.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = drag.current
    if (!from) return
    const scale = view.width / event.currentTarget.clientWidth
    const dx = (event.clientX - from.x) * scale
    const dy = (event.clientY - from.y) * scale
    drag.current = { x: event.clientX, y: event.clientY }
    setView((current) =>
      clamp({ ...current, x: current.x - dx, y: current.y - dy })
    )
  }

  const endDrag = () => {
    drag.current = null
  }

  const atRegion = (region: MapRegion) =>
    Math.abs(region.box[0] - view.x) < 0.5 &&
    Math.abs(region.box[1] - view.y) < 0.5 &&
    Math.abs(region.box[2] - view.width) < 0.5

  const controlClass =
    "flex size-7 items-center justify-center rounded-md bg-background/85 text-muted-foreground outline-none ring-1 ring-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/60 disabled:opacity-40"

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Marker kind="lived" /> Lived
          </span>
          <span className="flex items-center gap-1.5">
            <Marker kind="visited" /> Visited
          </span>
        </p>
        <div role="group" aria-label="Map area" className="flex gap-0.5">
          {regions.map((region) => (
            <button
              key={region.id}
              type="button"
              aria-pressed={atRegion(region)}
              onClick={() =>
                setView({
                  x: region.box[0],
                  y: region.box[1],
                  width: region.box[2],
                })
              }
              className={cn(
                "rounded-md px-2 py-1 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/60",
                atRegion(region) && "bg-muted text-foreground"
              )}
            >
              {region.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // One finger still scrolls the page up and down; sideways drags pan.
        className="relative mt-2 aspect-16/10 cursor-grab touch-pan-y overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10 select-none active:cursor-grabbing"
      >
        <svg
          viewBox={`${view.x} ${view.y} ${view.width} ${height}`}
          aria-hidden
          className="absolute inset-0 size-full"
        >
          <path d={land} className="fill-foreground/12" />
          <path
            d={borders}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={0.75}
            className="stroke-card"
          />
        </svg>
        {places.map((item, index) => {
          const x = ((item.x - view.x) / view.width) * 100
          const y = ((item.y - view.y) / height) * 100
          if (x < 0 || x > 100 || y < 0 || y > 100) return null
          return (
            <button
              key={item.name}
              type="button"
              aria-pressed={index === selected}
              aria-label={`${item.name}, ${item.kind}`}
              title={item.name}
              onClick={() => setSelected(index)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={cn(
                // The hit area is larger than the dot, but small enough that
                // neighbours stay separately clickable once zoomed in.
                "absolute flex size-5 -translate-1/2 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:z-20 focus-visible:ring-3 focus-visible:ring-ring/70",
                // The selected place sits on top where markers overlap.
                index === selected && "z-10 bg-foreground/15"
              )}
            >
              <Marker kind={item.kind} />
            </button>
          )
        })}
        <div className="absolute right-2 bottom-2 z-20 flex flex-col gap-1">
          <button
            type="button"
            aria-label="Zoom in"
            disabled={view.width <= worldWidth / MAX_ZOOM + 0.01}
            onClick={() => zoom(ZOOM_STEP)}
            className={controlClass}
          >
            <Plus aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={view.width >= worldWidth - 0.01}
            onClick={() => zoom(1 / ZOOM_STEP)}
            className={controlClass}
          >
            <Minus aria-hidden className="size-4" />
          </button>
        </div>
      </div>

      {place && (
        <div aria-live="polite" className="mt-3 space-y-1.5">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{place.name}</span>
            <span className="text-xs text-muted-foreground">
              {place.country === place.name ? "" : place.country}
            </span>
            {place.date && (
              <span className="text-xs text-signal">{place.date}</span>
            )}
          </p>
          {place.note && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {place.note}
            </p>
          )}
          <Gallery
            title={place.name}
            photos={place.photos}
            strip
            className="mt-1"
          />
        </div>
      )}
    </div>
  )
}
