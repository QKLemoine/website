"use client"

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { PanelsTopLeft } from "lucide-react"
import Link from "next/link"
import { useRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import { APP_ORDER, APPS, CLASSIC_SITE } from "./apps/registry"
import { useWindowActions, useWindows } from "./window/window-manager"

const BASE_SIZE = 48
const MAX_SIZE = 70
/** Horizontal distance (px) over which neighbouring icons still grow. */
const INFLUENCE = 130

export function Dock() {
  const { windows } = useWindows()
  const { open } = useWindowActions()
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY)

  return (
    <nav
      aria-label="Dock"
      onMouseMove={(event) => mouseX.set(event.clientX)}
      onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
      className="absolute bottom-2 left-1/2 z-20 flex h-[66px] -translate-x-1/2 items-end gap-2 rounded-2xl border border-white/15 bg-white/10 px-2.5 pb-2 backdrop-blur-2xl"
    >
      {APP_ORDER.map((id) => {
        const app = APPS[id]
        const Icon = app.icon
        return (
          <DockItem
            key={id}
            mouseX={mouseX}
            label={app.title}
            running={windows.some((w) => w.appId === id)}
            tile={app.tile}
          >
            {(className) => (
              <button
                type="button"
                aria-label={`Open ${app.title}`}
                onClick={() => open(id)}
                className={className}
              >
                <Icon className="size-1/2" strokeWidth={1.75} />
              </button>
            )}
          </DockItem>
        )
      })}
      <div aria-hidden className="mx-0.5 h-10 w-px self-center bg-white/20" />
      <DockItem
        mouseX={mouseX}
        label={CLASSIC_SITE.title}
        running={false}
        tile="bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-800"
      >
        {(className) => (
          <Link
            href={CLASSIC_SITE.href}
            aria-label={`Open ${CLASSIC_SITE.title}`}
            className={className}
          >
            <PanelsTopLeft className="size-1/2" strokeWidth={1.75} />
          </Link>
        )}
      </DockItem>
    </nav>
  )
}

function DockItem({
  mouseX,
  label,
  running,
  tile,
  children,
}: {
  mouseX: MotionValue<number>
  label: string
  running: boolean
  tile: string
  children: (className: string) => ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // Size is a function of the cursor's distance from this icon's centre, so
  // neighbours swell less than the icon under the pointer.
  const distance = useTransform(mouseX, (x) => {
    const rect = ref.current?.getBoundingClientRect()
    return rect ? x - rect.left - rect.width / 2 : Number.POSITIVE_INFINITY
  })
  const target = useTransform(
    distance,
    [-INFLUENCE, 0, INFLUENCE],
    [BASE_SIZE, MAX_SIZE, BASE_SIZE]
  )
  const size = useSpring(target, { mass: 0.1, stiffness: 180, damping: 14 })

  return (
    <motion.div
      ref={ref}
      style={
        reduceMotion
          ? { width: BASE_SIZE, height: BASE_SIZE }
          : { width: size, height: size }
      }
      className="group/dock-item relative shrink-0"
    >
      <span
        role="presentation"
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-black/70 px-2 py-0.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-focus-within/dock-item:opacity-100 group-hover/dock-item:opacity-100"
      >
        {label}
      </span>
      {children(
        cn(
          "flex size-full items-center justify-center rounded-xl shadow-md outline-none focus-visible:ring-2 focus-visible:ring-white/80",
          tile
        )
      )}
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-white/80 transition-opacity",
          running ? "opacity-100" : "opacity-0"
        )}
      />
    </motion.div>
  )
}
