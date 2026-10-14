"use client"

import { Menu } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AskButton } from "@/components/agent/ask-triggers"
import { ThemeToggle } from "@/components/theme-toggle"
import { profile } from "@/lib/content"

const links = [
  { href: "#projects", label: "Projects" },
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#off-the-clock", label: "Off the clock" },
  { href: "#contact", label: "Contact" },
]

export function Navbar({ width = "max-w-5xl" }: { width?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div
        className={`mx-auto flex h-14 ${width} items-center justify-between px-6`}
      >
        <a href="#top" className="text-base font-semibold tracking-tight">
          {profile.name}
        </a>

        <nav className="hidden items-center gap-6 text-base text-muted-foreground md:flex lg:gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="decoration-primary decoration-2 underline-offset-8 transition-colors hover:text-foreground hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <AskButton />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{profile.name}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <SheetClose
                    key={link.href}
                    nativeButton={false}
                    render={
                      <a
                        href={link.href}
                        className="rounded-md px-2 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
