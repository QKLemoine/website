import { Reveal } from "@/components/motion/reveal"
import { about } from "@/lib/content"

export function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl scroll-mt-14 px-6 py-20">
      <Reveal>
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          About
        </h2>
        <div className="mt-6 max-w-3xl space-y-5 text-base leading-relaxed text-foreground/90 sm:text-lg">
          {about.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
