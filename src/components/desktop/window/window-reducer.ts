import {
  DOCK_RESERVED,
  MENU_BAR_HEIGHT,
  MIN_VISIBLE,
  TITLE_BAR_HEIGHT,
} from "../layout-constants"
import type { AppId, Bounds, Size, WindowState } from "../types"

export type Viewport = Size

export type WindowsState = {
  windows: WindowState[]
  nextZ: number
}

export type WindowAction =
  | { type: "open"; appId: AppId; defaultSize: Size; viewport: Viewport }
  | { type: "close"; appId: AppId }
  | { type: "focus"; appId: AppId }
  | { type: "minimize"; appId: AppId }
  | { type: "toggleMaximize"; appId: AppId }
  | { type: "setBounds"; appId: AppId; bounds: Bounds; viewport: Viewport }
  | { type: "viewportChanged"; viewport: Viewport }

const CASCADE_STEP = 28

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** Keeps a window no larger than the viewport and its title bar reachable. */
export function clampBounds(bounds: Bounds, viewport: Viewport): Bounds {
  const width = Math.min(bounds.width, viewport.width)
  const height = Math.min(bounds.height, viewport.height - MENU_BAR_HEIGHT)
  return {
    width,
    height,
    x: clamp(bounds.x, MIN_VISIBLE - width, viewport.width - MIN_VISIBLE),
    y: clamp(bounds.y, MENU_BAR_HEIGHT, viewport.height - TITLE_BAR_HEIGHT),
  }
}

function initialBounds(
  size: Size,
  viewport: Viewport,
  openCount: number
): Bounds {
  const usableHeight = viewport.height - MENU_BAR_HEIGHT - DOCK_RESERVED
  const width = Math.min(size.width, viewport.width - 32)
  const height = Math.min(size.height, usableHeight - 16)
  const offset = (openCount % 5) * CASCADE_STEP
  return clampBounds(
    {
      width,
      height,
      x: (viewport.width - width) / 2 + offset,
      y: MENU_BAR_HEIGHT + (usableHeight - height) / 2 + offset,
    },
    viewport
  )
}

function raise(state: WindowsState, appId: AppId): WindowsState {
  return {
    nextZ: state.nextZ + 1,
    windows: state.windows.map((w) =>
      w.appId === appId ? { ...w, z: state.nextZ, minimized: false } : w
    ),
  }
}

function update(
  state: WindowsState,
  appId: AppId,
  patch: (w: WindowState) => WindowState
): WindowsState {
  return {
    ...state,
    windows: state.windows.map((w) => (w.appId === appId ? patch(w) : w)),
  }
}

export function windowReducer(
  state: WindowsState,
  action: WindowAction
): WindowsState {
  switch (action.type) {
    case "open": {
      if (state.windows.some((w) => w.appId === action.appId)) {
        return raise(state, action.appId)
      }
      const bounds = initialBounds(
        action.defaultSize,
        action.viewport,
        state.windows.length
      )
      return {
        nextZ: state.nextZ + 1,
        windows: [
          ...state.windows,
          {
            ...bounds,
            appId: action.appId,
            z: state.nextZ,
            minimized: false,
            maximized: false,
          },
        ],
      }
    }
    case "close":
      return {
        ...state,
        windows: state.windows.filter((w) => w.appId !== action.appId),
      }
    case "focus":
      return activeAppId(state) === action.appId
        ? state
        : raise(state, action.appId)
    case "minimize":
      return update(state, action.appId, (w) => ({ ...w, minimized: true }))
    case "toggleMaximize":
      return update(raise(state, action.appId), action.appId, (w) => ({
        ...w,
        maximized: !w.maximized,
      }))
    case "setBounds":
      return update(state, action.appId, (w) => ({
        ...w,
        ...clampBounds(action.bounds, action.viewport),
      }))
    case "viewportChanged":
      return {
        ...state,
        windows: state.windows.map((w) => ({
          ...w,
          ...clampBounds(w, action.viewport),
        })),
      }
  }
}

/** The focused app: the top-most window that is not minimized. */
export function activeAppId(state: WindowsState): AppId | null {
  let top: WindowState | null = null
  for (const w of state.windows) {
    if (!w.minimized && (top === null || w.z > top.z)) top = w
  }
  return top?.appId ?? null
}
