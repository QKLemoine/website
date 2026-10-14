import Image from "next/image"

import type { Photo } from "@/lib/off-the-clock"
import { cn } from "@/lib/utils"

/**
 * One photo filling its (positioned, sized) parent, or a labelled placeholder
 * naming the file to supply until it has been published.
 */
export function PhotoFill({
  photo,
  sizes,
  className,
}: {
  photo: Photo
  /** How wide the photo is laid out, for next/image. */
  sizes: string
  className?: string
}) {
  if (photo.missing) {
    return (
      <span
        className={cn(
          "absolute inset-0 flex flex-col justify-end overflow-hidden border border-dashed border-foreground/25 bg-muted/60 p-1.5 text-left font-mono text-[10px] leading-tight text-muted-foreground",
          className
        )}
      >
        <span className="truncate">{photo.src.split("/").pop()}</span>
      </span>
    )
  }
  return (
    <Image
      src={photo.src}
      alt={photo.caption}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
    />
  )
}
