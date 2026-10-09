import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GitHubIcon, LinkedInIcon } from "@/components/icons"
import { Reveal } from "@/components/motion/reveal"
import { profile } from "@/lib/content"

export function Contact() {
  return (
    <section
      id="contact"
      className="mx-auto max-w-5xl scroll-mt-14 px-6 py-20"
    >
      <Reveal>
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          Contact
        </h2>
        <div className="mt-6 flex flex-col items-start gap-4">
          <p className="max-w-xl text-lg text-muted-foreground">
            I&apos;m open to internships and new-grad roles in ML and
            software engineering. Feel free to reach out.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              nativeButton={false}
              render={<a href={`mailto:${profile.email}`} />}
            >
              <Mail className="size-4" />
              {profile.email}
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a href={profile.linkedin} target="_blank" rel="noreferrer" />
              }
            >
              <LinkedInIcon className="size-4" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a href={profile.github} target="_blank" rel="noreferrer" />
              }
            >
              <GitHubIcon className="size-4" />
              GitHub
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
