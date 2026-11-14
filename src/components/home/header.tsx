import Image from "next/image"
import type { ReactNode } from "react"

import { AskPrompt } from "@/components/agent/ask-triggers"
import { BackgroundLayer } from "@/components/background/background-layer"
import { askExamples, education, profile } from "@/lib/content"
import { cn } from "@/lib/utils"

import { socials } from "./shared"

/**
 * One row of the page: the reading column, with its margin note beside it on
 * wide screens and directly under it on narrow ones.
 */
function Row({
  children,
  note,
  className,
}: {
  children: ReactNode
  note?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,41rem)_minmax(0,1fr)]",
        className
      )}
    >
      <div className="min-w-0">{children}</div>
      {note && (
        <aside className="border-l border-border pl-4 type-small text-muted-foreground lg:border-l-0 lg:pl-0">
          {note}
        </aside>
      )}
    </div>
  )
}

/**
 * The page's opening, set like the first page of a paper: front matter, serif headline, abstract and the Ask
 * bar, with the portrait and links as its margin note.
 */
export function HomeHeader() {
  return (
    <header id="top" className="relative isolate pt-10 pb-2 sm:pt-14">
      {/* Contour lines, like the margin of a survey map; they bleed past
          the column and stop at the end of the abstract. */}
      <div className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 opacity-70">
        <BackgroundLayer motif="contours" fadeOnScroll />
      </div>
      <Row
        note={
          <div className="flex gap-4 lg:flex-col">
            <figure className="w-28 shrink-0 lg:w-40">
              <div className="relative aspect-4/5 overflow-hidden rounded-sm ring-1 ring-foreground/10">
                <Image
                  src="/headshot.jpg"
                  alt={profile.name}
                  fill
                  sizes="160px"
                  className="object-cover object-[50%_20%]"
                  preload
                />
              </div>
            </figure>
            <ul className="space-y-1 type-small">
              {socials.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noreferrer"
                    className="text-primary underline-offset-4 outline-none hover:underline focus-visible:underline"
                  >
                    {label === "Email" ? profile.email : label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <p className="type-title font-semibold text-foreground">
          {profile.name}
        </p>
        <p className="mt-1 type-small text-muted-foreground">
          {education.school}, {education.degree.replace("Bachelor of Science", "BS")}
        </p>
        <p className="mt-1 flex gap-2 type-small text-muted-foreground">
          <span className="shrink-0 font-medium text-signal">Currently</span>
          <span>{profile.currently}</span>
        </p>
        <h1 className="mt-6 font-serif type-display text-balance">
          {profile.title}
        </h1>
        <p className="mt-6 type-lead text-foreground/90">
          <span className="font-serif italic">Abstract.</span>{" "}
          {profile.pitch} {profile.availability}
        </p>
        <AskPrompt examples={askExamples} className="mt-6" />
      </Row>
    </header>
  )
}
