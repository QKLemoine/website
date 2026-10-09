import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import {
  about,
  education,
  profile,
  skills,
  spokenLanguages,
} from "@/lib/content"

export function AboutApp() {
  return (
    <div className="h-full overflow-y-auto p-6 select-text">
      <div className="flex items-center gap-4">
        <Image
          src="/headshot.jpg"
          alt={profile.name}
          width={72}
          height={72}
          className="size-18 rounded-full border border-white/10 object-cover"
        />
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {profile.name}
          </h2>
          <p className="text-sm text-muted-foreground">{profile.title}</p>
          <p className="text-xs text-muted-foreground">{profile.location}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm leading-relaxed text-foreground/85">
        {about.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <Section title="Education">
        <p className="text-sm font-medium">{education.school}</p>
        <p className="text-sm text-muted-foreground">
          {education.degree} · Threads: {education.threads.join(", ")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Coursework: {education.coursework.join(", ")}
        </p>
      </Section>

      <Section title="Skills">
        <div className="space-y-3">
          {skills.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-xs text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Languages">
        <p className="text-sm text-foreground/85">
          {spokenLanguages.join(", ")} (native)
        </p>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6 border-t border-white/10 pt-4">
      <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}
