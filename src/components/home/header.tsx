import Image from "next/image"

import { AskPrompt } from "@/components/agent/ask-triggers"
import { BackgroundLayer } from "@/components/background/background-layer"
import { askExamples, education, profile } from "@/lib/content"
import { cn } from "@/lib/utils"

import { socials } from "./shared"

function Portrait({
  sizes,
  preload = false,
  className,
}: {
  sizes: string
  preload?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative aspect-4/5 overflow-hidden rounded-lg ring-1 ring-foreground/10",
        className
      )}
    >
      <Image
        src="/headshot.jpg"
        alt={profile.name}
        fill
        sizes={sizes}
        className="object-cover object-[50%_20%]"
        preload={preload}
        loading={preload ? undefined : "eager"}
      />
    </div>
  )
}

/**
 * The page's opening. The serif headline is the one focal point; who, where
 * and what now sit quietly above it, and the ways to get in touch below.
 */
export function HomeHeader() {
  return (
    <header id="top" className="relative isolate pt-12 sm:pt-16">
      {/* Contour lines, like the margin of a survey map; they bleed past
          the column and fade out as the page scrolls. */}
      <div className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 opacity-70">
        <BackgroundLayer motif="contours" fadeOnScroll />
      </div>
      <div className="grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            {/* On narrow screens the portrait sits beside the name; on wide
                ones it has its own column. */}
            <Portrait sizes="64px" className="w-16 shrink-0 lg:hidden" />
            <div>
              <p className="type-title font-bold">{profile.name}</p>
              <p className="mt-1 type-small text-muted-foreground">
                {education.school},{" "}
                {education.degree.replace("Bachelor of Science", "BS")}
              </p>
            </div>
          </div>
          <p className="mt-3 type-small text-muted-foreground">
            <span className="mr-1 type-label text-signal">Currently</span>{" "}
            {profile.currently}
          </p>
          <h1 className="mt-8 type-display font-bold text-balance">
            {profile.title}
          </h1>
          <p className="mt-6 max-w-measure type-lead text-foreground/90">
            <span className="mr-1 type-label text-muted-foreground">
              Abstract.
            </span>{" "}
            {profile.pitch} {profile.availability}
          </p>
          <AskPrompt examples={askExamples} className="mt-8" />
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 type-small">
            {socials.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="inline-flex min-h-6 items-center gap-1.5 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Icon aria-hidden className="size-4" />
                  {label === "Email" ? profile.email : label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Portrait sizes="272px" preload className="hidden lg:block" />
      </div>
    </header>
  )
}
