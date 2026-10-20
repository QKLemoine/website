import { ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

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

const SMALL_CAPS = "[font-variant-caps:all-small-caps] tracking-[0.08em]"
const DISPLAY = "font-display font-bold tracking-tight [font-stretch:75%]"

/** The accent used like a highlighter pen: a tint behind a few key words. */
function Mark({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-[2px] bg-primary/15 box-decoration-clone px-1 text-inherit dark:bg-primary/30">
      {children}
    </mark>
  )
}

/** A numbered section: its number and label in the left rail, content right. */
function Section({
  id,
  number,
  label,
  children,
}: {
  id: string
  number: number
  label: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="grid scroll-mt-14 gap-x-8 gap-y-6 border-t border-foreground py-8 lg:grid-cols-12 lg:py-12"
    >
      <h2 className="flex items-baseline gap-3 lg:col-span-2 lg:flex-col lg:gap-1">
        <span
          aria-hidden
          className={cn(DISPLAY, "text-4xl text-muted-foreground/60 lg:text-5xl")}
        >
          {String(number).padStart(2, "0")}
        </span>
        <span className={cn(SMALL_CAPS, "text-lg lg:text-base")}>{label}</span>
      </h2>
      <div className="min-w-0 lg:col-span-10">{children}</div>
    </section>
  )
}

type EntryLayout =
  /** Full width, with the text beside one large figure. */
  | "lead"
  /** One column of the two-column grid. */
  | "half"
  /** Full width, with two figures side by side and the text under them. */
  | "pair"

function ProjectEntry({
  project,
  layout,
}: {
  project: Project
  layout: EntryLayout
}) {
  const heading = (
    <>
      <h3
        className={cn(
          DISPLAY,
          "leading-none text-balance",
          layout === "lead" ? "text-4xl sm:text-5xl" : "text-3xl"
        )}
      >
        {project.title}
      </h3>
      {project.outcome && (
        <p className="mt-3 text-base leading-relaxed">
          <Mark>{project.outcome.metric}</Mark> {project.outcome.label}.
        </p>
      )}
    </>
  )
  const body = (
    <>
      <p className="text-base leading-relaxed text-muted-foreground">
        {project.summary}
      </p>
      <p className={cn(SMALL_CAPS, "mt-3 text-sm text-primary")}>
        {project.tech.join(" / ")}
      </p>
      {project.links && project.links.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {project.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 underline decoration-primary underline-offset-4 outline-none hover:text-primary focus-visible:text-primary"
              >
                {link.label}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
      <details className="group/details mt-3 border-t border-border pt-2">
        <summary className="cursor-pointer list-none rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span className="group-open/details:hidden">Read the write-up</span>
          <span className="hidden group-open/details:inline">Close</span>
        </summary>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">
          {project.description}
        </p>
      </details>
    </>
  )

  return (
    <article
      id={projectId(project)}
      className={cn(
        "scroll-mt-20",
        layout === "lead" &&
          "grid gap-x-8 gap-y-4 sm:col-span-2 lg:grid-cols-10",
        // The same two columns as the grid around it, so the figures line up
        // with the single ones above.
        layout === "pair" && "grid gap-x-8 gap-y-4 sm:col-span-2 sm:grid-cols-2"
      )}
    >
      <ProjectFigures
        project={project}
        sizes={
          layout === "lead"
            ? "(min-width: 1024px) 540px, 100vw"
            : "(min-width: 640px) 440px, 100vw"
        }
        figureClassName={cn(layout === "lead" && "lg:col-span-6")}
        captionClassName="mt-2 text-sm text-muted-foreground"
        label={(text) => (
          <span className={cn(SMALL_CAPS, "text-foreground")}>{text}</span>
        )}
      />
      {layout === "pair" ? (
        <>
          <div>{heading}</div>
          <div>{body}</div>
        </>
      ) : (
        <div className={cn("mt-4", layout === "lead" && "lg:col-span-4 lg:mt-0")}>
          {heading}
          <div className="mt-2">{body}</div>
        </div>
      )}
    </article>
  )
}

/** Everything under the masthead: the numbered sections. */
export function HomeSections() {
  const layouts: EntryLayout[] = projects.map((project, index) =>
    index === 0 ? "lead" : hasPair(project) ? "pair" : "half"
  )
  // An odd number of half-width entries would leave a hole in the grid, so
  // the last of them runs full width instead.
  if (layouts.filter((layout) => layout === "half").length % 2 === 1) {
    layouts[layouts.lastIndexOf("half")] = "lead"
  }

  return (
    <>
      <Section id="projects" number={1} label="Selected work">
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
          {projects.map((project, index) => (
            <ProjectEntry
              key={project.title}
              project={project}
              layout={layouts[index]}
            />
          ))}
        </div>
      </Section>

      <Section id="about" number={2} label="About">
        <div className="gap-8 space-y-4 text-[15px] leading-relaxed md:columns-2">
          {about.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="break-inside-avoid-column">
              <Highlighted
                text={paragraph}
                phrases={highlights}
                mark={(phrase, key) => <Mark key={key}>{phrase}</Mark>}
              />
            </p>
          ))}
        </div>
        <dl className="mt-8 grid gap-x-8 gap-y-5 border-t border-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((group) => (
            <div key={group.label}>
              <dt className={cn(SMALL_CAPS, "text-muted-foreground")}>
                {group.label}
              </dt>
              <dd className="mt-1 leading-relaxed">{group.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="experience" number={3} label="Experience">
        <ol className="divide-y divide-border">
          {experience.map((entry) => (
            <li
              key={`${entry.org}-${entry.dates}`}
              className="grid gap-x-8 gap-y-1 py-4 first:pt-0 last:pb-0 md:grid-cols-10"
            >
              <p
                className={cn(
                  SMALL_CAPS,
                  "text-sm text-signal tabular-nums md:col-span-2"
                )}
              >
                {entry.dates}
              </p>
              <div className="md:col-span-3">
                <h3 className="font-semibold">{entry.role}</h3>
                <p className="text-sm text-muted-foreground">{entry.org}</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground md:col-span-5">
                {entry.bullets[0]}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="off-the-clock" number={4} label="Off the clock">
        <OffTheClock headingClassName={cn(DISPLAY, "text-3xl leading-none")} />
      </Section>

      <Section id="contact" number={5} label="Contact">
        <p
          className={cn(
            DISPLAY,
            "max-w-[22ch] text-4xl leading-[0.95] text-balance sm:text-6xl"
          )}
        >
          {profile.availability}
        </p>
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-lg">
          {socials.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline decoration-primary decoration-2 underline-offset-[6px] outline-none hover:text-primary focus-visible:text-primary"
              >
                {label === "Email" ? profile.email : label}
                <ArrowUpRight aria-hidden className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
