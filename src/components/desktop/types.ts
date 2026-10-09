import type { LucideIcon } from "lucide-react"
import type { ComponentType } from "react"

export type AppId = "terminal" | "about" | "projects" | "contact"

export type Size = { width: number; height: number }

export type Bounds = Size & { x: number; y: number }

export type WindowState = Bounds & {
  appId: AppId
  z: number
  minimized: boolean
  maximized: boolean
}

export type AppDefinition = {
  id: AppId
  title: string
  icon: LucideIcon
  /** Tailwind classes for the icon tile background. */
  tile: string
  component: ComponentType
  defaultSize: Size
  minSize: Size
}
