import { ArrowUpRight, ChevronDown, MapPin } from "lucide-react"
import Image from "next/image"
import type { ReactNode } from "react"

import { AskPrompt } from "@/components/agent/ask-triggers"
import { BackgroundLayer } from "@/components/background/background-layer"
import { OffTheClock } from "@/components/off-the-clock/off-the-clock"
import { Button } from "@/components/ui/button"
import {
  about,
  askExamples,
  education,
  experience,
  profile,
  projects,
  skills,
  stats,
  type Project,
} from "@/lib/content"
import { cn } from "@/lib/utils"

import { LocalTime } from "./local-time"
import { ProjectVideo } from "./project-video"
import {
  ProjectImage,
  ProjectVisual,
  hasPair,
  projectId,
  socials,
} from "./shared"

export const BENTO_WIDTH = "max-w-6xl"

/** The GitHub tile's width, by how many columns the last row already uses. */
const GITHUB_SPAN = ["lg:col-span-3", "lg:col-span-2", "lg:col-span-1"]

function Tile({
  className,
  children,
  id,
}: {
  className?: string
  children: ReactNode
  id?: string
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl bg-card p-5 ring-1 ring-foreground/10",
        className
      )}
    >
      {children}
    </div>
  )
}

function TileLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-sm text-muted-foreground">{children}</h2>
}

/** The full write-up behind a disclosure. Native <details>, so it is in the
 *  HTML for search engines and works without JavaScript. */
function ProjectDetails({ project }: { project: Project }) {
  return (
    <details className="group/details mt-auto border-t border-border/60 pt-2">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        Details
        <ChevronDown className="size-4 transition-transform group-open/details:rotate-180" />
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>
    </details>
  )
}

/**
 * Bento: the hero is a grid of tiles that each carry one fact, so the first
 * screen is already content. The dot grid shows in the gutters between them.
 */
export function BentoVariant() {
  const featured = projects.find((project) => project.featured) ?? projects[0]
  // The featured project already has its tile in the hero.
  const listed = projects.filter((project) => project !== featured)
  // Columns the project cards fill on the three-column grid; the GitHub tile
  // takes whatever is left of the last row.
  const gridCells = listed.reduce(
    (cells, project) => cells + (hasPair(project) ? 2 : 1),
    0
  )

  return (
    <>
      <section id="top" className="relative isolate">
        <BackgroundLayer fadeOnScroll />
        <div
          className={`mx-auto ${BENTO_WIDTH} grid grid-cols-2 gap-3 px-4 pt-4 pb-8 sm:px-6 lg:grid-cols-12`}
        >
          <Tile className="col-span-2 flex flex-col items-start justify-between gap-6 p-6 sm:p-7 lg:col-span-6 lg:row-span-2">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Hi, I&apos;m {profile.name.split(" ")[0]}
              </p>
              <h1 className="text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl">
                {profile.title}
              </h1>
              <p className="max-w-[46ch] text-muted-foreground text-pretty">
                {profile.pitch}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button nativeButton={false} render={<a href="#projects" />}>
                View projects
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href="#contact" />}
              >
                Get in touch
              </Button>
              <ul className="flex items-center text-muted-foreground">
                {socials.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      target={href.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noreferrer"
                      className="flex size-9 items-center justify-center rounded-lg transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Icon className="size-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Tile>

          <div className="relative min-h-44 overflow-hidden rounded-2xl ring-1 ring-foreground/10 lg:col-span-3 lg:row-span-2">
            <Image
              src="/headshot.jpg"
              alt={profile.name}
              fill
              sizes="(min-width: 1024px) 280px, 50vw"
              className="object-cover object-[50%_20%]"
              preload
            />
          </div>

          <Tile className="flex flex-col justify-between gap-3 lg:col-span-3">
            <TileLabel>
              <MapPin aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />
              {profile.location}
            </TileLabel>
            <p>
              <LocalTime
                timeZone={profile.timeZone}
                className="block text-3xl font-semibold tracking-tight tabular-nums"
              />
              <span className="text-sm text-muted-foreground">
                my local time
              </span>
            </p>
          </Tile>

          <Tile className="col-span-2 flex flex-col gap-2 lg:col-span-3">
            <h2 className="text-sm font-medium text-signal">Currently</h2>
            <p className="text-sm leading-relaxed">{profile.currently}</p>
          </Tile>

          <Tile
            id={projectId(featured)}
            className="col-span-2 flex scroll-mt-20 flex-col gap-4 p-3 lg:col-span-5 lg:row-span-3"
          >
            <ProjectVisual
              project={featured}
              sizes="(min-width: 1024px) 440px, 100vw"
              className="rounded-xl"
            />
            <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
              <TileLabel>Featured project</TileLabel>
              <h3 className="text-xl font-semibold tracking-tight">
                {featured.title}
              </h3>
              {featured.outcome && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">
                    {featured.outcome.metric}
                  </span>{" "}
                  {featured.outcome.label}
                </p>
              )}
              <p className="text-xs text-primary">{featured.tech.join(", ")}</p>
              <ProjectDetails project={featured} />
            </div>
          </Tile>

          <Tile className="col-span-2 flex flex-col gap-2.5 py-4 lg:col-span-7">
            <TileLabel>Ask about my work</TileLabel>
            <AskPrompt
              examples={askExamples}
              className="max-w-none bg-background"
            />
          </Tile>

          <Tile className="col-span-2 py-4 lg:col-span-7">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col-reverse justify-end gap-0.5"
                >
                  <dt className="text-xs leading-snug text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="text-2xl font-semibold tracking-tight tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Tile>

          <Tile className="col-span-2 py-4 lg:col-span-7">
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
              {skills.map((group) => (
                <div key={group.label} className="contents">
                  <dt className="text-muted-foreground">{group.label}</dt>
                  <dd className="leading-relaxed">{group.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </Tile>
        </div>
      </section>

      <section
        id="projects"
        className={`mx-auto ${BENTO_WIDTH} scroll-mt-16 px-4 pb-14 sm:px-6`}
      >
        <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listed.map((project) => (
            <li
              key={project.title}
              className={cn(hasPair(project) && "sm:col-span-2")}
            >
              <Tile
                id={projectId(project)}
                className="flex h-full scroll-mt-20 flex-col gap-3 p-3"
              >
                <div
                  className={cn(
                    "grid gap-2",
                    hasPair(project) && "sm:grid-cols-2"
                  )}
                >
                  <ProjectVisual
                    project={project}
                    sizes="(min-width: 1024px) 350px, (min-width: 640px) 50vw, 100vw"
                    className="rounded-xl"
                  />
                  {project.secondVideo && (
                    <ProjectVideo
                      src={project.secondVideo.src}
                      poster={project.secondVideo.poster}
                      label={project.secondVideo.caption}
                      className="overflow-hidden rounded-xl"
                    />
                  )}
                  {!project.secondVideo && project.secondImage && (
                    <ProjectImage
                      src={project.secondImage.src}
                      alt={project.secondImage.caption}
                      drawing={project.drawing}
                      sizes="(min-width: 1024px) 350px, (min-width: 640px) 50vw, 100vw"
                      className="rounded-xl"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 px-2 pb-1">
                  <h3 className="text-base font-semibold">{project.title}</h3>
                  {project.outcome && (
                    <p className="text-sm leading-snug text-muted-foreground">
                      <span className="font-semibold text-primary">
                        {project.outcome.metric}
                      </span>{" "}
                      {project.outcome.label}
                    </p>
                  )}
                  <p className="text-xs text-primary">
                    {project.tech.join(", ")}
                  </p>
                  <ProjectDetails project={project} />
                </div>
              </Tile>
            </li>
          ))}
          <li className={GITHUB_SPAN[gridCells % 3]}>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="flex h-full min-h-32 flex-col justify-between gap-3 rounded-2xl border border-dashed border-foreground/20 p-5 text-sm text-muted-foreground outline-none transition-colors hover:border-ring hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowUpRight aria-hidden className="size-5 self-end" />
              <span>
                <span className="block text-base font-semibold text-foreground">
                  More on GitHub
                </span>
                Code for these and smaller experiments.
              </span>
            </a>
          </li>
        </ul>
      </section>

      <section
        className={`mx-auto ${BENTO_WIDTH} grid gap-3 px-4 pb-14 sm:px-6 lg:grid-cols-12`}
      >
        <Tile id="about" className="scroll-mt-20 p-6 lg:col-span-7">
          <h2 className="text-xl font-semibold tracking-tight">About</h2>
          <div className="mt-3 max-w-[68ch] space-y-4 text-[15px] leading-relaxed text-foreground/90">
            {about.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-5 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {education.school}
            </span>
            <br />
            {education.degree}, {education.threads.join(" and ")} threads
            {education.graduation && `, ${education.graduation}`}
          </p>
        </Tile>

        <Tile id="experience" className="scroll-mt-20 p-6 lg:col-span-5">
          <h2 className="text-xl font-semibold tracking-tight">Experience</h2>
          <ol className="mt-3 divide-y divide-border/60">
            {experience.map((entry) => (
              <li
                key={`${entry.org}-${entry.dates}`}
                className="py-2.5 first:pt-0 last:pb-0"
              >
                <p className="text-xs text-signal tabular-nums">
                  {entry.dates}
                </p>
                <p className="text-sm font-medium">{entry.role}</p>
                <p className="text-sm text-muted-foreground">{entry.org}</p>
              </li>
            ))}
          </ol>
        </Tile>

        <Tile id="off-the-clock" className="scroll-mt-20 p-6 lg:col-span-12">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">
            Off the clock
          </h2>
          <OffTheClock headingClassName="text-base font-semibold" />
        </Tile>

        <Tile
          id="contact"
          className="flex scroll-mt-20 flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between lg:col-span-12"
        >
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
            <p className="mt-1 text-muted-foreground">{profile.availability}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {socials.map(({ label, href, icon: Icon }, index) => (
              <Button
                key={label}
                variant={index === socials.length - 1 ? "default" : "outline"}
                nativeButton={false}
                render={
                  <a
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noreferrer"
                  />
                }
              >
                <Icon className="size-4" />
                {label === "Email" ? profile.email : label}
              </Button>
            ))}
          </div>
        </Tile>
      </section>
    </>
  )
}
