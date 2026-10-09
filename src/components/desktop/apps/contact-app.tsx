import { Mail } from "lucide-react"

import { GitHubIcon, LinkedInIcon } from "@/components/icons"
import { profile } from "@/lib/content"

const rowClass =
  "flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition-colors hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-ring"

export function ContactApp() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-lg font-semibold tracking-tight">Get in touch</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Open to internships and new-grad roles in ML and software engineering.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <a href={`mailto:${profile.email}`} className={rowClass}>
          <Mail className="size-4 text-muted-foreground" />
          <span className="select-text">{profile.email}</span>
        </a>
        <a
          href={profile.linkedin}
          target="_blank"
          rel="noreferrer"
          className={rowClass}
        >
          <LinkedInIcon className="size-4 text-muted-foreground" />
          LinkedIn
        </a>
        <a
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          className={rowClass}
        >
          <GitHubIcon className="size-4 text-muted-foreground" />
          GitHub
        </a>
      </div>
    </div>
  )
}
