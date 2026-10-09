"use client"

import { AnimatePresence } from "framer-motion"
import { useCallback, useState } from "react"

import { APPS } from "./apps/registry"
import { BootScreen, shouldBoot } from "./boot-screen"
import { DesktopIcons } from "./desktop-icons"
import { Dock } from "./dock"
import { MenuBar } from "./menu-bar"
import { Window } from "./window/window"
import { useWindows, WindowManagerProvider } from "./window/window-manager"

export default function Desktop() {
  const [booting, setBooting] = useState(shouldBoot)
  const finishBoot = useCallback(() => setBooting(false), [])

  return (
    <WindowManagerProvider apps={APPS} initialApp="terminal">
      {/* `dark` scopes the shadcn tokens so the OS is always dark, independent of
          the classic site's theme. Geist is set explicitly because the global
          --font-sans token currently resolves to the browser default. */}
      <div
        data-desktop-root
        className="dark fixed inset-0 z-50 overflow-hidden bg-[#06070b] font-(family-name:--font-geist-sans) text-foreground select-none"
      >
        <div inert={booting} className="absolute inset-0">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_20%,#1b2550_0%,transparent_60%),radial-gradient(ellipse_70%_60%_at_80%_80%,#0f3a44_0%,transparent_60%)]"
          />
          <MenuBar />
          <DesktopIcons />
          <WindowLayer />
          <Dock />
        </div>
        <AnimatePresence>
          {booting && <BootScreen onDone={finishBoot} />}
        </AnimatePresence>
      </div>
    </WindowManagerProvider>
  )
}

function WindowLayer() {
  const { windows, activeAppId } = useWindows()

  return (
    // `isolate` keeps ever-growing window z-indexes from climbing over the menu
    // bar and dock; pointer-events pass through so desktop icons stay clickable.
    <main
      aria-label="Open windows"
      className="pointer-events-none absolute inset-0 isolate z-10 *:pointer-events-auto"
    >
      <AnimatePresence>
        {windows.map((win) => (
          <Window
            key={win.appId}
            win={win}
            app={APPS[win.appId]}
            active={activeAppId === win.appId}
          />
        ))}
      </AnimatePresence>
    </main>
  )
}
