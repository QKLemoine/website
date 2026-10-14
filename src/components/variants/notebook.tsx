import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import type { ReactNode } from "react"

import { AskPrompt } from "@/components/agent/ask-triggers"
import { BackgroundLayer } from "@/components/background/background-layer"
import { OffTheClock } from "@/components/off-the-clock/off-the-clock"
import {
  about,
  askExamples,
  education,
  experience,
  profile,
  projects,
  skills,
  spokenLanguages,
} from "@/lib/content"
import { cn } from "@/lib/utils"

import {
  ProjectFigures,
  figureNumber,
  hasPair,
  projectId,
  socials,
} from "./shared"

export const NOTEBOOK_WIDTH = "max-w-5xl"

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
        <aside className="border-l border-border pl-4 text-sm leading-relaxed text-muted-foreground lg:border-l-0 lg:pl-0">
          {note}
        </aside>
      )}
    </div>
  )
}

function NoteLabel({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs text-foreground">{children}</p>
}

function SectionHeading({
  number,
  children,
}: {
  number: number
  children: ReactNode
}) {
  return (
    <h2 className="flex items-baseline gap-3 border-t border-border pt-6 font-serif text-3xl tracking-tight">
      <span className="font-mono text-sm text-muted-foreground">{number}</span>
      {children}
    </h2>
  )
}

/**
 * The notebook's opening: front matter, serif headline, abstract and the Ask
 * bar, with the portrait and links as its margin note.
 */
export function NotebookHeader() {
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
            <ul className="space-y-1 font-mono text-xs">
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
        <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-0.5 font-mono text-xs text-muted-foreground">
          <dt>author</dt>
          <dd className="text-foreground">{profile.name}</dd>
          <dt>affiliation</dt>
          <dd>
            {education.school}, {education.degree.replace("Bachelor of Science", "BS")}
          </dd>
          <dt>location</dt>
          <dd>{profile.location}</dd>
          <dt className="text-signal">currently</dt>
          <dd>{profile.currently}</dd>
        </dl>
        <h1 className="mt-6 font-serif text-[2.5rem] leading-[1.05] tracking-tight text-balance sm:text-6xl">
          {profile.title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          <span className="font-serif italic">Abstract.</span>{" "}
          {profile.pitch} {profile.availability}
        </p>
        <AskPrompt examples={askExamples} className="mt-6" />
      </Row>
    </header>
  )
}

/**
 * Research notebook: one reading column set like a paper, with figures,
 * captions and a table, and the side facts moved out into margin notes.
 */
export function NotebookVariant() {
  return (
    // Clips the header's full-bleed background at the viewport edge.
    <div className="overflow-x-clip">
    <article
      className={`mx-auto ${NOTEBOOK_WIDTH} space-y-14 px-6 pb-20 text-[15px] leading-relaxed sm:text-base`}
    >
      <NotebookHeader />

      <section id="projects" className="scroll-mt-16 space-y-10">
        <SectionHeading number={1}>Projects</SectionHeading>
        {projects.map((project) => (
          <Row
            key={project.title}
            note={
              <div className="space-y-3 lg:pt-11">
                {project.outcome && (
                  <p>
                    <span className="font-semibold text-primary">
                      {project.outcome.metric}
                    </span>{" "}
                    {project.outcome.label}.
                  </p>
                )}
                <div>
                  <NoteLabel>built with</NoteLabel>
                  <p className="font-mono text-xs">{project.tech.join(", ")}</p>
                </div>
                {project.note && <p>{project.note}</p>}
                {project.links?.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-0.5 font-mono text-xs text-primary underline-offset-4 outline-none hover:underline focus-visible:underline"
                  >
                    {link.label}
                    <ArrowUpRight aria-hidden className="size-3" />
                  </a>
                ))}
              </div>
            }
          >
            <div id={projectId(project)} className="scroll-mt-20">
              <h3 className="flex items-baseline gap-3 font-serif text-2xl tracking-tight">
                <span className="font-mono text-xs text-muted-foreground">
                  1.{figureNumber(project)}
                </span>
                {project.title}
              </h3>
              <p className="mt-2 text-foreground/90">{project.description}</p>
              <div
                className={cn(
                  "mt-5 grid gap-4",
                  hasPair(project) && "sm:grid-cols-2"
                )}
              >
                <ProjectFigures
                  project={project}
                  sizes="(min-width: 720px) 656px, 100vw"
                  visualClassName="rounded-sm"
                  captionClassName="mt-2 text-sm text-muted-foreground"
                  label={(text) => (
                    <span className="font-mono text-xs text-foreground">
                      {text}:
                    </span>
                  )}
                />
              </div>
            </div>
          </Row>
        ))}
      </section>

      <section id="about" className="scroll-mt-16 space-y-6">
        <SectionHeading number={2}>Background</SectionHeading>
        <Row
          note={
            <div className="space-y-3">
              <div>
                <NoteLabel>education</NoteLabel>
                <p>
                  {education.school}. {education.degree},{" "}
                  {education.threads.join(" and ")} threads
                  {education.graduation && `, ${education.graduation}`}.
                </p>
              </div>
              <div>
                <NoteLabel>coursework</NoteLabel>
                <p>{education.coursework.join(", ")}.</p>
              </div>
              <div>
                <NoteLabel>speaks</NoteLabel>
                <p>{spokenLanguages.join(", ")}.</p>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-foreground/90">
            {about.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <table className="mt-8 w-full border-y border-foreground/60 text-left text-sm">
            <caption className="caption-bottom pt-2 text-left text-sm text-muted-foreground">
              <span className="font-mono text-xs text-foreground">
                Table 1:
              </span>{" "}
              Tools and methods I work with.
            </caption>
            <tbody className="divide-y divide-border">
              {skills.map((group) => (
                <tr key={group.label} className="align-baseline">
                  <th
                    scope="row"
                    className="w-36 py-2 pr-4 font-mono text-xs font-normal text-muted-foreground"
                  >
                    {group.label}
                  </th>
                  <td className="py-2">{group.items.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Row>
      </section>

      <section id="experience" className="scroll-mt-16 space-y-6">
        <SectionHeading number={3}>Experience</SectionHeading>
        <Row>
          <ol className="divide-y divide-border">
            {experience.map((entry) => (
              <li
                key={`${entry.org}-${entry.dates}`}
                className="grid gap-x-4 py-3 first:pt-0 sm:grid-cols-[10.5rem_1fr]"
              >
                <p className="font-mono text-xs leading-6 text-signal">
                  {entry.dates}
                </p>
                <details className="group/details">
                  <summary className="cursor-pointer list-none rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    <span className="font-medium">{entry.role}</span>
                    <span className="block text-sm text-muted-foreground group-open/details:text-foreground">
                      {entry.org}
                      <span className="ml-2 font-mono text-xs text-primary group-open/details:hidden">
                        notes
                      </span>
                    </span>
                  </summary>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
                    {entry.bullets.map((bullet) => (
                      <li key={bullet.slice(0, 24)}>{bullet}</li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ol>
        </Row>
      </section>

      <section id="off-the-clock" className="scroll-mt-16 space-y-6">
        <SectionHeading number={4}>Off the clock</SectionHeading>
        <OffTheClock headingClassName="font-serif text-2xl tracking-tight" />
      </section>

      <section id="contact" className="scroll-mt-16 space-y-6">
        <SectionHeading number={5}>Correspondence</SectionHeading>
        <Row>
          <p className="text-foreground/90">
            {profile.availability} Write to{" "}
            <a
              href={`mailto:${profile.email}`}
              className="font-mono text-sm text-primary underline underline-offset-4 outline-none hover:decoration-2 focus-visible:decoration-2"
            >
              {profile.email}
            </a>
            , or find me on{" "}
            {socials
              .filter(({ label }) => label !== "Email")
              .map(({ label, href }, index) => (
                <span key={label}>
                  {index > 0 && " and "}
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-4 outline-none hover:decoration-2 focus-visible:decoration-2"
                  >
                    {label}
                  </a>
                </span>
              ))}
            .
          </p>
        </Row>
      </section>
    </article>
    </div>
  )
}
