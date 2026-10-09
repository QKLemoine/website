import Image from "next/image"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/motion/reveal"
import { projects } from "@/lib/content"

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
            <Card className="group/project h-full transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-foreground/15">
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
              <CardContent className="flex flex-col gap-4">
                <CardDescription className="text-sm leading-relaxed">
                  {project.description}
                </CardDescription>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
