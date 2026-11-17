import { ArrowUpRight } from "lucide-react"
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
  spokenLanguages,
  type Project,
} from "@/lib/content"
import { LocalCoderDemo } from "@/components/demos/local-coder/local-coder-demo"
import { MonopropDemo } from "@/components/demos/monoprop/monoprop-demo"
import { cn } from "@/lib/utils"

import {
  Highlighted,
  ProjectFigures,
  hasPair,
  projectId,
  socials,
} from "./shared"
import { ProjectTile, VideoToggle, type TileData } from "./project-tile"

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

type Tone = "page" | "stone" | "olive" | "ink"

const TONE_BG: Record<Exclude<Tone, "page">, string> = {
  stone: "bg-tone-stone",
  olive: "bg-tone-olive",
  // Inside .tone-ink the palette is swapped, so this is the ink colour.
  ink: "bg-background",
}

/**
 * A page section: a bold heading, then its content, on one left edge.
 * Sections on the page colour are separated by a hairline; the others sit
 * on a full-width band of their own tone, so the page changes colour as it
 * moves from one subject to the next.
 */
function Section({
  id,
  label,
  tone = "page",
  flush = false,
  action,
  children,
}: {
  id: string
  label: string
  tone?: Tone
  /** Butt up against the previous band instead of leaving a gap. */
  flush?: boolean
  /** A control shown at the right end of the heading row. */
  action?: ReactNode
  children: ReactNode
}) {
  const banded = tone !== "page"
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-14",
        banded ? "relative isolate py-section" : "pt-section",
        banded && !flush && "mt-section",
        tone === "ink" && "tone-ink"
      )}
    >
      {banded && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2",
            TONE_BG[tone]
          )}
        />
      )}
      <Reveal>
        <div
          className={cn(
            "flex flex-wrap items-end justify-between gap-4",
            !banded && "border-t border-foreground/25 pt-6"
          )}
        >
          <h2 className="type-heading font-bold">{label}</h2>
          {action}
        </div>
        <div className="mt-10">{children}</div>
      </Reveal>
    </section>
  )
}

/**
 * Where each tile sits in the project mosaic, by position in the list.
 * Phones get one column, tablets two, and wide screens a 12-column grid of
 * mixed shapes: a large tile beside two short ones, then the mirror image,
 * then a full-width finish. Further projects fall back to half-width tiles.
 */
const TILE_LAYOUT = [
  "aspect-[4/3] sm:col-span-2 sm:aspect-video lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:aspect-auto",
  "aspect-[4/3] lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:aspect-auto",
  "aspect-[4/3] lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:aspect-auto",
  "aspect-[4/3] lg:col-span-5 lg:col-start-1 lg:row-start-3 lg:aspect-auto",
  "aspect-[4/3] lg:col-span-5 lg:col-start-1 lg:row-start-4 lg:aspect-auto",
  "aspect-[4/3] sm:col-span-2 sm:aspect-video lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-3 lg:aspect-auto",
  "aspect-[4/3] lg:col-span-6 lg:col-start-1 lg:row-span-2 lg:row-start-5 lg:aspect-auto",
  "aspect-[4/3] lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-5 lg:aspect-auto",
  "aspect-[4/3] sm:col-span-2 sm:aspect-[21/9] lg:col-span-12 lg:row-span-2 lg:aspect-auto",
]
const TILE_FALLBACK = "aspect-[4/3] lg:col-span-6 lg:row-span-2 lg:aspect-auto"

/**
 * A project's full write-up, shown in its dialog: the figures with their
 * captions, then the outcome and the full description beside the tags and
 * links.
 */
function ProjectDetail({ project }: { project: Project }) {
  const pair = hasPair(project)
  return (
    <div className="space-y-8">
      {project.demo === "monoprop" ? (
        <MonopropDemo />
      ) : project.demo === "local-coder" ? (
        <LocalCoderDemo />
      ) : (
        <div
          className={cn("grid gap-x-seam gap-y-5", pair && "sm:grid-cols-2")}
        >
          <ProjectFigures
            project={project}
            sizes={
              pair
                ? "(min-width: 1152px) 550px, (min-width: 640px) 50vw, 100vw"
                : "(min-width: 1152px) 1100px, 100vw"
            }
            captionClassName="mt-3 type-caption text-muted-foreground"
            label={(text) => (
              <span className="mr-1 type-label text-foreground">{text}</span>
            )}
          />
        </div>
      )}
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          {project.outcome && (
            <p className="type-lead">
              <Mark>{project.outcome.metric}</Mark> {project.outcome.label}.
            </p>
          )}
          {/* The tile already shows the one-line summary; the dialog
              gives the full write-up instead of repeating it. */}
          <p className="max-w-measure type-body text-foreground/90">
            {project.description}
          </p>
        </div>
        <div className="space-y-4 lg:col-span-4 lg:col-start-9">
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
            <ul className="flex flex-wrap gap-x-5 gap-y-1 type-small">
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
        </div>
      </div>
    </div>
  )
}

function tileData(project: Project): TileData {
  return {
    id: projectId(project),
    title: project.title,
    video: project.video,
    image: project.image,
    demo: project.demo,
    metric: project.outcome?.metric,
    outcome: project.outcome?.label,
    summary: project.summary,
  }
}

/** Everything under the hero: the page's five sections. */
export function HomeSections() {
  return (
    <>
      <Section id="projects" label="Selected work" action={<VideoToggle />}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:auto-rows-[clamp(11rem,16vw,15rem)] lg:grid-cols-12">
          {projects.map((project, index) => (
            <ProjectTile
              key={project.title}
              data={tileData(project)}
              className={TILE_LAYOUT[index] ?? TILE_FALLBACK}
            >
              <ProjectDetail project={project} />
            </ProjectTile>
          ))}
        </div>
      </Section>

      <Section id="about" label="About" tone="stone">
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
          {skills.map((group, index) => (
            <div key={group.label}>
              <dt className={LABEL}>{group.label}</dt>
              <dd className="mt-1">{group.items.join(", ")}</dd>
              {/* Spoken languages sit under the programming ones. */}
              {index === 0 && (
                <>
                  <dt className={cn(LABEL, "mt-5")}>Languages</dt>
                  <dd className="mt-1">Native: {spokenLanguages.join(", ")}</dd>
                </>
              )}
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

      <Section id="off-the-clock" label="Off the clock" tone="olive">
        <OffTheClock headingClassName="type-title font-bold" />
      </Section>

      <Section id="contact" label="Contact" tone="ink" flush>
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
