"use client"

import { PanelsTopLeft, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"

import { APP_ORDER, APPS, CLASSIC_SITE } from "./apps/registry"
import { MENU_BAR_HEIGHT } from "./layout-constants"
import { useWindowActions } from "./window/window-manager"

export function DesktopIcons() {
  const { open } = useWindowActions()
  const router = useRouter()

  return (
    <ul
      aria-label="Desktop icons"
      style={{ top: MENU_BAR_HEIGHT + 12 }}
      className="absolute right-3 flex flex-col gap-1"
    >
      {APP_ORDER.map((id) => (
        <li key={id}>
          <DesktopIcon
            label={APPS[id].title}
            icon={APPS[id].icon}
            tile={APPS[id].tile}
            onOpen={() => open(id)}
          />
        </li>
      ))}
      <li>
        <DesktopIcon
          label={CLASSIC_SITE.title}
          icon={PanelsTopLeft}
          tile="bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-800"
          onOpen={() => router.push(CLASSIC_SITE.href)}
        />
      </li>
    </ul>
  )
}

function DesktopIcon({
  label,
  icon: Icon,
  tile,
  onOpen,
}: {
  label: string
  icon: LucideIcon
  tile: string
  onOpen: () => void
}) {
  return (
    // Double-click to open like a real desktop; Enter/Space activate the
    // button's click for keyboard users, where event.detail is 0.
    <button
      type="button"
      aria-label={`Open ${label}`}
      onDoubleClick={onOpen}
      onClick={(event) => {
        if (event.detail === 0) onOpen()
      }}
      className="flex w-20 flex-col items-center gap-1 rounded-lg p-1.5 outline-none focus-visible:bg-white/15 focus-visible:ring-1 focus-visible:ring-white/40"
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-xl shadow-md",
          tile
        )}
      >
        <Icon className="size-5.5" strokeWidth={1.75} />
      </span>
      <span className="text-center text-[11px] leading-tight font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
        {label}
      </span>
    </button>
  )
}
