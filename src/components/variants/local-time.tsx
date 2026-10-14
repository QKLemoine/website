"use client"

import { useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  // Only the minute is shown, so a check every few seconds is plenty.
  const timer = window.setInterval(onChange, 5000)
  return () => window.clearInterval(timer)
}

/** The current time in the given zone, e.g. "2:41 PM". Ticks once a minute. */
export function LocalTime({
  timeZone,
  className,
}: {
  timeZone: string
  className?: string
}) {
  const time = useSyncExternalStore(
    subscribe,
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()),
    // The server's clock would be stale by the time the page is read.
    () => ""
  )

  return (
    <time className={className} suppressHydrationWarning>
      {time || "–:––"}
    </time>
  )
}
