import Link from "next/link"

import { about, experience, profile, projects, skills } from "@/lib/content"

/**
 * Server-rendered, script-free version of the portfolio content for the
 * homepage: the HTML crawlers and link previews read, and what small screens
 * and no-JS visitors see in place of the desktop.
 */
export function StaticPortfolio() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <p className="text-sm font-medium text-muted-foreground">
        {profile.location}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {profile.name}
      </h1>
      <p className="mt-1 text-lg text-muted-foreground">{profile.title}</p>
      <p className="mt-4 text-base leading-relaxed">{profile.pitch}</p>

      <nav
        aria-label="Links"
        className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium underline underline-offset-4"
      >
        <Link href="/classic">Full portfolio</Link>
        <a href={`mailto:${profile.email}`}>Email</a>
        <a href={profile.linkedin}>LinkedIn</a>
        <a href={profile.github}>GitHub</a>
      </nav>

      <Section title="About">
        <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
          {about.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section title="Projects">
        <ul className="space-y-5">
          {projects.map((project) => (
            <li key={project.title}>
              <h3 className="text-base font-semibold">{project.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                {project.description}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {project.tech.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Experience">
        <ul className="space-y-4">
          {experience.map((entry) => (
            <li key={`${entry.org}-${entry.dates}`}>
              <h3 className="text-base font-semibold">
                {entry.role} · {entry.org}
              </h3>
              <p className="text-xs text-muted-foreground">
                {entry.location} · {entry.dates}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Skills">
        <ul className="space-y-1 text-sm">
          {skills.map((group) => (
            <li key={group.label}>
              <span className="font-medium">{group.label}:</span>{" "}
              <span className="text-foreground/90">
                {group.items.join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </main>
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
    <section className="mt-12">
      <h2 className="mb-4 text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}
