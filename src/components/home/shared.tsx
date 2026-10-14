import { Mail } from "lucide-react"
import Image from "next/image"
import type { ReactNode } from "react"

import { GitHubIcon, LinkedInIcon } from "@/components/icons"
import { profile, projects, type Project } from "@/lib/content"
import { slugify } from "@/lib/terminal/filesystem"
import { cn } from "@/lib/utils"

import { ProjectVideo } from "./project-video"

export const socials = [
  { label: "GitHub", href: profile.github, icon: GitHubIcon },
  { label: "LinkedIn", href: profile.linkedin, icon: LinkedInIcon },
  { label: "Email", href: `mailto:${profile.email}`, icon: Mail },
]

/** The id the agent and deep links use to scroll to one project. */
export function projectId(project: Project): string {
  return `project-${slugify(project.title)}`
}

/** 1-based figure number: the project's position in the content file. */
export function figureNumber(project: Project): number {
  return projects.indexOf(project) + 1
}

export function ProjectImage({
  src,
  alt,
  drawing = false,
  sizes,
  className,
}: {
  src: string
  alt: string
  drawing?: boolean
  sizes: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative aspect-16/10 overflow-hidden",
        drawing && "bg-card ring-1 ring-foreground/10",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        // GIFs skip the image optimizer so they keep animating.
        unoptimized={src.endsWith(".gif")}
        className={
          drawing
            ? // Multiply drops the white paper on a light page; on a dark one
              // the drawing is inverted (keeping its hue) and screened instead.
              "object-contain p-2 mix-blend-multiply dark:mix-blend-screen dark:invert dark:hue-rotate-180"
            : "object-cover"
        }
      />
    </div>
  )
}

/**
 * A project's visual slot: its video or image, or a clearly labelled placeholder
 * saying what to supply until one is added in content.ts.
 */
export function ProjectVisual({
  project,
  sizes,
  className,
}: {
  project: Project
  /** How wide the image is laid out, for next/image. */
  sizes: string
  className?: string
}) {
  if (project.video) {
    return (
      <ProjectVideo
        src={project.video}
        poster={project.image}
        label={project.imageAlt ?? project.figureCaption}
        className={className}
      />
    )
  }
  if (project.image) {
    return (
      <ProjectImage
        src={project.image}
        alt={project.imageAlt ?? project.figureCaption}
        drawing={project.drawing}
        sizes={sizes}
        className={className}
      />
    )
  }
  return (
    <div
      role="img"
      aria-label={`Placeholder for figure ${figureNumber(project)}`}
      className={cn(
        "flex aspect-16/10 flex-col justify-between gap-2 overflow-hidden border border-dashed border-foreground/25 bg-muted/60 p-3 text-xs leading-snug text-muted-foreground",
        className
      )}
    >
      <span className="font-mono">
        Placeholder, fig. {figureNumber(project)}
      </span>
      <span className="line-clamp-3 max-w-[40ch]">{project.figureBrief}</span>
    </div>
  )
}

/**
 * A project's figures with their captions: one, or two side by side when it
 * has a second clip. `label` renders the "Fig. 2" / "Fig. 5a" tag in the
 * caller's own type style.
 */
export function ProjectFigures({
  project,
  sizes,
  label,
  visualClassName,
  captionClassName,
  figureClassName,
}: {
  project: Project
  sizes: string
  label: (text: string) => ReactNode
  visualClassName?: string
  captionClassName?: string
  /** Applied to each figure, e.g. to place it in the caller's grid. */
  figureClassName?: string
}) {
  const number = figureNumber(project)
  const second = project.secondVideo ?? project.secondImage
  return (
    <>
      <figure className={figureClassName}>
        <ProjectVisual
          project={project}
          sizes={sizes}
          className={visualClassName}
        />
        <figcaption className={captionClassName}>
          {label(`Fig. ${number}${second ? "a" : ""}`)}{" "}
          {project.figureCaption}
        </figcaption>
      </figure>
      {second && (
        <figure className={figureClassName}>
          {project.secondVideo ? (
            <ProjectVideo
              src={project.secondVideo.src}
              poster={project.secondVideo.poster}
              label={project.secondVideo.caption}
              className={visualClassName}
            />
          ) : (
            <ProjectImage
              src={second.src}
              alt={second.caption}
              drawing={project.drawing}
              sizes={sizes}
              className={visualClassName}
            />
          )}
          <figcaption className={captionClassName}>
            {label(`Fig. ${number}b`)} {second.caption}
          </figcaption>
        </figure>
      )}
    </>
  )
}

/** True when the project shows two figures side by side. */
export function hasPair(project: Project): boolean {
  return Boolean(project.secondVideo ?? project.secondImage)
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Renders `text` with every occurrence of the given phrases wrapped by `mark`. */
export function Highlighted({
  text,
  phrases,
  mark,
}: {
  text: string
  phrases: string[]
  mark: (phrase: string, key: number) => ReactNode
}) {
  if (phrases.length === 0) return text
  const pattern = new RegExp(`(${phrases.map(escapeRegExp).join("|")})`, "g")
  return text
    .split(pattern)
    .map((part, index) => (index % 2 === 1 ? mark(part, index) : part))
}
