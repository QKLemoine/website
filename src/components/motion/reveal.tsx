"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Fades its content up a few pixels the first time it scrolls into view,
 * then never again. Content already on screen at load, visitors who prefer
 * reduced motion, and browsers without JavaScript all get it immediately.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !("IntersectionObserver" in window)) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Only hide what is still below the fold, so nothing visible blinks.
    if (element.getBoundingClientRect().top < window.innerHeight) return

    element.dataset.reveal = "pending"
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        element.dataset.reveal = "shown"
        observer.disconnect()
      },
      { rootMargin: "0px 0px -10% 0px" }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
