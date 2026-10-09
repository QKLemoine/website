"use client"

import { BatteryMedium, Wifi } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { profile } from "@/lib/content"

import { APPS, CLASSIC_SITE } from "./apps/registry"
import { MENU_BAR_HEIGHT } from "./layout-constants"
import { useWindowActions, useWindows } from "./window/window-manager"

const clockFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

const itemClass =
  "rounded px-2 py-0.5 outline-none hover:bg-white/15 focus-visible:bg-white/20"

export function MenuBar() {
  const { activeAppId } = useWindows()
  const { open } = useWindowActions()
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")

  return (
    <header
      style={{ height: MENU_BAR_HEIGHT }}
      className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-black/35 px-2 text-[13px] text-white/90 backdrop-blur-xl"
    >
      <nav aria-label="Menu bar" className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`About ${profile.name}`}
          onClick={() => open("about")}
          className={`${itemClass} font-semibold tracking-tight`}
        >
          {initials}
        </button>
        <span className="px-2 font-semibold" aria-live="polite">
          {activeAppId ? APPS[activeAppId].title : "Desktop"}
        </span>
        <Link href={CLASSIC_SITE.href} className={itemClass}>
          {CLASSIC_SITE.title}
        </Link>
      </nav>
      <div className="flex items-center gap-3 px-2">
        <Wifi aria-hidden className="size-3.5" />
        <BatteryMedium aria-hidden className="size-4" />
        <Clock />
      </div>
    </header>
  )
}

function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <time dateTime={now.toISOString()} className="tabular-nums">
      {clockFormat.format(now)}
    </time>
  )
}
