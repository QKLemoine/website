import { ChevronDown } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { experience } from "@/lib/content"

export function Experience() {
  return (
    <section
      id="experience"
      className="mx-auto max-w-5xl scroll-mt-14 px-6 py-20"
    >
      <Reveal>
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          Experience
        </h2>
      </Reveal>
      <ol className="mt-6 max-w-3xl border-l border-border">
        {experience.map((entry) => {
          // Scannable by default: the first bullet is the headline, the rest
          // sit behind a disclosure.
          const [lead, ...rest] = entry.bullets
          return (
            <li
              key={`${entry.org}-${entry.dates}`}
              className="relative pb-8 pl-8 last:pb-0"
            >
              <span className="absolute top-1.5 left-0 size-2.5 -translate-x-1/2 rounded-full border-2 border-background bg-muted-foreground" />
              <Reveal>
                <h3 className="text-base font-semibold text-foreground">
                  {entry.role} · {entry.org}
                </h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                  <span>{entry.location}</span>
                  <span aria-hidden className="text-border">
                    •
                  </span>
                  <span className="text-signal">{entry.dates}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {lead}
                </p>
                {rest.length > 0 && (
                  <details className="group/details mt-2">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                      More
                      <ChevronDown className="size-4 transition-transform group-open/details:rotate-180" />
                    </summary>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/90">
                      {rest.map((bullet) => (
                        <li key={bullet.slice(0, 24)}>{bullet}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </Reveal>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
