import Link from "next/link"

import { cn } from "@/lib/utils"

import { STYLES, type StyleId } from "./styles"

/** Temporary floating toggle for flipping between the homepage styles. */
export function StyleSwitcher({ current }: { current: StyleId }) {
  return (
    // Sits above the "Ask me" launcher on phones, beside it on wider screens.
    <nav
      aria-label="Page style"
      className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 gap-0.5 rounded-full bg-popover p-1 text-xs font-medium shadow-lg ring-1 ring-foreground/10 sm:bottom-5"
    >
      {STYLES.map((style) => (
        <Link
          key={style.id}
          href={`/?style=${style.id}`}
          scroll={false}
          aria-current={style.id === current ? "page" : undefined}
          className={cn(
            "rounded-full px-3 py-1.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
            style.id === current &&
              "bg-primary text-primary-foreground hover:text-primary-foreground"
          )}
        >
          {style.label}
        </Link>
      ))}
    </nav>
  )
}
