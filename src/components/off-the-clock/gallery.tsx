"use client"

import { X } from "lucide-react"
import { useRef, type ReactNode } from "react"

import type { Photo } from "@/lib/off-the-clock"
import { cn } from "@/lib/utils"

import { PhotoFill } from "./photo"

/**
 * Card collages: where each of the first three photos sits. The blocks rotate
 * through these so neighbouring cards are not the same grid.
 */
const PREVIEWS = [
  {
    grid: "grid-cols-3 grid-rows-2",
    cells: ["col-span-2 row-span-2", "", ""],
  },
  {
    grid: "grid-cols-3 grid-rows-2",
    cells: [
      "col-start-1 row-start-1",
      "col-span-2 col-start-2 row-span-2 row-start-1",
      "col-start-1 row-start-2",
    ],
  },
  {
    grid: "grid-cols-2 grid-rows-[3fr_2fr]",
    cells: ["col-span-2", "", ""],
  },
  {
    grid: "grid-cols-[2fr_3fr_2fr] grid-rows-1",
    cells: ["", "", ""],
  },
]

/**
 * A small preview of a set of photos that opens all of them, with captions,
 * in a dialog. `layout` picks the collage arrangement; `strip` shows every
 * photo as a row of thumbnails instead.
 */
export function Gallery({
  title,
  photos,
  layout = 0,
  strip = false,
  className,
}: {
  title: string
  photos: Photo[]
  layout?: number
  strip?: boolean
  className?: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  if (photos.length === 0) return null

  const preview = PREVIEWS[layout % PREVIEWS.length]
  const shown = strip ? photos : photos.slice(0, 3)
  // The photo given the wide slot in the opened collage also rotates.
  const wide = layout % photos.length

  let trigger: ReactNode
  if (strip) {
    trigger = (
      <span className="flex gap-1.5">
        {shown.map((photo) => (
          <span
            key={photo.src}
            className="relative block aspect-4/3 w-20 overflow-hidden rounded-sm"
          >
            <PhotoFill photo={photo} sizes="80px" />
          </span>
        ))}
      </span>
    )
  } else {
    trigger = (
      <span className={cn("grid aspect-4/3 gap-1", preview.grid)}>
        {shown.map((photo, index) => (
          <span
            key={photo.src}
            className={cn(
              "group/cell relative block overflow-hidden rounded-sm",
              // With fewer than three photos the grid would have holes.
              shown.length < 3 ? "col-span-full" : preview.cells[index]
            )}
          >
            <PhotoFill photo={photo} sizes="(min-width: 1024px) 260px, 50vw" />
            {photo.caption && !photo.missing && (
              <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1.5 py-1 text-left text-[11px] leading-tight text-white opacity-0 transition-opacity group-hover/cell:opacity-100 group-focus-visible/trigger:opacity-100">
                {photo.caption}
              </span>
            )}
          </span>
        ))}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`${title}: open ${photos.length === 1 ? "the photo" : `all ${photos.length} photos`}`}
        className={cn(
          "group/trigger block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
          !strip && "w-full",
          className
        )}
      >
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`${title} photos`}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
        className="m-auto max-h-[90dvh] w-[min(60rem,calc(100vw-2rem))] overflow-y-auto rounded-xl bg-popover p-0 text-popover-foreground shadow-2xl ring-1 ring-foreground/10 backdrop:bg-black/70"
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-lg font-semibold">{title}</h4>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close photos"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/60"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <figure
                key={photo.src}
                className={cn(index === wide && "sm:col-span-2")}
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-md",
                    index === wide ? "aspect-4/3 sm:aspect-[8/3]" : "aspect-4/3"
                  )}
                >
                  <PhotoFill
                    photo={photo}
                    sizes="(min-width: 1024px) 620px, 100vw"
                    className="text-xs"
                  />
                </div>
                {photo.caption && (
                  <figcaption className="mt-1.5 text-sm text-muted-foreground">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      </dialog>
    </>
  )
}
