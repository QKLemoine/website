"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"

import type { AppDefinition, AppId, Bounds } from "../types"
import {
  activeAppId,
  windowReducer,
  type Viewport,
  type WindowsState,
} from "./window-reducer"

type WindowActions = {
  open: (appId: AppId) => void
  close: (appId: AppId) => void
  focus: (appId: AppId) => void
  minimize: (appId: AppId) => void
  toggleMaximize: (appId: AppId) => void
  setBounds: (appId: AppId, bounds: Bounds) => void
}

type WindowsValue = WindowsState & { activeAppId: AppId | null }

// State and actions live in separate contexts so components that only fire
// actions (dock buttons, terminal commands) don't re-render on every drag frame.
const WindowsContext = createContext<WindowsValue | null>(null)
const WindowActionsContext = createContext<WindowActions | null>(null)

function getViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight }
}

export function WindowManagerProvider({
  apps,
  initialApp,
  children,
}: {
  apps: Record<AppId, AppDefinition>
  initialApp?: AppId
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(
    windowReducer,
    undefined,
    (): WindowsState => {
      const empty: WindowsState = { windows: [], nextZ: 1 }
      if (!initialApp) return empty
      return windowReducer(empty, {
        type: "open",
        appId: initialApp,
        defaultSize: apps[initialApp].defaultSize,
        viewport: getViewport(),
      })
    }
  )

  useEffect(() => {
    const onResize = () =>
      dispatch({ type: "viewportChanged", viewport: getViewport() })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const actions = useMemo<WindowActions>(
    () => ({
      open: (appId) =>
        dispatch({
          type: "open",
          appId,
          defaultSize: apps[appId].defaultSize,
          viewport: getViewport(),
        }),
      close: (appId) => dispatch({ type: "close", appId }),
      focus: (appId) => dispatch({ type: "focus", appId }),
      minimize: (appId) => dispatch({ type: "minimize", appId }),
      toggleMaximize: (appId) => dispatch({ type: "toggleMaximize", appId }),
      setBounds: (appId, bounds) =>
        dispatch({ type: "setBounds", appId, bounds, viewport: getViewport() }),
    }),
    [apps]
  )

  const value = useMemo<WindowsValue>(
    () => ({ ...state, activeAppId: activeAppId(state) }),
    [state]
  )

  return (
    <WindowActionsContext.Provider value={actions}>
      <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
    </WindowActionsContext.Provider>
  )
}

export function useWindows(): WindowsValue {
  const value = useContext(WindowsContext)
  if (!value) throw new Error("useWindows must be used inside WindowManagerProvider")
  return value
}

export function useWindowActions(): WindowActions {
  const value = useContext(WindowActionsContext)
  if (!value)
    throw new Error("useWindowActions must be used inside WindowManagerProvider")
  return value
}
