import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { OffTheClock } from "@/components/off-the-clock/off-the-clock";
import {
  about,
  experience,
  highlights,
  profile,
  projects,
  skills,
  type Project,
} from "@/lib/content";
import { cn } from "@/lib/utils";

import {
  Highlighted,
  ProjectFigures,
  hasPair,
  projectId,
  socials,
} from "./shared";

/** Small quiet labels: field names, figure numbers, list headings. */
const LABEL = "type-caption font-medium text-muted-foreground";

/** The accent used like a highlighter pen: a tint behind a few key words. */
function Mark({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-sm bg-primary/15 box-decoration-clone px-1 text-inherit dark:bg-primary/30">
      {children}
    </mark>
  );
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
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-14 pt-section">
      <h2 className="border-t border-foreground/25 pt-6 font-serif type-heading">
        {label}
      </h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

type EntryLayout =
  /** One column of the two-column grid. */
  | "half"
  /** Full width, with the text beside one figure. */
  | "wide"
  /** Full width, with two figures side by side and the text under them. */
  | "pair";

/**
 * One project. Every project has the same parts in the same order: title,
 * figure with its caption, outcome, summary, then tags, links and the
 * write-up. A hairline above each one marks where it starts.
 */
function ProjectEntry({
  project,
  layout,
}: {
  project: Project;
  layout: EntryLayout;
}) {
  const title = (
    <h3 className="type-title font-semibold text-balance">{project.title}</h3>
  );
  const figures = (
    <ProjectFigures
      project={project}
      sizes={
        layout === "wide"
          ? "(min-width: 1024px) 650px, 100vw"
          : "(min-width: 640px) 540px, 100vw"
      }
      captionClassName="mt-2 type-caption text-muted-foreground"
      label={(text) => (
        <span className="font-medium text-foreground tabular-nums">{text}</span>
      )}
    />
  );
  const text = (
    <div className="space-y-2">
      {project.outcome && (
        <p className="type-body">
          <Mark>{project.outcome.metric}</Mark> {project.outcome.label}.
        </p>
      )}
      <p className="type-body text-muted-foreground">{project.summary}</p>
    </div>
  );
  const meta = (
    <div>
      <p className={LABEL}>{project.tech.join(" / ")}</p>
      {project.links && project.links.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 type-small">
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
      <details className="group/details mt-3">
        <summary className="cursor-pointer list-none rounded-sm type-small text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span className="group-open/details:hidden">Read the write-up</span>
          <span className="hidden group-open/details:inline">Close</span>
        </summary>
        <p className="mt-2 max-w-measure type-body text-foreground/90">
          {project.description}
        </p>
      </details>
    </div>
  );
  const frame = "scroll-mt-20 border-t border-border pt-6 pb-14";

  if (layout === "half") {
    return (
      // Shares the grid's rows with its neighbour, so two titles of
      // different lengths still leave the figures and text lined up.
      <article
        id={projectId(project)}
        className={cn(frame, "row-span-3 grid grid-rows-subgrid gap-y-4")}
      >
        {title}
        <div>{figures}</div>
        <div className="space-y-4">
          {text}
          {meta}
        </div>
      </article>
    );
  }

  return (
    <article
      id={projectId(project)}
      className={cn(frame, "space-y-4 sm:col-span-2")}
    >
      {title}
      {layout === "wide" ? (
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-12">
          <div className="lg:col-span-7">{figures}</div>
          <div className="space-y-4 lg:col-span-5">
            {text}
            {meta}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{figures}</div>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {text}
            {meta}
          </div>
        </>
      )}
    </article>
  );
}

/** Everything under the hero: the page's five sections. */
export function HomeSections() {
  const layouts: EntryLayout[] = projects.map((project, index) =>
    index === 0 ? "wide" : hasPair(project) ? "pair" : "half",
  );
  // An odd number of half-width entries would leave a hole in the grid, so
  // the last of them runs full width instead.
  if (layouts.filter((layout) => layout === "half").length % 2 === 1) {
    layouts[layouts.lastIndexOf("half")] = "wide";
  }

  return (
    <>
      <Section id="projects" label="Selected work">
        <div className="-mb-14 grid gap-x-8 sm:grid-cols-2">
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
              <p className="type-small text-signal tabular-nums md:col-span-2">
                {entry.dates}
              </p>
              <div className="md:col-span-4">
                <h3 className="font-semibold">{entry.role}</h3>
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
        <OffTheClock headingClassName="type-title font-semibold" />
      </Section>

      <Section id="contact" label="Contact">
        <p className="max-w-[22ch] font-serif type-display text-balance">
          {profile.availability}
        </p>
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 type-lead">
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
  );
}
