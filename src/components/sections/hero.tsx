import Image from "next/image"

import { Mail } from "lucide-react"

import { AskPrompt } from "@/components/agent/ask-triggers"
import { GitHubIcon, LinkedInIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { profile } from "@/lib/content"

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xs lg:max-w-sm">
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-[2rem] border border-border bg-muted/60 shadow-sm">
        <Image
          src="/headshot.jpg"
          alt={profile.name}
          fill
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 20rem, 80vw"
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section id="top">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 py-24 sm:py-32 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <Reveal className="flex flex-col items-start gap-6">
          <p className="text-xl font-medium text-muted-foreground">
            Hi, I&apos;m {profile.name.split(" ")[0]}
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {profile.title}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-balance">
            {profile.pitch}
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
          <AskPrompt />
        </Reveal>
        <Reveal delay={0.15}>
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  )
}
