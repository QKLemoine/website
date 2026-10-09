"use client"

import { ChevronLeft, Folder } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { projects } from "@/lib/content"

export function ProjectsApp() {
  const [openTitle, setOpenTitle] = useState<string | null>(null)
  const project = projects.find((p) => p.title === openTitle)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-white/10 px-2 text-xs text-muted-foreground">
        <button
          type="button"
          aria-label="Back to all projects"
          disabled={!project}
          onClick={() => setOpenTitle(null)}
          className="flex size-6 items-center justify-center rounded-md outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className={project ? undefined : "text-foreground/90"}>
          Projects
        </span>
        {project && (
          <>
            <span aria-hidden>/</span>
            <span className="truncate text-foreground/90">{project.title}</span>
          </>
        )}
      </div>

      {project ? (
        <article className="min-h-0 flex-1 overflow-y-auto p-6 select-text">
          <h2 className="text-lg font-semibold tracking-tight">
            {project.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">
            {project.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tech.map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>
        </article>
      ) : (
        <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] content-start gap-2 overflow-y-auto p-4">
          {projects.map((p) => (
            <li key={p.title}>
              <button
                type="button"
                onClick={() => setOpenTitle(p.title)}
                className="flex w-full flex-col items-center gap-2 rounded-lg p-3 text-center outline-none hover:bg-white/[0.06] focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Folder
                  className="size-12 fill-sky-400/25 text-sky-400"
                  strokeWidth={1.25}
                />
                <span className="text-xs leading-snug text-foreground/90">
                  {p.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
