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
        {experience.map((entry) => (
          <li
            key={`${entry.org}-${entry.dates}`}
            className="relative pb-10 pl-8 last:pb-0"
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
                <span>{entry.dates}</span>
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/90">
                {entry.bullets.map((bullet) => (
                  <li key={bullet.slice(0, 24)}>{bullet}</li>
                ))}
              </ul>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}
