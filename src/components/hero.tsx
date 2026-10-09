import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { profile } from "@/lib/content"

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xs lg:max-w-sm">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-transparent blur-3xl dark:from-indigo-500/15 dark:via-sky-500/10 dark:to-transparent"
      />
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
    <section id="top" className="relative overflow-hidden">
      {/* Faint dot-grid, faded out toward the edges so it stays out of the way of the text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-[length:22px_22px] text-foreground/[0.07] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
      />
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
        </Reveal>
        <Reveal delay={0.15}>
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  )
}
