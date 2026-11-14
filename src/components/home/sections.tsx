import { ArrowUpRight, ChevronDown } from "lucide-react"
import type { ReactNode } from "react"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { OffTheClock } from "@/components/off-the-clock/off-the-clock"
import {
  about,
  experience,
  highlights,
  profile,
  projects,
  skills,
  type Project,
} from "@/lib/content"
import { cn } from "@/lib/utils"

import {
  Highlighted,
  ProjectFigures,
  hasPair,
  projectId,
  socials,
} from "./shared"

/** Small technical labels: field names, figure numbers, dates, tags. */
const LABEL = "type-label text-muted-foreground"
/** A text link: accent colour, underlined on hover, at least 24px tall. */
const LINK =
  "inline-flex min-h-6 items-center gap-0.5 rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"

/** Key figures and phrases: set in the accent colour, no fill. */
function Mark({ children }: { children: ReactNode }) {
  return (
    <mark className="bg-transparent font-semibold text-signal">{children}</mark>
  )
}

/**
 * A page section: a serif heading under a hairline, then its content. Every
 * section starts at the same left edge and is the same distance from the
 * one before it.
 */
function Section({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-14 pt-section">
      <Reveal>
        <h2 className="border-t border-foreground/25 pt-6 type-heading font-bold">
          {label}
        </h2>
        <div className="mt-10">{children}</div>
      </Reveal>
    </section>
  )
}

type EntryLayout =
  /** One column of the two-column grid. */
  | "half"
  /** Full width: the figure runs edge to edge, the text below it. */
  | "wide"
  /** Full width, with two figures side by side and the text below them. */
  | "pair"

/**
 * One project. Every project has the same parts in the same order: title,
 * figure with its caption, outcome, summary, then tags, links and the
 * write-up. A hairline above each one marks where it starts; the media is
 * the largest thing in it.
 */
function ProjectEntry({
  project,
  layout,
}: {
  project: Project
  layout: EntryLayout
}) {
  const title = (
    <h3 className="type-title font-bold text-balance">{project.title}</h3>
  )
  const figures = (
    <ProjectFigures
      project={project}
      sizes={
        layout === "half"
          ? "(min-width: 1440px) 680px, (min-width: 640px) 50vw, 100vw"
          : "(min-width: 1440px) 1360px, 100vw"
      }
      captionClassName="mt-3 type-caption text-muted-foreground"
      label={(text) => (
        <span className="mr-1 type-label text-foreground">{text}</span>
      )}
    />
  )
  const text = (
    <div className="space-y-2">
      {project.outcome && (
        <p className="type-body">
          <Mark>{project.outcome.metric}</Mark> {project.outcome.label}.
        </p>
      )}
      <p className="max-w-measure type-body text-muted-foreground">
        {project.summary}
      </p>
    </div>
  )
  const meta = (
    <div>
      {/* Tags are plain chips, so they cannot be mistaken for links. */}
      <ul className="flex flex-wrap gap-1.5">
        {project.tech.map((tech) => (
          <li
            key={tech}
            className="rounded-sm border border-border px-2 py-1 type-label text-muted-foreground"
          >
            {tech}
          </li>
        ))}
      </ul>
      {project.links && project.links.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 type-small">
          {project.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={LINK}
              >
                {link.label}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
      <details className="group/details reveal mt-3">
        <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded-sm type-small text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span className="group-open/details:hidden">Read the write-up</span>
          <span className="hidden group-open/details:inline">Close</span>
          <ChevronDown
            aria-hidden
            className="size-4 transition-transform group-open/details:rotate-180"
          />
        </summary>
        <p className="mt-2 max-w-measure type-body text-foreground/90">
          {project.description}
        </p>
      </details>
    </div>
  )
  const frame = "scroll-mt-20 border-t border-border pt-6 pb-16"

  if (layout === "half") {
    return (
      // Shares the grid's rows with its neighbour, so two titles of
      // different lengths still leave the figures and text lined up.
      <article
        id={projectId(project)}
        className={cn(frame, "row-span-3 grid grid-rows-subgrid gap-y-5")}
      >
        {title}
        <div>{figures}</div>
        <div className="space-y-5">
          {text}
          {meta}
        </div>
      </article>
    )
  }

  return (
    <article
      id={projectId(project)}
      className={cn(frame, "space-y-5 sm:col-span-2")}
    >
      {title}
      <div
        className={cn(
          "grid gap-x-seam gap-y-5",
          layout === "pair" && "sm:grid-cols-2"
        )}
      >
        {figures}
      </div>
      <div className="grid gap-x-8 gap-y-5 lg:grid-cols-12">
        <div className="lg:col-span-6">{text}</div>
        <div className="lg:col-span-5 lg:col-start-8">{meta}</div>
      </div>
    </article>
  )
}

/** Everything under the hero: the page's five sections. */
export function HomeSections() {
  const layouts: EntryLayout[] = projects.map((project, index) =>
    index === 0 ? "wide" : hasPair(project) ? "pair" : "half"
  )
  // An odd number of half-width entries would leave a hole in the grid, so
  // the last of them runs full width instead.
  if (layouts.filter((layout) => layout === "half").length % 2 === 1) {
    layouts[layouts.lastIndexOf("half")] = "wide"
  }

  return (
    <>
      <Section id="projects" label="Selected work">
        <div className="-mb-16 grid gap-x-6 sm:grid-cols-2">
          {projects.map((project, index) => (
            <ProjectEntry
              key={project.title}
              project={project}
              layout={layouts[index]}
            />
          ))}
        </div>
      </Section>

      <Section id="about" label="About">
        <div className="gap-8 space-y-4 type-body lg:columns-2">
          {about.map((paragraph) => (
            <p
              key={paragraph.slice(0, 24)}
              className="break-inside-avoid-column"
            >
              <Highlighted
                text={paragraph}
                phrases={highlights}
                mark={(phrase, key) => <Mark key={key}>{phrase}</Mark>}
              />
            </p>
          ))}
        </div>
        <dl className="mt-block grid gap-x-8 gap-y-6 border-t border-border pt-6 type-small sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((group) => (
            <div key={group.label}>
              <dt className={LABEL}>{group.label}</dt>
              <dd className="mt-1">{group.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="experience" label="Experience">
        <ol className="divide-y divide-border">
          {experience.map((entry) => (
            <li
              key={`${entry.org}-${entry.dates}`}
              className="grid gap-x-8 gap-y-1 py-5 first:pt-0 last:pb-0 md:grid-cols-12"
            >
              <p className="pt-0.5 type-label text-signal md:col-span-2">
                {entry.dates}
              </p>
              <div className="md:col-span-4">
                <h3 className="font-bold">{entry.role}</h3>
                <p className="type-small text-muted-foreground">{entry.org}</p>
              </div>
              <p className="type-body text-muted-foreground md:col-span-6">
                {entry.bullets[0]}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="off-the-clock" label="Off the clock">
        <OffTheClock headingClassName="type-title font-bold" />
      </Section>

      <Section id="contact" label="Contact">
        <p className="max-w-measure type-lead">{profile.availability}</p>
        {/* Email is the one primary action; the profiles are secondary. */}
        <ul className="mt-6 flex flex-wrap gap-3">
          {[...socials].reverse().map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <Button
                size="lg"
                variant={label === "Email" ? "default" : "outline"}
                nativeButton={false}
                render={
                  <a
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noreferrer"
                  />
                }
              >
                <Icon aria-hidden className="size-4" />
                {label === "Email" ? profile.email : label}
              </Button>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
