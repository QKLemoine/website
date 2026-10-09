import { ArrowUpRight, ChevronDown } from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Reveal } from "@/components/motion/reveal"
import { projects } from "@/lib/content"
import { slugify } from "@/lib/terminal/filesystem"

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
            delay={Math.min(index * 0.06, 0.24)}
            className="h-full"
          >
            {/* The id lets the agent and deep links scroll to one project. */}
            <Card
              id={`project-${slugify(project.title)}`}
              className="group/project h-full scroll-mt-20 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-foreground/15"
            >
              {project.image && (
                <Image
                  src={project.image}
                  alt=""
                  width={640}
                  height={360}
                  className="aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover/project:scale-105"
                />
              )}
              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-sm leading-relaxed text-foreground/90">
                  {project.summary}
                </p>
                {project.outcome && (
                  <p className="text-sm font-medium">{project.outcome}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <Badge key={tech} variant="secondary">
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
                          className="inline-flex items-center gap-0.5 underline-offset-4 outline-none hover:underline focus-visible:underline"
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
