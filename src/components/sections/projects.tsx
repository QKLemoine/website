import { ArrowUpRight, ChevronDown } from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Reveal } from "@/components/motion/reveal"
import { projects, type Project } from "@/lib/content"
import { slugify } from "@/lib/terminal/filesystem"

/** The project's figure. GIFs skip the image optimizer so they keep animating. */
function ProjectFigure({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  if (!project.image) return null
  return (
    <Image
      src={project.image}
      alt={project.imageAlt ?? ""}
      width={640}
      height={360}
      unoptimized={project.image.endsWith(".gif")}
      className={className}
    />
  )
}

export function Projects() {
  return (
    <section
      id="projects"
      className="mx-auto max-w-5xl scroll-mt-14 px-6 py-20"
    >
      <Reveal>
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          Projects
        </h2>
      </Reveal>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {projects.map((project, index) => (
          <Reveal
            key={project.title}
            delay={Math.min(index * 0.04, 0.12)}
            className="h-full"
          >
            {/* The id lets the agent and deep links scroll to one project. */}
            <Card
              id={`project-${slugify(project.title)}`}
              className="group/project h-full scroll-mt-20 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-foreground/15"
            >
              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                {/* A thumbnail that appears on hover or keyboard focus; its
                    space is reserved, so nothing shifts. It steps aside once
                    the card is expanded and the full figure is showing. */}
                {project.image && (
                  <CardAction
                    aria-hidden
                    className="opacity-0 transition-opacity duration-200 group-focus-within/project:opacity-100 group-hover/project:opacity-100 group-has-[details[open]]/project:opacity-0"
                  >
                    <ProjectFigure
                      project={project}
                      className="aspect-video w-24 rounded-md object-cover ring-1 ring-foreground/10"
                    />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {project.outcome && (
                  <p className="text-sm leading-snug text-muted-foreground">
                    <span className="font-semibold text-primary">
                      {project.outcome.metric}
                    </span>{" "}
                    {project.outcome.label}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-foreground/90">
                  {project.summary}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-primary">
                      {tech}
                    </Badge>
                  ))}
                </div>
                {project.links && project.links.length > 0 && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                    {project.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-primary underline-offset-4 outline-none hover:underline focus-visible:underline"
                        >
                          {link.label}
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Native <details>: the full write-up is in the HTML for
                    search engines and works without JavaScript. */}
                <details className="group/details mt-auto border-t border-border/60 pt-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    Details
                    <ChevronDown className="size-4 transition-transform group-open/details:rotate-180" />
                  </summary>
                  <ProjectFigure
                    project={project}
                    className="mt-3 aspect-video w-full rounded-md object-cover ring-1 ring-foreground/10"
                  />
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {project.description}
                  </p>
                </details>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
