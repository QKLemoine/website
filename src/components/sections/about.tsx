import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/motion/reveal"
import { about, education, skills } from "@/lib/content"

export function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl scroll-mt-14 px-6 py-20">
      <Reveal>
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          About
        </h2>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5 text-base leading-relaxed text-foreground/90">
            {about.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold">Education</h3>
              <p className="mt-1.5 text-sm text-foreground/90">
                {education.school}
              </p>
              <p className="text-sm text-muted-foreground">
                {education.degree} · {education.threads.join(" & ")} threads
              </p>
            </div>
            {skills.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold">{group.label}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
