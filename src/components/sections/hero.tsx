import Image from "next/image"

import { Mail } from "lucide-react"

import { AskPrompt } from "@/components/agent/ask-triggers"
import { BackgroundLayer } from "@/components/background/background-layer"
import { GitHubIcon, LinkedInIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { askExamples, profile } from "@/lib/content"

import { ScrollIndicator } from "./scroll-indicator"

function HeroVisual() {
  return (
    // 28vw clamped to 9rem-21rem: about 336px on a desktop, 120px on a phone,
    // never full width. The corner radius scales with it.
    <div className="relative aspect-4/5 w-[clamp(7.5rem,28vw,21rem)] overflow-hidden rounded-[clamp(0.75rem,2.2vw,1.5rem)] border border-border bg-muted/60 shadow-sm">
      <Image
        src="/headshot.jpg"
        alt={profile.name}
        fill
        sizes="(min-width: 1200px) 336px, (min-width: 430px) 28vw, 120px"
        className="object-cover"
        preload
      />
    </div>
  )
}

/** The title, with its one highlighted part in the accent colour. */
function HeroTitle() {
  const { title, titleHighlight } = profile
  const start = title.indexOf(titleHighlight)
  if (start < 0) return title
  return (
    <>
      {title.slice(0, start)}
      <span className="text-primary">{titleHighlight}</span>
      {title.slice(start + titleHighlight.length)}
    </>
  )
}

export function Hero() {
  return (
    // Viewport height minus the 3.5rem nav and 3rem more, so the top of the
    // next section peeks above the fold. svh avoids a jump when mobile browser
    // bars collapse. `isolate` keeps the background behind this section only.
    <section
      id="top"
      className="relative isolate flex min-h-[calc(100svh-3.5rem-3rem)] flex-col"
    >
      <BackgroundLayer fadeOnScroll />
      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 content-center items-center gap-6 px-6 py-6 sm:gap-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <Reveal className="flex flex-col items-start gap-4 sm:gap-6">
          <p className="text-xl font-medium text-muted-foreground">
            Hi, I&apos;m {profile.name.split(" ")[0]}
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            <HeroTitle />
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-balance">
            {profile.pitch}
          </p>
          <p className="max-w-xl text-sm text-muted-foreground">
            <span className="font-medium text-signal">Currently:</span>{" "}
            {profile.currently}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="lg"
              nativeButton={false}
              render={<a href="#projects" />}
            >
              View Projects
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<a href="#contact" />}
            >
              Get in Touch
            </Button>
          </div>
          <ul className="flex items-center gap-1 text-muted-foreground">
            {[
              { label: "GitHub", href: profile.github, icon: GitHubIcon },
              { label: "LinkedIn", href: profile.linkedin, icon: LinkedInIcon },
              { label: "Email", href: `mailto:${profile.email}`, icon: Mail },
            ].map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-lg transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Icon className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
          <AskPrompt examples={askExamples} />
        </Reveal>
        <Reveal delay={0.1} className="order-first lg:order-none">
          <HeroVisual />
        </Reveal>
      </div>
      <div className="pb-5">
        <ScrollIndicator targetId="projects" />
      </div>
    </section>
  )
}
