import { FolderOpen, Mail, SquareTerminal, UserRound } from "lucide-react"
import { memo } from "react"

import type { AppDefinition, AppId } from "../types"
import { AboutApp } from "./about-app"
import { ContactApp } from "./contact-app"
import { ProjectsApp } from "./projects-app"
import { TerminalApp } from "./terminal-app"

// App components are memoized: a window re-renders on every drag frame, and its
// content should not.
export const APPS: Record<AppId, AppDefinition> = {
  terminal: {
    id: "terminal",
    title: "Terminal",
    icon: SquareTerminal,
    tile: "bg-gradient-to-b from-zinc-700 to-zinc-900 text-emerald-300",
    component: memo(TerminalApp),
    defaultSize: { width: 720, height: 460 },
    minSize: { width: 380, height: 240 },
  },
  about: {
    id: "about",
    title: "About Me",
    icon: UserRound,
    tile: "bg-gradient-to-b from-sky-400 to-blue-600 text-white",
    component: memo(AboutApp),
    defaultSize: { width: 560, height: 600 },
    minSize: { width: 340, height: 300 },
  },
  projects: {
    id: "projects",
    title: "Projects",
    icon: FolderOpen,
    tile: "bg-gradient-to-b from-amber-300 to-orange-500 text-white",
    component: memo(ProjectsApp),
    defaultSize: { width: 640, height: 440 },
    minSize: { width: 340, height: 260 },
  },
  contact: {
    id: "contact",
    title: "Contact",
    icon: Mail,
    tile: "bg-gradient-to-b from-emerald-400 to-teal-600 text-white",
    component: memo(ContactApp),
    defaultSize: { width: 420, height: 340 },
    minSize: { width: 300, height: 260 },
  },
}

export const APP_ORDER: AppId[] = ["terminal", "about", "projects", "contact"]

export const CLASSIC_SITE = { title: "Classic Site", href: "/classic" }

export function isAppId(value: string): value is AppId {
  return value in APPS
}
