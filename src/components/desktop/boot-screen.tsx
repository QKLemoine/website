"use client"

import { motion } from "framer-motion"
import { useEffect } from "react"

import { profile } from "@/lib/content"

const BOOT_KEY = "desktop:booted"
const BOOT_DURATION_MS = 1500

/** True only on a visitor's first visit, and never when they prefer reduced motion. */
export function shouldBoot(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return false
    return window.localStorage.getItem(BOOT_KEY) === null
  } catch {
    // Storage can be blocked (private mode); skipping the boot is the safe default.
    return false
  }
}

function markBooted() {
  try {
    window.localStorage.setItem(BOOT_KEY, "1")
  } catch {
    // Without storage the boot screen simply never shows (see shouldBoot).
  }
}

export function BootScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const finish = () => {
      markBooted()
      onDone()
    }
    const timer = window.setTimeout(finish, BOOT_DURATION_MS)
    window.addEventListener("keydown", finish)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("keydown", finish)
    }
  }, [onDone])

  return (
    <motion.div
      role="status"
      aria-label="Starting up"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => {
        markBooted()
        onDone()
      }}
      className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-8 bg-black text-white"
    >
      <p className="text-3xl font-semibold tracking-tight">{profile.name}</p>
      <div className="h-1 w-44 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full origin-left rounded-full bg-white"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: BOOT_DURATION_MS / 1000, ease: "easeInOut" }}
        />
      </div>
      <p className="text-xs text-white/50">Click or press any key to skip</p>
    </motion.div>
  )
}
