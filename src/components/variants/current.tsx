import { OffTheClock } from "@/components/off-the-clock/off-the-clock"
import { About } from "@/components/sections/about"
import { Contact } from "@/components/sections/contact"
import { Experience } from "@/components/sections/experience"
import { Hero } from "@/components/sections/hero"
import { Projects } from "@/components/sections/projects"

export const CURRENT_WIDTH = "max-w-5xl"

/** The design as it was before the style exploration, kept for comparison. */
export function CurrentVariant() {
  return (
    <>
      <Hero />
      <Projects />
      <About />
      <Experience />
      <section
        id="off-the-clock"
        className="mx-auto max-w-5xl scroll-mt-14 px-6 py-20"
      >
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          Off the clock
        </h2>
        <div className="mt-6">
          <OffTheClock />
        </div>
      </section>
      <Contact />
    </>
  )
}
